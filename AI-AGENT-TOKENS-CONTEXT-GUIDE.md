# AI Agent Usage: Tokens, Context Windows & Optimization Guide

## 🎯 Overview

This guide explains how Objecta Labs handles AI agent conversations, token management, context windows, and RAG (Retrieval Augmented Generation).

---

## 📊 Current Implementation

### Agent Configuration

Each agent has these configurable parameters:

```typescript
{
  model: 'gpt-4',              // LLM model to use
  temperature: 0.7,            // Creativity (0-1)
  maxTokens: 2000,             // Maximum tokens in response
  systemPrompt: '...',         // Agent personality/instructions
  
  // RAG Settings
  useKnowledgeBase: false,     // Enable document search
  knowledgeBaseMaxResults: 3,  // How many documents to retrieve
  knowledgeBaseThreshold: 0.7  // Minimum similarity score
}
```

---

## 🔢 Token Management

### What are Tokens?

Tokens are pieces of text that LLMs process:
- **1 token** ≈ 4 characters
- **1 token** ≈ 0.75 words
- **"Hello world!"** ≈ 3 tokens

### Token Calculation

```
Total Tokens = System Prompt + Conversation History + RAG Context + User Message + Response
```

**Example:**
```
System Prompt:     200 tokens
Conversation (10): 1500 tokens
RAG Context:       500 tokens
User Message:      50 tokens
Response:          2000 tokens (max)
────────────────────────────────
TOTAL:             4250 tokens
```

### Current Limits

| Model | Context Window | Output Tokens | Current Setting |
|-------|----------------|---------------|-----------------|
| GPT-4 | 8,192 tokens | 4,096 tokens | maxTokens: 2000 |
| GPT-4 Turbo | 128,000 tokens | 4,096 tokens | maxTokens: 2000 |
| GPT-3.5 Turbo | 4,096 tokens | 4,096 tokens | maxTokens: 2000 |
| GPT-3.5-16k | 16,384 tokens | 4,096 tokens | maxTokens: 2000 |

---

## 💬 Conversation History Management

### Current Implementation

```typescript
// conversations.service.ts line 78-84
const historyMessages = await this.messagesRepository.find({
  where: { conversationId: conversation.id },
  order: { createdAt: 'DESC' },
  take: 10,  // ⚠️ Only last 10 messages
});
historyMessages.reverse(); // Oldest first
```

**Problem:** Fixed 10-message limit doesn't consider token count!

### Token-Aware History (Recommended)

```typescript
async getConversationHistory(
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
    const msgTokens = this.estimateTokens(msg.content);
    
    if (tokenCount + msgTokens > maxTokens) {
      break; // Stop if we exceed limit
    }
    
    history.unshift(msg); // Add to beginning
    tokenCount += msgTokens;
  }
  
  return history;
}

private estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

---

## 📚 RAG (Knowledge Base Integration)

### Current Flow

```
User Message
    ↓
Search Knowledge Base (if enabled)
    ↓
Find top 3 similar documents
    ↓
Add to system prompt as context
    ↓
Send to LLM with full context
```

### RAG Configuration

```typescript
// Agent settings
{
  useKnowledgeBase: true,
  knowledgeBaseMaxResults: 3,     // How many chunks to retrieve
  knowledgeBaseThreshold: 0.7     // Minimum similarity (0-1)
}
```

### RAG Token Usage

**Each retrieved document chunk:**
- Average: 200-500 tokens
- 3 chunks: 600-1500 tokens

**Example RAG context:**
```
[Source 1: Product Manual]
The widget has three modes: Auto, Manual, and Sleep...
(~400 tokens)

[Source 2: FAQ Document]
Q: How do I reset? A: Press and hold the button...
(~300 tokens)

[Source 3: User Guide]
Safety instructions: Always wear protective gear...
(~350 tokens)

Total RAG Context: ~1050 tokens
```

---

## 🎛️ Optimizing Token Usage

### 1. Smart History Truncation

**Current (Fixed Count):**
```typescript
take: 10  // Always 10 messages, regardless of length
```

**Recommended (Token-Based):**
```typescript
// Allocate tokens strategically
const contextBudget = {
  systemPrompt: 500,
  rag: 1500,
  history: 3000,
  userMessage: 500,
  response: 2000
};
// Total: 7500 tokens (fits in GPT-4)
```

### 2. Summarization for Long Conversations

When conversation exceeds token limit:

```typescript
async summarizeOldMessages(messages: Message[]): Promise<string> {
  // Take first half of conversation
  const oldMessages = messages.slice(0, Math.floor(messages.length / 2));
  
  // Generate summary
  const summary = await llm.invoke([
    new SystemMessage('Summarize this conversation in 2-3 sentences'),
    new HumanMessage(oldMessages.map(m => `${m.role}: ${m.content}`).join('\n'))
  ]);
  
  return `[Previous conversation summary: ${summary}]`;
}
```

### 3. Smart RAG Context

**Current:** Fixed 3 documents

**Recommended:** Token-aware retrieval

```typescript
async getRelevantContext(
  query: string,
  organizationId: string,
  maxTokens: number = 1500
): Promise<{ context: string; sources: any[] }> {
  // Get more candidates
  const results = await this.vectorStoreService.searchSimilar(
    query,
    organizationId,
    10, // Get 10 candidates
    0.6  // Lower threshold
  );
  
  // Select best fit within token budget
  let context = '';
  let tokenCount = 0;
  const sources = [];
  
  for (const result of results) {
    const tokens = this.estimateTokens(result.content);
    
    if (tokenCount + tokens > maxTokens) {
      break;
    }
    
    context += `[Source: ${result.metadata.documentTitle}]\n${result.content}\n\n`;
    tokenCount += tokens;
    sources.push(result);
  }
  
  return { context, sources };
}
```

---

## 📈 Context Window Strategies

### Strategy 1: Sliding Window (Current)

```
[MSG1][MSG2][MSG3]...[MSG8][MSG9][MSG10] → LLM
                     └─ Only last 10 ─┘
```

**Pros:**
- Simple implementation
- Predictable

**Cons:**
- Loses important early context
- No token awareness

### Strategy 2: Token-Aware Window (Recommended)

```
Calculate tokens backward from most recent until budget reached
[MSG4][MSG5][MSG6][MSG7][MSG8][MSG9][MSG10] → LLM
└────────── Fits in 3000 tokens ────────────┘
```

**Pros:**
- Maximizes context use
- Adapts to message length
- Never exceeds limits

### Strategy 3: Summarized History

```
[SUMMARY of MSG1-5][MSG6][MSG7][MSG8][MSG9][MSG10] → LLM
└─ 200 tokens ───┘└──────── 2800 tokens ──────────┘
```

**Pros:**
- Retains full conversation context
- Efficient token use

**Cons:**
- Additional LLM call for summary
- Potential information loss

### Strategy 4: Hierarchical Context (Advanced)

```
Priority Levels:
1. Current user message (always included)
2. System prompt (always included)
3. Most recent 2 messages (high priority)
4. RAG context (medium priority)
5. Older messages (fill remaining budget)
```

---

## 🔧 Implementation Recommendations

### 1. Add Token Counting

```typescript
// backend/src/modules/conversations/token-counter.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenCounterService {
  /**
   * Estimate token count (rough approximation)
   * For accurate counting, use tiktoken library
   */
  estimateTokens(text: string): number {
    // Simple estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Count tokens in messages
   */
  countMessageTokens(messages: any[]): number {
    let total = 0;
    for (const msg of messages) {
      total += this.estimateTokens(msg.content);
      total += 4; // Overhead per message
    }
    return total;
  }
  
  /**
   * Check if messages fit in context window
   */
  fitsInContext(
    systemPrompt: string,
    messages: any[],
    ragContext: string,
    maxContextTokens: number
  ): boolean {
    const total = 
      this.estimateTokens(systemPrompt) +
      this.countMessageTokens(messages) +
      this.estimateTokens(ragContext);
    
    return total <= maxContextTokens;
  }
}
```

### 2. Update Agent Entity

```typescript
// Add to agent.entity.ts
@Column({ name: 'max_context_tokens', default: 6000 })
maxContextTokens: number;

@Column({ name: 'max_history_tokens', default: 3000 })
maxHistoryTokens: number;

@Column({ name: 'max_rag_tokens', default: 1500 })
maxRagTokens: number;
```

### 3. Smart History Loading

```typescript
// Update sendMessage in conversations.service.ts
async sendMessage(...) {
  // Token-aware history loading
  const historyMessages = await this.getTokenAwareHistory(
    conversationId,
    agent.maxHistoryTokens || 3000
  );
  
  // Token-aware RAG context
  const { context: contextFromDocs, sources } = await this.getRelevantContext(
    messageDto.content,
    organizationId,
    agent.maxRagTokens || 1500
  );
  
  // Verify total fits in context window
  const totalTokens = 
    this.tokenCounter.estimateTokens(systemPrompt) +
    this.tokenCounter.countMessageTokens(historyMessages) +
    this.tokenCounter.estimateTokens(contextFromDocs) +
    this.tokenCounter.estimateTokens(messageDto.content);
  
  if (totalTokens > agent.maxContextTokens) {
    // Reduce history or RAG context
    this.logger.warn(`Context too large: ${totalTokens} tokens`);
  }
}
```

---

## 📊 Usage Analytics

### Track Token Usage

```typescript
// Store per conversation
interface ConversationMetrics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  ragTokensUsed: number;
  cost: number; // Based on model pricing
}

// After each message
await this.saveMetrics({
  conversationId,
  totalTokens: response.usage.total_tokens,
  inputTokens: response.usage.prompt_tokens,
  outputTokens: response.usage.completion_tokens,
  ragTokensUsed: estimateTokens(contextFromDocs),
  cost: calculateCost(response.usage, agent.model)
});
```

### Cost Calculation

```typescript
function calculateCost(usage: any, model: string): number {
  const pricing = {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
  };
  
  const price = pricing[model] || pricing['gpt-3.5-turbo'];
  
  return (
    usage.prompt_tokens * price.input +
    usage.completion_tokens * price.output
  );
}
```

---

## 🎯 Best Practices

### 1. Set Appropriate Token Limits

```typescript
// For different use cases
const configurations = {
  'quick-qa': {
    maxTokens: 500,
    maxHistoryTokens: 1000,
    maxRagTokens: 500
  },
  'detailed-analysis': {
    maxTokens: 2000,
    maxHistoryTokens: 4000,
    maxRagTokens: 2000
  },
  'long-conversation': {
    maxTokens: 1000,
    maxHistoryTokens: 6000,
    maxRagTokens: 1000
  }
};
```

### 2. Monitor and Alert

```typescript
// Alert if approaching limits
if (totalTokens > agent.maxContextTokens * 0.9) {
  this.logger.warn(`Approaching token limit: ${totalTokens}/${agent.maxContextTokens}`);
  
  // Notify user
  // Consider summarizing older messages
}
```

### 3. User Communication

```typescript
// Show token usage to users
return {
  message: aiMessage,
  metadata: {
    tokensUsed: totalTokens,
    estimatedCost: calculateCost(usage, agent.model),
    sourcesUsed: sources.length,
    contextLength: historyMessages.length
  }
};
```

---

## 🚀 Quick Wins

### Immediate Improvements (Low Effort, High Impact)

1. **Replace fixed 10-message limit** with token-based limit
2. **Add token estimation** to gauge context usage
3. **Implement token budgets** for system/history/RAG
4. **Track token usage** for analytics

### Code Changes

**File:** `backend/src/modules/conversations/conversations.service.ts`

**Line 78-84:** Replace with token-aware history loading

**Add:** Token counter service

**Add:** Configuration for token budgets

---

## 📚 Further Reading

- OpenAI Tokenizer: https://platform.openai.com/tokenizer
- tiktoken (accurate token counting): https://github.com/openai/tiktoken
- LangChain Context Management: https://js.langchain.com/docs/modules/memory/
- Cost Optimization: Monitor token usage and optimize prompts

---

## 🎯 Summary

**Current State:**
- ✅ Basic conversation history (10 messages)
- ✅ RAG integration (3 documents)
- ✅ Configurable maxTokens
- ⚠️ No token awareness
- ⚠️ Fixed message count

**Recommended Improvements:**
1. Token-based history truncation
2. Smart RAG context selection
3. Conversation summarization
4. Usage tracking and analytics
5. Cost monitoring

**Expected Benefits:**
- Better context utilization
- Lower costs
- Longer conversations
- More relevant RAG results
- Usage insights

---

**Need help implementing these improvements? Let me know which feature you'd like to focus on!**
