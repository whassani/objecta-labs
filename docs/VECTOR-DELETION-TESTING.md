# Vector Deletion Testing Guide

## Prerequisites
- Backend running on `http://localhost:3000`
- Valid JWT authentication token
- Qdrant running and accessible
- Sample test document (PDF, TXT, or MD file)

## Test Suite

### Test 1: Single Document Deletion

#### Step 1: Get Initial Vector Store Stats
```bash
curl -X GET http://localhost:3000/knowledge-base/vector-store/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Record:** Initial vector count

#### Step 2: Upload a Test Document
```bash
curl -X POST http://localhost:3000/knowledge-base/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "title=Test Document for Deletion"
```

**Expected:** Returns document with status `processing` or `completed`  
**Record:** Document ID

#### Step 3: Wait for Processing & Indexing
```bash
# Check document status
curl -X GET http://localhost:3000/knowledge-base/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** `processingStatus: "completed"`

#### Step 4: Manually Index (if needed)
```bash
curl -X POST http://localhost:3000/knowledge-base/documents/DOCUMENT_ID/index \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** `{ "message": "Document indexed successfully" }`

#### Step 5: Verify Document in Search
```bash
curl -X POST http://localhost:3000/knowledge-base/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Expected:** Document appears in search results with score > 0.7

#### Step 6: Check Vector Store After Upload
```bash
curl -X GET http://localhost:3000/knowledge-base/vector-store/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Vector count increased from initial count

#### Step 7: Delete the Document
```bash
curl -X DELETE http://localhost:3000/knowledge-base/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Document deleted successfully",
  "vectorsDeleted": 15
}
```

**Check:** `vectorsDeleted` > 0

#### Step 8: Verify Document NOT in Search
```bash
curl -X POST http://localhost:3000/knowledge-base/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Expected:** Document does NOT appear in search results

#### Step 9: Verify Vector Store Reduced
```bash
curl -X GET http://localhost:3000/knowledge-base/vector-store/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Vector count returned to initial count (or close to it)

#### Step 10: Check Logs
```bash
# Backend logs should show:
grep "\[Vector Deletion\]" logs/application.log | tail -20
```

**Expected Log Entries:**
```
[Vector Deletion] Starting deletion for document: DOCUMENT_ID
[Vector Deletion] Found 15 vectors to delete for document DOCUMENT_ID
[Vector Deletion] Successfully deleted 15 vectors for document DOCUMENT_ID in 234ms
```

---

### Test 2: Data Source Deletion

#### Step 1: Create a Data Source
```bash
curl -X POST http://localhost:3000/knowledge-base/data-sources \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Data Source",
    "sourceType": "manual",
    "authType": "none",
    "credentials": {}
  }'
```

**Record:** Data Source ID

#### Step 2: Upload Multiple Documents to Data Source
```bash
# Upload document 1
curl -X POST http://localhost:3000/knowledge-base/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test1.pdf" \
  -F "title=Test Doc 1" \
  -F "dataSourceId=DATA_SOURCE_ID"

# Upload document 2
curl -X POST http://localhost:3000/knowledge-base/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test2.pdf" \
  -F "title=Test Doc 2" \
  -F "dataSourceId=DATA_SOURCE_ID"

# Upload document 3
curl -X POST http://localhost:3000/knowledge-base/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test3.pdf" \
  -F "title=Test Doc 3" \
  -F "dataSourceId=DATA_SOURCE_ID"
```

#### Step 3: Wait for All to Process
Check each document's status until all are completed.

#### Step 4: Verify All Documents in Search
```bash
curl -X POST http://localhost:3000/knowledge-base/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 10}'
```

**Expected:** Multiple results from the uploaded documents

#### Step 5: Delete the Data Source
```bash
curl -X DELETE http://localhost:3000/knowledge-base/data-sources/DATA_SOURCE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Data source deleted successfully",
  "documentsProcessed": 3,
  "vectorsDeleted": 45,
  "successful": 3,
  "failed": 0
}
```

**Check:**
- `documentsProcessed` = 3
- `vectorsDeleted` > 0
- `successful` = 3
- `failed` = 0

#### Step 6: Verify Documents NOT in Search
```bash
curl -X POST http://localhost:3000/knowledge-base/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 10}'
```

**Expected:** None of the deleted documents appear in results

---

### Test 3: Orphaned Vector Cleanup

#### Step 1: Check for Orphaned Vectors
```bash
curl -X GET http://localhost:3000/knowledge-base/vector-store/document-ids \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Record:** List of document IDs in vector store

#### Step 2: Check Database for Documents
```bash
curl -X GET http://localhost:3000/knowledge-base/documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Compare:** Document IDs in vector store vs database

#### Step 3: Run Cleanup
```bash
curl -X POST http://localhost:3000/knowledge-base/vector-store/cleanup-orphaned \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "scanned": 150,
  "orphaned": 0,
  "deleted": 0,
  "errors": 0
}
```

**Check:** If you have any orphaned vectors (from before the fix), they should be detected and deleted.

#### Step 4: Run Cleanup Again
```bash
curl -X POST http://localhost:3000/knowledge-base/vector-store/cleanup-orphaned \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "scanned": 150,
  "orphaned": 0,
  "deleted": 0,
  "errors": 0
}
```

**Check:** Second run should find 0 orphaned vectors

#### Step 5: Check Logs
```bash
grep "\[Orphan Cleanup\]" logs/application.log | tail -20
```

**Expected Log Entries:**
```
[Orphan Cleanup] Starting cleanup for organization: ORG_ID
[Orphan Cleanup] Completed for organization ORG_ID in 1234ms. Scanned: 150, Orphaned: 0, Deleted: 0, Errors: 0
```

---

### Test 4: Error Handling

#### Test 4.1: Delete with Qdrant Down

1. Stop Qdrant temporarily
2. Try to delete a document
3. **Expected:** Document deleted from DB, error logged but operation succeeds
4. Restart Qdrant
5. Run cleanup to remove orphaned vectors

#### Test 4.2: Delete Non-existent Document
```bash
curl -X DELETE http://localhost:3000/knowledge-base/documents/non-existent-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** 404 Not Found error

#### Test 4.3: Delete Already Deleted Document
1. Delete a document once (succeeds)
2. Try to delete the same document again
3. **Expected:** 404 Not Found error

---

### Test 5: Performance Testing

#### Test Setup
- Upload 10 documents
- Each document should have ~10-20 chunks
- Total vectors: ~100-200

#### Test 5.1: Single Document Deletion Time
```bash
time curl -X DELETE http://localhost:3000/knowledge-base/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** < 1 second

#### Test 5.2: Data Source Deletion Time (10 documents)
```bash
time curl -X DELETE http://localhost:3000/knowledge-base/data-sources/DATA_SOURCE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** < 10 seconds (roughly 1 second per document)

#### Test 5.3: Cleanup Time (200 vectors)
```bash
time curl -X POST http://localhost:3000/knowledge-base/vector-store/cleanup-orphaned \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** < 5 seconds

---

## Automated Test Script

Save this as a bash script to run all tests:

```bash
#!/bin/bash

# Set your token
TOKEN="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:3000"

echo "=== Vector Deletion Test Suite ==="
echo ""

# Test 1: Upload and Delete
echo "Test 1: Single Document Deletion"
echo "---------------------------------"

# Upload
UPLOAD_RESULT=$(curl -s -X POST $BASE_URL/knowledge-base/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Document")

DOC_ID=$(echo $UPLOAD_RESULT | jq -r '.id')
echo "Uploaded document: $DOC_ID"

# Wait a bit for processing
sleep 5

# Index
curl -s -X POST $BASE_URL/knowledge-base/documents/$DOC_ID/index \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "Document indexed"

sleep 2

# Delete
DELETE_RESULT=$(curl -s -X DELETE $BASE_URL/knowledge-base/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN")

echo "Delete result: $DELETE_RESULT"

VECTORS_DELETED=$(echo $DELETE_RESULT | jq -r '.vectorsDeleted')

if [ "$VECTORS_DELETED" -gt "0" ]; then
    echo "✅ Test 1 PASSED: Deleted $VECTORS_DELETED vectors"
else
    echo "❌ Test 1 FAILED: No vectors deleted"
fi

echo ""
echo "Test 2: Orphan Cleanup"
echo "----------------------"

CLEANUP_RESULT=$(curl -s -X POST $BASE_URL/knowledge-base/vector-store/cleanup-orphaned \
  -H "Authorization: Bearer $TOKEN")

echo "Cleanup result: $CLEANUP_RESULT"

ORPHANED=$(echo $CLEANUP_RESULT | jq -r '.orphaned')

if [ "$ORPHANED" -eq "0" ]; then
    echo "✅ Test 2 PASSED: No orphaned vectors found"
else
    echo "⚠️  Test 2: Found $ORPHANED orphaned vectors (cleaned up)"
fi

echo ""
echo "=== All Tests Complete ==="
```

---

## Success Criteria

### ✅ All Tests Pass When:
1. **Document deletion** returns `vectorsDeleted > 0`
2. **Deleted documents** do NOT appear in search results
3. **Vector store count** decreases after deletion
4. **Data source deletion** removes all document vectors
5. **Cleanup utility** finds and removes orphaned vectors
6. **Logs show** proper `[Vector Deletion]` and `[Orphan Cleanup]` entries
7. **Second cleanup run** finds 0 orphaned vectors
8. **Performance** meets expected thresholds

### ❌ Tests Fail When:
1. Deleted documents still appear in search
2. `vectorsDeleted` is 0 or missing
3. Vector count doesn't decrease
4. Cleanup finds orphaned vectors on second run
5. Errors in logs

---

## Troubleshooting

### Issue: vectorsDeleted is 0
- Check if document was indexed (check vector store)
- Look for `[Vector Deletion]` logs
- Verify Qdrant is running

### Issue: Deleted document still in search
- Run cleanup utility
- Check logs for deletion errors
- Verify vector store info

### Issue: Cleanup finds orphaned vectors
- This is expected if you had deletions before the fix
- Run cleanup to remove them
- Should find 0 on second run

---

## Integration with CI/CD

Add these tests to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Vector Deletion
  run: |
    npm run test:vector-deletion
```

Create test file: `backend/test/vector-deletion.e2e-spec.ts`
