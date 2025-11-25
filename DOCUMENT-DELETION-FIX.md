# Document Deletion Fix

## Problem
When documents were deleted from the knowledge base, their vector embeddings remained in Qdrant, causing deleted documents to still appear in RAG search results.

## Root Cause
The deletion endpoints only removed documents from the PostgreSQL database but did not call the `VectorStoreService.deleteDocumentVectors()` method to remove the corresponding vectors from Qdrant.

## Solution

### 1. Fixed Document Deletion (Single Document)
**File**: `backend/src/modules/knowledge-base/knowledge-base.controller.ts`

**Endpoint**: `DELETE /knowledge-base/documents/:id`

**Changes**:
- Added call to `vectorStoreService.deleteDocumentVectors(id)` before deleting from database
- Wrapped in try-catch to log errors but not fail the operation if vector deletion fails
- Database deletion with cascade still removes chunks automatically

### 2. Fixed Data Source Deletion (Multiple Documents)
**File**: `backend/src/modules/knowledge-base/knowledge-base.controller.ts`

**Endpoint**: `DELETE /knowledge-base/data-sources/:id`

**Changes**:
- Retrieve all documents associated with the data source
- Delete vectors for each document before deleting the data source
- Database deletion with cascade removes all documents and chunks

## Implementation Details

### Document Deletion Flow
```typescript
1. Delete vectors from Qdrant (vectorStoreService.deleteDocumentVectors)
2. Delete document from PostgreSQL (cascades to chunks via ON DELETE CASCADE)
3. Return success message
```

### Data Source Deletion Flow
```typescript
1. Find all documents in the data source
2. For each document:
   - Delete vectors from Qdrant
3. Delete data source from PostgreSQL (cascades to documents and chunks)
4. Return success response
```

## Database Schema
The database schema already has proper CASCADE rules:
- `document_chunks.document_id` → `ON DELETE CASCADE`
- Documents are automatically deleted when parent entities are deleted
- Chunks are automatically deleted when documents are deleted

## Testing

### Manual Test Steps
1. Upload a document and index it
2. Verify it appears in search results
3. Delete the document
4. Verify it NO LONGER appears in search results
5. Check Qdrant collection to confirm vectors were removed

### API Endpoints for Testing
```bash
# Upload document
POST /knowledge-base/documents/upload

# Index document
POST /knowledge-base/documents/:id/index

# Search (should include document)
POST /knowledge-base/search
Body: { "query": "your search term" }

# Delete document
DELETE /knowledge-base/documents/:id

# Search again (should NOT include document)
POST /knowledge-base/search
Body: { "query": "your search term" }

# Check vector store info
GET /knowledge-base/vector-store/info
```

## Impact
- ✅ Deleted documents no longer appear in RAG search results
- ✅ Qdrant vector store stays in sync with PostgreSQL database
- ✅ No orphaned vectors consuming memory
- ✅ Data source deletion properly cleans up all associated vectors
- ✅ Graceful error handling if vector deletion fails

## Additional Improvements

### Enhanced Logging & Monitoring
- Vector deletion operations now track and return count of deleted vectors
- Detailed timing metrics for all operations
- Structured logging with `[Vector Deletion]` prefix
- Statistics returned in API responses

### Orphaned Vector Cleanup
- New cleanup utility to remove orphaned vectors from past deletions
- Endpoint: `POST /knowledge-base/vector-store/cleanup-orphaned`
- Scans vector store and removes vectors without corresponding documents
- Returns detailed statistics (scanned, orphaned, deleted, errors)

### Vector Store Inspection
- New endpoint to list all document IDs in vector store
- Endpoint: `GET /knowledge-base/vector-store/document-ids`
- Helps verify sync between database and vector store

## Related Files
- `backend/src/modules/knowledge-base/knowledge-base.controller.ts` - Fixed endpoints + new cleanup endpoints
- `backend/src/modules/knowledge-base/vector-store.service.ts` - Enhanced vector deletion + cleanup utility
- `backend/src/modules/knowledge-base/document-processor.service.ts` - Fixed deleteDocument method
- `backend/src/modules/knowledge-base/entities/document-chunk.entity.ts` - CASCADE configuration

## Additional Documentation
- See `VECTOR-DELETION-IMPROVEMENTS.md` for complete details on all improvements
- See `tmp_rovodev_cleanup_orphaned_vectors.sh` for automated cleanup script
