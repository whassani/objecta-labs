# Priority 3: Vector Search - Testing Guide

## Prerequisites

Before testing, ensure you have:

1. **Ollama installed and running**
   ```bash
   ollama serve
   ```

2. **nomic-embed-text model downloaded**
   ```bash
   ollama pull nomic-embed-text
   ```

3. **Qdrant running via Docker**
   ```bash
   docker-compose up -d qdrant
   ```

4. **Services running**
   ```bash
   # Backend
   cd backend && npm run start:dev
   
   # Frontend
   cd frontend && npm run dev
   ```

## Quick Verification

### 1. Check Ollama Status

```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# Should return list of models including nomic-embed-text
```

### 2. Check Qdrant Status

```bash
# Verify Qdrant is running
curl http://localhost:6333/collections

# Should return empty list or existing collections
```

### 3. Check Backend

```bash
# Backend should be running on port 3001
curl http://localhost:3001/api/auth/me
```

## Testing Workflow

### Step 1: Upload and Index a Document

1. **Login to the application**
   - Navigate to http://localhost:3000
   - Login with your credentials

2. **Upload a test document**
   - Go to Knowledge Base → Documents tab
   - Click "Upload Document"
   - Upload `tmp_rovodev_test_document_upload.md`
   - Wait for status to show "completed"

3. **Verify indexing in logs**
   - Check backend console for:
     ```
     [VectorStoreService] Indexing document: doc-id
     [VectorStoreService] Generating embeddings for X chunks
     [VectorStoreService] Successfully indexed X chunks
     ```

4. **Verify in Qdrant**
   ```bash
   curl http://localhost:6333/collections/objecta_labs
   ```
   - Should show points_count > 0

### Step 2: Test Semantic Search via UI

1. **Open Search Modal**
   - Click "Search" button in Knowledge Base header
   - Modal should open with search interface

2. **Test Basic Search**
   - Enter query: "features to test"
   - Click "Search"
   - Should return relevant chunks with similarity scores

3. **Test Different Queries**
   
   **Query 1: "introduction section"**
   - Should find chunks from introduction
   - Scores should be > 0.7
   
   **Query 2: "document processor"**
   - Should find technical content about processing
   
   **Query 3: "conclusion"**
   - Should find conclusion section

4. **Test Advanced Options**
   - Set Max Results to 3
   - Set Threshold to 0.8
   - Search should return fewer, more relevant results

5. **Verify Result Display**
   - ✓ Document title shown
   - ✓ Chunk index displayed
   - ✓ Similarity score percentage
   - ✓ Content preview visible
   - ✓ Results ranked by score

### Step 3: Test API Endpoints

#### Get Authentication Token

```bash
# Login to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the token from response
TOKEN="your-jwt-token-here"
```

#### Test Search Endpoint

```bash
# Basic search
curl -X POST "http://localhost:3001/api/knowledge-base/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"features to test"}' | jq

# Search with parameters
curl -X POST "http://localhost:3001/api/knowledge-base/search?limit=3&threshold=0.8" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"document processor"}' | jq
```

#### Test Manual Indexing

```bash
# Get document ID from upload response or list documents
DOCUMENT_ID="your-doc-id"

# Manually trigger indexing
curl -X POST "http://localhost:3001/api/knowledge-base/documents/$DOCUMENT_ID/index" \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### Get Vector Store Info

```bash
# Check vector store statistics
curl "http://localhost:3001/api/knowledge-base/vector-store/info" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected response:
# {
#   "name": "objecta_labs",
#   "vectorsCount": 15,
#   "pointsCount": 15,
#   "status": "green",
#   "segmentsCount": 1
# }
```

### Step 4: Test with Multiple Documents

1. **Upload multiple documents**
   - Upload 3-5 different documents
   - Wait for all to complete processing

2. **Search across all documents**
   - Query should search all indexed documents
   - Results should come from different sources

3. **Verify result diversity**
   - Results should show different document titles
   - Scores should vary based on relevance

### Step 5: Test Edge Cases

#### Empty Query
```bash
curl -X POST "http://localhost:3001/api/knowledge-base/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":""}' | jq

# Should return 400 Bad Request: "Query is required"
```

#### High Threshold (No Results)
- Set threshold to 0.99
- Search with generic query
- Should return empty results or very few

#### Low Threshold (Many Results)
- Set threshold to 0.3
- Set limit to 20
- Should return many results

#### Very Long Query
- Try a paragraph-length query
- Should still work (embeddings handle long text)

## Validation Checklist

### Backend
- [ ] VectorStoreService initializes without errors
- [ ] Qdrant collection created automatically
- [ ] Documents indexed after upload (check logs)
- [ ] Search returns results with scores
- [ ] Organization isolation works (no cross-org results)
- [ ] Error handling works for missing Ollama/Qdrant

### Frontend
- [ ] Search button visible in header
- [ ] Search modal opens and closes
- [ ] Query input works
- [ ] Advanced options (limit, threshold) work
- [ ] Results display correctly
- [ ] Similarity scores shown as percentages
- [ ] Empty state shown when no results
- [ ] Loading state shown during search
- [ ] Error messages display properly

### Integration
- [ ] Automatic indexing after upload
- [ ] Manual indexing endpoint works
- [ ] Vector store info endpoint returns data
- [ ] Cross-language queries work (multilingual model)

## Performance Validation

### Indexing Speed
```bash
# Time a document upload and indexing
time curl -X POST "http://localhost:3001/api/knowledge-base/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Doc"

# Should complete in 3-5 seconds for typical document
```

### Search Speed
```bash
# Time a search query
time curl -X POST "http://localhost:3001/api/knowledge-base/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"test query"}' | jq

# Should complete in < 200ms
```

## Troubleshooting

### Problem: "Ollama connection refused"

**Solution:**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### Problem: "Model not found"

**Solution:**
```bash
# Pull the embedding model
ollama pull nomic-embed-text

# Verify it's available
ollama list
```

### Problem: "Qdrant connection refused"

**Solution:**
```bash
# Start Qdrant via Docker
docker-compose up -d qdrant

# Check if running
docker ps | grep qdrant

# Verify connection
curl http://localhost:6333/collections
```

### Problem: "No results found"

**Possible causes:**
1. Documents not indexed
   - Check backend logs for indexing errors
   - Manually trigger indexing

2. Threshold too high
   - Lower threshold to 0.5 or 0.6

3. Query not matching content
   - Try more specific or different queries

4. Embedding model issue
   - Check Ollama logs
   - Verify model is loaded

### Problem: "Collection not found"

**Solution:**
```bash
# Restart backend to recreate collection
# Collection is auto-created on startup

# Or manually create via Qdrant API
curl -X PUT 'http://localhost:6333/collections/objecta_labs' \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

## Expected Results Summary

### After uploading 1 document with ~10 chunks:

**Vector Store Info:**
```json
{
  "name": "objecta_labs",
  "vectorsCount": 10,
  "pointsCount": 10,
  "status": "green"
}
```

**Search Result:**
```json
[
  {
    "chunkId": "chunk-uuid",
    "documentId": "doc-uuid",
    "content": "This is the introduction section...",
    "score": 0.89,
    "metadata": {
      "documentTitle": "Test Document",
      "contentType": "text/markdown",
      "chunkIndex": 0
    }
  }
]
```

## Success Criteria

- ✅ Documents automatically indexed after upload
- ✅ Search returns relevant results with scores > 0.7
- ✅ Results sorted by similarity score
- ✅ UI displays results properly
- ✅ Advanced options work (limit, threshold)
- ✅ No cross-organization results
- ✅ Performance acceptable (< 200ms searches)
- ✅ Error handling works

## Next Steps

Once all tests pass:
1. Document any issues found
2. Proceed to Priority 4: Agent RAG Integration
3. Test search within agent conversations
4. Implement "chat with documents" feature

---

**Ready to test?** Start with Step 1 and work through each section!
