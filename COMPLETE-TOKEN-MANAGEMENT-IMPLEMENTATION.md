# Complete Token Management Implementation

## ✅ What Has Been Created

### 1. Token Counter Service ✅
**File:** `backend/src/modules/conversations/services/token-counter.service.ts`

**Features:**
- Token estimation (1 token ≈ 4 characters)
- Message token counting
- Total context calculation
- Cost calculation per model
- Context window limits per model
- Recommended maxTokens calculation

### 2. Conversation Metrics Entity ✅
**File:** `backend/src/modules/conversations/entities/conversation-metrics.entity.ts`

**Tracks:**
- Prompt tokens (input)
- Completion tokens (output)
- Total tokens
- System/history/RAG/user token breakdown
- Cost per message
- Message counts and document counts

### 3. Database Migration ✅
**File:** `backend/src/migrations/017-create-conversation-metrics-table.sql`

Creates `conversation_metrics` table with indexes.

### 4. Agent Token Budget Fields ✅
**File:** `backend/src/migrations/018-add-agent-token-budgets.sql`

Adds to agents table:
- `max_context_tokens` (default: 6000)
- `max_history_tokens` (default: 3000)
- `max_rag_tokens` (default: 1500)
- `enable_summarization` (default: false)
- `summarize_threshold` (default: 10)

### 5. Agent Entity Updated ✅
**File:** `backend/src/modules/agents/entities/agent.entity.ts`

Added token budget fields.

### 6. Conversations Module Updated ✅
**File:** `backend/src/modules/conversations/conversations.module.ts`

Added:
- ConversationMetrics entity
- TokenCounterService

---

## 🔧 Remaining Implementation Steps

### Step 1: Update ConversationsService

Add these methods to `backend/src/modules/conversations/conversations.service.ts`:

```typescript
// Add to imports
import { ConversationMetrics } from './entities/conversation-metrics.entity';
import { TokenCounterService } from './services/token-counter.service';

// Add to constructor
constructor(
  // ... existing repositories
  @InjectRepository(ConversationMetrics)
  private metricsRepository: Repository<ConversationMetrics>,
  // ... existing services
  private tokenCounterService: TokenCounterService,
) {}

// Add these new methods:

/**
 * Get token-aware conversation history
 * Loads messages until token budget is reached
 */
private async getTokenAwareHistory(
  conversationId: string,
  maxTokens: number = 3000
): Promise<Message[]> {
  const allMessages = await this.messagesRepository.find({
    where: { conversationId },
    order: { createdAt: 'ASC' }
  });
  
  // Start from most recent and work backwards
  const history: Message[] = [];
  let tokenCount = 0;
  
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i];
    const msgTokens = this.tokenCounterService.estimateTokens(msg.content);
    
    if (tokenCount + msgTokens > maxTokens) {
      break; // Stop if we exceed limit
    }
    
    history.unshift(msg); // Add to beginning (oldest first)
    tokenCount += msgTokens;
  }
  
  this.logger.debug(
    `Loaded ${history.length} messages using ${tokenCount}/${maxTokens} tokens`
  );
  
  return history;
}

/**
 * Get RAG context with token limit
 */
private async getTokenAwareRagContext(
  query: string,
  organizationId: string,
  maxTokens: number = 1500,
  topK: number = 10,
  threshold: number = 0.7
): Promise<{ context: string; sources: any[]; tokensUsed: number }> {
  // Get more candidates than needed
  const results = await this.vectorStoreService.searchSimilar(
    query,
    organizationId,
    topK,
    threshold
  );
  
  // Select best fit within token budget
  let context = '';
  let tokenCount = 0;
  const sources = [];
  
  for (const result of results) {
    const chunkText = `[Source: ${result.metadata?.documentTitle || 'Document'}]\n${result.content}\n\n`;
    const chunkTokens = this.tokenCounterService.estimateTokens(chunkText);
    
    if (tokenCount + chunkTokens > maxTokens) {
      break; // Stop if would exceed budget
    }
    
    context += chunkText;
    tokenCount += chunkTokens;
    sources.push(result);
  }
  
  this.logger.debug(
    `Loaded ${sources.length} RAG sources using ${tokenCount}/${maxTokens} tokens`
  );
  
  return { context, sources, tokensUsed: tokenCount };
}

/**
 * Save token usage metrics
 */
private async saveMetrics(data: {
  conversationId: string;
  messageId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  systemTokens: number;
  historyTokens: number;
  ragTokens: number;
  userMessageTokens: number;
  historyMessagesCount: number;
  ragDocumentsUsed: number;
}): Promise<void> {
  const totalTokens = data.promptTokens + data.completionTokens;
  const cost = this.tokenCounterService.calculateCost({
    promptTokens: data.promptTokens,
    completionTokens: data.completionTokens,
    model: data.model
  });
  
  const metrics = this.metricsRepository.create({
    conversationId: data.conversationId,
    messageId: data.messageId,
    model: data.model,
    promptTokens: data.promptTokens,
    completionTokens: data.completionTokens,
    totalTokens,
    systemTokens: data.systemTokens,
    historyTokens: data.historyTokens,
    ragTokens: data.ragTokens,
    userMessageTokens: data.userMessageTokens,
    cost,
    historyMessagesCount: data.historyMessagesCount,
    ragDocumentsUsed: data.ragDocumentsUsed,
  });
  
  await this.metricsRepository.save(metrics);
  
  this.logger.log(
    `Saved metrics: ${totalTokens} tokens, $${cost.toFixed(4)} cost`
  );
}
```

### Step 2: Update sendMessage Method

Find the `sendMessage` method and update it:

```typescript
async sendMessage(
  conversationId: string,
  messageDto: SendMessageDto,
  userId: string,
  organizationId: string
) {
  // ... existing conversation and agent loading ...
  
  const agent = conversation.agent;
  const systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
  
  // Use token-aware history instead of fixed 10 messages
  const historyMessages = await this.getTokenAwareHistory(
    conversationId,
    agent.maxHistoryTokens || 3000
  );
  
  // Get RAG context with token limit
  let contextFromDocs = '';
  let ragSources = [];
  let ragTokensUsed = 0;
  
  if (agent.useKnowledgeBase) {
    const ragResult = await this.getTokenAwareRagContext(
      messageDto.content,
      organizationId,
      agent.maxRagTokens || 1500,
      agent.knowledgeBaseMaxResults || 10,
      agent.knowledgeBaseThreshold || 0.7
    );
    contextFromDocs = ragResult.context;
    ragSources = ragResult.sources;
    ragTokensUsed = ragResult.tokensUsed;
  }
  
  // Calculate context token usage
  const systemTokens = this.tokenCounterService.estimateTokens(systemPrompt);
  const historyTokens = this.tokenCounterService.countMessageTokens(
    historyMessages.map(m => ({ content: m.content, role: m.role }))
  );
  const userMessageTokens = this.tokenCounterService.estimateTokens(messageDto.content);
  
  const totalContextTokens = systemTokens + historyTokens + ragTokensUsed + userMessageTokens;
  
  // Log context usage
  this.logger.log(
    `Context: ${totalContextTokens} tokens ` +
    `(system: ${systemTokens}, history: ${historyTokens}, ` +
    `RAG: ${ragTokensUsed}, user: ${userMessageTokens})`
  );
  
  // Check if we're approaching limit
  const contextWindow = this.tokenCounterService.getModelContextWindow(agent.model);
  if (totalContextTokens > contextWindow * 0.8) {
    this.logger.warn(
      `Approaching context limit: ${totalContextTokens}/${contextWindow} tokens`
    );
  }
  
  // Update system prompt with RAG context
  const fullSystemPrompt = contextFromDocs
    ? `${systemPrompt}\n\nRelevant information:\n${contextFromDocs}`
    : systemPrompt;
  
  // ... rest of LLM call ...
  
  const response = await llm.invoke(messages);
  
  // Extract token usage from response
  const usage = response.response_metadata?.usage || {
    prompt_tokens: totalContextTokens,
    completion_tokens: this.tokenCounterService.estimateTokens(response.content)
  };
  
  // Save user message
  const userMessage = this.messagesRepository.create({
    conversationId: conversation.id,
    role: 'user',
    content: messageDto.content,
  });
  await this.messagesRepository.save(userMessage);
  
  // Save AI message
  const aiMessage = this.messagesRepository.create({
    conversationId: conversation.id,
    role: 'assistant',
    content: response.content,
  });
  await this.messagesRepository.save(aiMessage);
  
  // Save metrics
  await this.saveMetrics({
    conversationId: conversation.id,
    messageId: aiMessage.id,
    model: agent.model,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    systemTokens,
    historyTokens,
    ragTokens: ragTokensUsed,
    userMessageTokens,
    historyMessagesCount: historyMessages.length,
    ragDocumentsUsed: ragSources.length,
  });
  
  return {
    message: aiMessage,
    metadata: {
      tokensUsed: usage.prompt_tokens + usage.completion_tokens,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      cost: this.tokenCounterService.calculateCost({
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        model: agent.model
      }),
      sourcesUsed: ragSources.length,
      historyLength: historyMessages.length,
    }
  };
}
```

### Step 3: Add Metrics Endpoints

**File:** `backend/src/modules/conversations/conversations.controller.ts`

```typescript
/**
 * Get conversation token usage stats
 */
@Get(':id/metrics')
async getConversationMetrics(
  @Param('id') conversationId: string,
  @CurrentUser() user: any
) {
  const metrics = await this.conversationsService.getConversationMetrics(
    conversationId,
    user.organizationId
  );
  return metrics;
}

/**
 * Get user's total token usage
 */
@Get('metrics/total')
async getTotalMetrics(@CurrentUser() user: any) {
  const metrics = await this.conversationsService.getUserTotalMetrics(
    user.id,
    user.organizationId
  );
  return metrics;
}
```

Add to ConversationsService:

```typescript
/**
 * Get metrics for a conversation
 */
async getConversationMetrics(
  conversationId: string,
  organizationId: string
): Promise<{
  totalTokens: number;
  totalCost: number;
  messageCount: number;
  avgTokensPerMessage: number;
  breakdown: any;
}> {
  const conversation = await this.conversationsRepository.findOne({
    where: { id: conversationId, userId_organizationId: organizationId },
  });
  
  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }
  
  const metrics = await this.metricsRepository.find({
    where: { conversationId },
    order: { createdAt: 'ASC' }
  });
  
  const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
  const totalCost = metrics.reduce((sum, m) => sum + Number(m.cost), 0);
  
  return {
    totalTokens,
    totalCost,
    messageCount: metrics.length,
    avgTokensPerMessage: metrics.length > 0 ? Math.round(totalTokens / metrics.length) : 0,
    breakdown: {
      promptTokens: metrics.reduce((sum, m) => sum + m.promptTokens, 0),
      completionTokens: metrics.reduce((sum, m) => sum + m.completionTokens, 0),
      systemTokens: metrics.reduce((sum, m) => sum + m.systemTokens, 0),
      historyTokens: metrics.reduce((sum, m) => sum + m.historyTokens, 0),
      ragTokens: metrics.reduce((sum, m) => sum + m.ragTokens, 0),
    }
  };
}

/**
 * Get total metrics for a user
 */
async getUserTotalMetrics(userId: string, organizationId: string) {
  const conversations = await this.conversationsRepository.find({
    where: { userId, userId_organizationId: organizationId },
    select: ['id']
  });
  
  const conversationIds = conversations.map(c => c.id);
  
  if (conversationIds.length === 0) {
    return {
      totalTokens: 0,
      totalCost: 0,
      conversationCount: 0,
      messageCount: 0
    };
  }
  
  const metrics = await this.metricsRepository
    .createQueryBuilder('metrics')
    .where('metrics.conversation_id IN (:...ids)', { ids: conversationIds })
    .getMany();
  
  return {
    totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
    totalCost: metrics.reduce((sum, m) => sum + Number(m.cost), 0),
    conversationCount: conversations.length,
    messageCount: metrics.length,
  };
}
```

---

## 🚀 Deployment Steps

### 1. Run Migrations

```bash
cd backend

# Run the new migrations
psql $DATABASE_URL -f src/migrations/017-create-conversation-metrics-table.sql
psql $DATABASE_URL -f src/migrations/018-add-agent-token-budgets.sql
```

### 2. Rebuild Backend

```bash
npm run build
```

### 3. Restart Backend

```bash
npm run start:dev
```

### 4. Test Token Management

```bash
# Send a message and check response includes metadata
curl -X POST http://localhost:4000/conversations/:id/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, tell me about AI"
  }'

# Response should include:
# {
#   "message": {...},
#   "metadata": {
#     "tokensUsed": 1234,
#     "promptTokens": 234,
#     "completionTokens": 1000,
#     "cost": 0.037,
#     "sourcesUsed": 3,
#     "historyLength": 8
#   }
# }

# Get conversation metrics
curl http://localhost:4000/conversations/:id/metrics \
  -H "Authorization: Bearer $TOKEN"

# Get total user metrics
curl http://localhost:4000/conversations/metrics/total \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 What You'll Get

### 1. Smart History Loading
- Loads messages based on token budget, not fixed count
- More efficient context usage
- Adapts to message length

### 2. Smart RAG Context
- Retrieves documents within token budget
- Dynamic number of sources
- Better context quality

### 3. Token Tracking
- Every message tracked
- Cost calculated automatically
- Historical analytics

### 4. Usage Analytics
- Per conversation stats
- Per user totals
- Cost breakdowns
- Token usage patterns

### 5. Better Control
- Configurable token budgets per agent
- Context window awareness
- Prevents exceeding limits

---

## 🎯 Benefits

**Before:**
- Fixed 10 messages (could be 500 or 5000 tokens)
- No token tracking
- Risk of exceeding context window
- No cost visibility

**After:**
- Dynamic history (always optimized)
- Full token tracking
- Safe context management
- Complete cost transparency

---

## 📈 Expected Performance

**Typical Conversation:**
- System: 200 tokens
- History (8 msgs): 1200 tokens
- RAG (3 docs): 900 tokens
- User: 50 tokens
- **Total Input: 2350 tokens**
- Response: 1500 tokens
- **Total: 3850 tokens**
- **Cost: ~$0.12 per message** (GPT-4)

**With Optimization:**
- Better token utilization
- Lower costs (fewer wasted tokens)
- Longer conversations possible
- Better context quality

---

## 🔧 Quick Implementation

If you want me to implement all the code changes automatically, I can:

1. Update conversations.service.ts with all methods
2. Update conversations.controller.ts with metrics endpoints
3. Test the implementation
4. Verify everything works

**Would you like me to complete the implementation now?**

Or would you prefer to implement it gradually yourself using this guide?
