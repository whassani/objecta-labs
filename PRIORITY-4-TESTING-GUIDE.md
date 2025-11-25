# Priority 4: Agent RAG Integration - Testing Guide

## Prerequisites

Ensure you have completed Priority 2 & 3:
- ✅ Document upload working
- ✅ Vector search functional
- ✅ Documents indexed in Qdrant
- ✅ Ollama and Qdrant running

## Quick Test Flow

### Step 1: Prepare Knowledge Base

1. **Upload test documents**
   ```bash
   # Navigate to Knowledge Base → Documents
   # Upload documents with clear, searchable content
   ```

2. **Verify indexing**
   ```bash
   curl http://localhost:6333/collections/objecta_labs
   # Should show vectors indexed
   ```

3. **Test search (optional)**
   ```bash
   # Use the Search button to verify documents are searchable
   ```

### Step 2: Create RAG-Enabled Agent

1. **Navigate to Agents → New Agent**

2. **Fill in agent details:**
   - Name: "Documentation Assistant"
   - Description: "Answers questions about our docs"
   - System Prompt: "You are a helpful assistant that answers questions based on our documentation. Always cite your sources."
   - Model: "gpt-4" or "mistral" (Ollama)

3. **Enable RAG:**
   - ☑ Enable Knowledge Base (RAG)
   - Max Results: 3
   - Similarity Threshold: 0.7

4. **Create Agent**

### Step 3: Start Conversation

1. **Go to Conversations → New Conversation**

2. **Select your RAG-enabled agent**

3. **Ask a question related to your documents**
   ```
   Example: "How do I configure the API?"
   ```

4. **Verify the response:**
   - ✅ Agent responds with relevant information
   - ✅ Blue "Sources Used" panel appears
   - ✅ Document titles shown
   - ✅ Similarity scores displayed (e.g., "89% match")

### Step 4: Test Different Scenarios

#### Scenario A: Relevant Query
```
You: "What is the authentication process?"

Expected:
- Agent finds relevant documentation
- Provides detailed answer from docs
- Shows sources (e.g., "Auth Guide - 85% match")
```

#### Scenario B: Irrelevant Query
```
You: "What's the weather today?"

Expected:
- No documents match query
- Agent responds normally without sources
- No source citation panel appears
```

#### Scenario C: Multiple Sources
```
You: "Tell me about the architecture"

Expected:
- Finds multiple relevant documents
- Synthesizes information from all sources
- Shows all sources used (up to max results)
```

## Detailed Testing

### Backend Testing

#### 1. Check Agent Configuration

```bash
TOKEN="your-jwt-token"

# Get agent details
curl http://localhost:3001/api/agents/AGENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# Should show:
# {
#   "useKnowledgeBase": true,
#   "knowledgeBaseMaxResults": 3,
#   "knowledgeBaseThreshold": 0.7,
#   ...
# }
```

#### 2. Monitor Backend Logs

```bash
# Watch backend console for:
[ConversationsService] Searching knowledge base for: "your query"
[ConversationsService] Found 3 relevant chunks
[VectorStoreService] Searching for: "your query"
[VectorStoreService] Found 3 similar chunks
```

#### 3. Verify Message Metadata

```bash
# Get conversation
curl http://localhost:3001/api/conversations/CONV_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# Check assistant messages have sources:
# "metadata": {
#   "sources": [
#     {
#       "documentId": "uuid",
#       "documentTitle": "Setup Guide",
#       "score": 0.89
#     }
#   ]
# }
```

### Frontend Testing

#### 1. Agent Creation Form

- [ ] "Enable Knowledge Base (RAG)" checkbox visible
- [ ] Max Results input works (1-10)
- [ ] Similarity Threshold input works (0-1)
- [ ] Default values populate correctly
- [ ] Form submits with RAG settings
- [ ] Agent created successfully

#### 2. Conversation UI

- [ ] Messages display correctly
- [ ] Source citation panel appears when sources exist
- [ ] Document icon shows in source panel
- [ ] Document titles readable
- [ ] Similarity scores show as percentages
- [ ] Multiple sources display correctly
- [ ] Panel styling matches theme (light/dark)

#### 3. User Experience

- [ ] Response time acceptable (<5 seconds)
- [ ] Sources appear immediately with response
- [ ] Panel doesn't break layout
- [ ] Responsive on mobile
- [ ] Dark mode works correctly

## Test Cases

### Test Case 1: Basic RAG Flow

**Setup:**
- Upload document: "API Guide.pdf"
- Create agent with RAG enabled
- Start conversation

**Steps:**
1. Ask: "What are the API endpoints?"
2. Observe response

**Expected:**
- Agent finds relevant section in API Guide
- Response includes endpoint information
- Source shows: "API Guide.pdf - 85%+ match"

**Pass Criteria:**
- ✅ Relevant answer
- ✅ Source cited
- ✅ Score > 70%

### Test Case 2: Multiple Documents

**Setup:**
- Upload 3 documents on related topics
- Create agent with max results = 3

**Steps:**
1. Ask broad question covering multiple docs
2. Check sources

**Expected:**
- Agent uses information from 2-3 documents
- All sources shown
- Scores vary but all > threshold

**Pass Criteria:**
- ✅ 2+ sources shown
- ✅ Information synthesized
- ✅ All scores > 70%

### Test Case 3: No Matching Documents

**Setup:**
- Upload technical documentation only
- Create agent with RAG enabled

**Steps:**
1. Ask: "What's your favorite color?"
2. Check response

**Expected:**
- No sources found (irrelevant)
- Agent responds with general answer
- No source panel appears

**Pass Criteria:**
- ✅ No sources shown
- ✅ Agent still responds
- ✅ No errors

### Test Case 4: High Threshold

**Setup:**
- Create agent with threshold = 0.9
- Upload some documents

**Steps:**
1. Ask somewhat related question
2. Check sources

**Expected:**
- Fewer or no sources (high threshold)
- Agent may respond without sources
- Only very relevant docs shown

**Pass Criteria:**
- ✅ Only high-score sources (>90%)
- ✅ Agent handles missing sources gracefully

### Test Case 5: Agent Without RAG

**Setup:**
- Create agent with RAG disabled
- Start conversation

**Steps:**
1. Ask question about uploaded documents
2. Check response

**Expected:**
- No knowledge base search performed
- No sources shown
- Agent responds with general knowledge

**Pass Criteria:**
- ✅ No sources panel
- ✅ Normal response
- ✅ No search in logs

### Test Case 6: Edit Agent RAG Settings

**Setup:**
- Create agent with RAG enabled
- Have existing conversation

**Steps:**
1. Edit agent to disable RAG
2. Continue conversation
3. Edit agent to re-enable RAG
4. Continue conversation

**Expected:**
- Settings change takes effect immediately
- Existing messages unchanged
- New messages reflect new settings

**Pass Criteria:**
- ✅ Settings update successfully
- ✅ Conversation adapts to changes

## Performance Testing

### Response Time

```bash
# Test conversation response time
time curl -X POST http://localhost:3001/api/conversations/CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"What is the API rate limit?"}'

# Expected: 1-5 seconds total
# Breakdown:
# - Search: 100-200ms
# - LLM: 1-4s
```

### Load Testing

```bash
# Send multiple messages concurrently
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/conversations/CONV_ID/messages \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"Question $i\"}" &
done
wait

# All should complete successfully
```

## Validation Checklist

### Backend
- [ ] RAG search executes when enabled
- [ ] Search results filtered by organization
- [ ] Context injected into system prompt
- [ ] Sources saved in message metadata
- [ ] Graceful handling of search errors
- [ ] Logging shows RAG activity
- [ ] Performance acceptable (<200ms overhead)

### Frontend
- [ ] RAG settings in agent form
- [ ] Source citations display correctly
- [ ] UI responsive and accessible
- [ ] Dark mode works
- [ ] No console errors
- [ ] Proper loading states

### Integration
- [ ] End-to-end flow works
- [ ] Multiple agents with different settings
- [ ] Mixed conversations (RAG + non-RAG agents)
- [ ] Document updates reflect in conversations
- [ ] Organization isolation maintained

## Troubleshooting

### Issue: No sources showing

**Debug:**
```bash
# 1. Check agent settings
curl /api/agents/AGENT_ID -H "Authorization: Bearer $TOKEN" | jq .useKnowledgeBase

# 2. Check backend logs
# Look for: "Searching knowledge base for..."

# 3. Check vector store
curl /api/knowledge-base/vector-store/info -H "Authorization: Bearer $TOKEN"

# 4. Test search directly
curl -X POST /api/knowledge-base/search \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"test"}'
```

### Issue: Wrong documents retrieved

**Solutions:**
1. Lower similarity threshold
2. Improve document content
3. Use more specific queries
4. Check if documents are indexed

### Issue: Agent ignoring sources

**Possible Causes:**
- System prompt doesn't emphasize using context
- LLM choosing not to use provided info
- Context not relevant to query

**Solutions:**
- Update system prompt: "Always use the provided documentation to answer questions."
- Try different model
- Check if sources are actually relevant

## Expected Outcomes

After completing all tests, you should have:

✅ **Working RAG Pipeline**
- Documents → Indexing → Search → Context → Response

✅ **Source Attribution**
- Responses show which documents were used
- Similarity scores displayed
- Multiple sources supported

✅ **Configurable Behavior**
- Per-agent RAG settings
- Adjustable parameters
- Easy to enable/disable

✅ **Production Ready**
- Error handling robust
- Performance acceptable
- User experience smooth

## Next Steps

Once testing is complete:

1. **Deploy to production** with monitoring
2. **Gather user feedback** on answer quality
3. **Tune parameters** based on usage
4. **Add analytics** for RAG effectiveness
5. **Consider enhancements** (hybrid search, re-ranking, etc.)

---

**Testing Time Estimate**: 30-60 minutes for comprehensive testing  
**Critical Path**: Agent creation → Conversation → Source verification  
**Success Indicator**: Sources showing up with relevant information  
