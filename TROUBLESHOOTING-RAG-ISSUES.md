# 🔧 Troubleshooting RAG Issues

## Issue: Agent Can't Find Information in Documents

### Scenario: Uploaded CV but agent can't tell my name

This is **NOT normal** - the agent should be able to find your name. Let's troubleshoot:

---

## Quick Checks

### 1. Verify Document Processing Status

**Check in UI:**
1. Go to **Knowledge Base → Documents**
2. Find your CV document
3. Check the status:
   - ✅ **Completed** = Good, proceed to next check
   - 🔄 **Processing** = Wait a few more seconds
   - ❌ **Failed** = Document processing failed (see below)

**Check via API:**
```bash
curl http://localhost:3001/api/knowledge-base/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Look for `"processingStatus": "completed"`

---

### 2. Verify Document Was Indexed

**Check vector store:**
```bash
curl http://localhost:3001/api/knowledge-base/vector-store/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "vectorsCount": 15,  // Should be > 0
  "pointsCount": 15,   // Should match vectorsCount
  "status": "green"
}
```

If `vectorsCount` is 0, documents weren't indexed!

---

### 3. Verify Agent Has RAG Enabled

**Check agent settings:**
1. Go to **Agents**
2. Click on your agent
3. Verify:
   - ☑ **Enable Knowledge Base (RAG)** is checked
   - **Max Results**: Should be 3 or more
   - **Similarity Threshold**: Should be 0.7 or lower (try 0.6 for testing)

---

### 4. Test Search Directly

**Try searching manually:**
1. Go to **Knowledge Base**
2. Click **Search**
3. Search for your name
4. Do you see results?

**If YES** → Agent configuration issue
**If NO** → Indexing or search issue

---

## Common Issues & Solutions

### Issue 1: Document Uploaded But Not Indexed

**Symptoms:**
- Document shows "completed" status
- But vector store shows 0 vectors
- Search returns no results

**Causes:**
- Background indexing failed
- Ollama not running
- Qdrant not running

**Solutions:**

#### Check Ollama
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not responding, start it
ollama serve

# Pull model if needed
ollama pull nomic-embed-text
```

#### Check Qdrant
```bash
# Check if Qdrant is running
curl http://localhost:6333/collections

# If not responding, start it
docker-compose up -d qdrant
```

#### Manually Re-index Document
```bash
# Via API
curl -X POST http://localhost:3001/api/knowledge-base/documents/DOCUMENT_ID/index \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or via UI
# Go to Documents → Click "Re-index All"
```

#### Check Backend Logs
```bash
# Look for errors
# Should see:
# [VectorStoreService] Indexing document: doc-id
# [VectorStoreService] Successfully indexed X chunks

# If you see errors, that's the problem
```

---

### Issue 2: Agent Not Using Knowledge Base

**Symptoms:**
- Documents are indexed (vectorsCount > 0)
- Search works manually
- Agent doesn't use documents

**Causes:**
- RAG not enabled on agent
- Query doesn't match content
- Threshold too high

**Solutions:**

#### Verify RAG Enabled
```bash
# Check agent configuration
curl http://localhost:3001/api/agents/AGENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Look for:
{
  "useKnowledgeBase": true,  // Must be true!
  "knowledgeBaseMaxResults": 3,
  "knowledgeBaseThreshold": 0.7
}
```

#### Lower Threshold Temporarily
```
1. Edit agent
2. Set threshold to 0.5 (very low for testing)
3. Try again
4. If it works, gradually increase threshold
```

#### Check Backend Logs During Conversation
```bash
# Should see:
[ConversationsService] Searching knowledge base for: "who am I"
[ConversationsService] Found X relevant chunks
[VectorStoreService] Searching for: "who am I"

# If you DON'T see these logs, RAG isn't running
```

---

### Issue 3: Content Not Being Found (Low Similarity)

**Symptoms:**
- Documents indexed
- RAG enabled
- Agent searches but finds nothing relevant

**Causes:**
- Query doesn't semantically match content
- Threshold too strict
- Document chunking split important info

**Solutions:**

#### Test Different Queries
Instead of: "Who am I?"
Try: 
- "What is my name?"
- "Tell me about myself"
- "What's in my CV?"

#### Check Document Chunks
```bash
# View how your CV was chunked
curl http://localhost:3001/api/knowledge-base/documents/DOCUMENT_ID/chunks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Look for chunk with your name
# If name appears in first chunk, threshold should find it
```

#### Adjust Agent Settings
```
Max Results: Increase to 5-7
Threshold: Lower to 0.6 or 0.5
```

#### Try Hybrid Search Mode
```bash
# Hybrid search is better for specific terms like names
curl -X POST "http://localhost:3001/api/knowledge-base/search/hybrid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"my name"}' \
  -G --data-urlencode "semanticWeight=0.5"
```

---

## Step-by-Step Debugging

### Debug Checklist

Follow these steps in order:

#### Step 1: Verify Services Running
```bash
# Check all services
docker ps  # Should see postgres, qdrant, redis
curl http://localhost:11434/api/tags  # Ollama
curl http://localhost:3001/api/health  # Backend
```
- [ ] PostgreSQL running
- [ ] Qdrant running
- [ ] Ollama running
- [ ] Backend running

#### Step 2: Check Document
```bash
# Get document details
curl http://localhost:3001/api/knowledge-base/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Status: "completed"
- [ ] chunkCount > 0
- [ ] content field has text

#### Step 3: Verify Indexing
```bash
# Check vectors
curl http://localhost:3001/api/knowledge-base/vector-store/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] vectorsCount > 0
- [ ] status: "green"

#### Step 4: Test Search
```bash
# Direct search for your name
curl -X POST "http://localhost:3001/api/knowledge-base/search" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"John Doe"}' \
  -G --data-urlencode "threshold=0.5"
```
- [ ] Returns results
- [ ] Results contain your name
- [ ] Score > 0.5

#### Step 5: Check Agent Config
- [ ] useKnowledgeBase: true
- [ ] knowledgeBaseMaxResults: 3+
- [ ] knowledgeBaseThreshold: 0.7 or lower

#### Step 6: Test in Conversation
- [ ] Create new conversation
- [ ] Ask: "What's my name?"
- [ ] Check backend logs
- [ ] Verify search happens
- [ ] Check if sources appear

---

## Expected vs Actual Flow

### Expected Flow (Normal):
```
1. Upload CV ✓
2. Process: Extract text ✓
3. Process: Chunk text ✓
4. Process: Generate embeddings ✓
5. Process: Store in Qdrant ✓
6. User asks: "Who am I?" ✓
7. Agent searches knowledge base ✓
8. Finds chunks with your name ✓
9. Injects into context ✓
10. Responds: "Your name is John Doe" ✓
11. Shows source citation ✓
```

### Where is it failing for you?
Determine which step fails by checking each one.

---

## Quick Fixes

### Fix 1: Re-index Everything
```bash
# Via UI
Knowledge Base → Documents → Re-index All

# Via API
curl -X POST http://localhost:3001/api/knowledge-base/documents/reindex-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Fix 2: Lower Threshold
```
Edit agent → Set threshold to 0.5 → Save
```

### Fix 3: Increase Max Results
```
Edit agent → Set max results to 7 → Save
```

### Fix 4: Try Semantic Search Mode
```
In conversation, try more semantic query:
Instead of: "who am I"
Try: "based on my CV, what is my name and background"
```

---

## Backend Logs to Check

When you ask the agent a question, you should see these logs:

```
[ConversationsService] Searching knowledge base for: "who am I"
[VectorStoreService] Searching for: "who am I"
[VectorStoreService] Found 3 similar chunks
[ConversationsService] Found 3 relevant chunks
[AnalyticsService] Tracked usage for 1 documents
```

**If you DON'T see these logs**, RAG isn't enabled or isn't running.

---

## Testing Commands

### Test 1: Upload and Check
```bash
# Upload CV
curl -X POST http://localhost:3001/api/knowledge-base/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cv.pdf" \
  -F "title=My CV"

# Wait 5 seconds, then check
curl http://localhost:3001/api/knowledge-base/documents \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {title, status: .processingStatus, chunks: .chunkCount}'
```

### Test 2: Search for Your Name
```bash
# Replace "John Doe" with your actual name
curl -X POST "http://localhost:3001/api/knowledge-base/search?threshold=0.5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"John Doe"}'
```

### Test 3: Check Agent RAG Settings
```bash
# Get agent details
curl http://localhost:3001/api/agents/AGENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '{name, useKnowledgeBase, maxResults: .knowledgeBaseMaxResults, threshold: .knowledgeBaseThreshold}'
```

---

## Still Not Working?

### Collect This Information:

1. **Document Status:**
   ```bash
   curl http://localhost:3001/api/knowledge-base/documents \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Vector Store Status:**
   ```bash
   curl http://localhost:3001/api/knowledge-base/vector-store/info \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Agent Configuration:**
   ```bash
   curl http://localhost:3001/api/agents/AGENT_ID \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Backend Logs:**
   ```bash
   # Last 50 lines
   pm2 logs backend --lines 50
   # Or if not using PM2
   tail -n 50 backend.log
   ```

5. **Search Test Result:**
   ```bash
   curl -X POST "http://localhost:3001/api/knowledge-base/search" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"query":"your name here"}'
   ```

---

## Common Causes Summary

| Issue | Symptom | Fix |
|-------|---------|-----|
| Ollama not running | vectorsCount = 0 | `ollama serve` |
| Qdrant not running | Connection error | `docker-compose up -d qdrant` |
| RAG not enabled | No search in logs | Enable in agent settings |
| Threshold too high | Search finds nothing | Lower to 0.5-0.6 |
| Not indexed | Completed but no vectors | Re-index documents |
| Wrong query | Low similarity | Try different phrasing |

---

## Quick Recovery

If everything is broken, do this:

```bash
# 1. Restart all services
docker-compose restart
ollama serve &
cd backend && npm run start:dev &

# 2. Re-index all documents
curl -X POST http://localhost:3001/api/knowledge-base/documents/reindex-all \
  -H "Authorization: Bearer $TOKEN"

# 3. Edit agent, set threshold to 0.5

# 4. Try again
```

---

**Let me know which step is failing and I can help you debug further!**
