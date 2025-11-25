# Document Upload Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Knowledge Base Page                                    │    │
│  │  - Data Sources Tab                                     │    │
│  │  - Documents Tab ◄── NEW                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ User clicks "Upload"                 │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  DocumentUploadModal ◄── NEW                           │    │
│  │  - Drag & Drop Zone                                     │    │
│  │  - File Validation                                      │    │
│  │  - Title Input                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ FormData with file                   │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  API Client (api.ts) ◄── MODIFIED                      │    │
│  │  - knowledgeBaseApi.uploadDocument()                    │    │
│  │  - Handles multipart/form-data                          │    │
│  └────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP POST /api/knowledge-base/documents/upload
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  KnowledgeBaseController ◄── MODIFIED                  │    │
│  │  - @Post('documents/upload')                            │    │
│  │  - Multer file interceptor                              │    │
│  │  - File validation (type, size)                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          │ Validated file buffer                │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  DocumentProcessorService ◄── NEW                      │    │
│  │                                                          │    │
│  │  processDocument(file, orgId, title)                    │    │
│  │  ├─ 1. Create document record                           │    │
│  │  ├─ 2. Extract text                                     │    │
│  │  │    ├─ PDF: pdf-parse library                         │    │
│  │  │    └─ TXT/MD: buffer.toString()                      │    │
│  │  ├─ 3. Chunk text (LangChain)                           │    │
│  │  ├─ 4. Save chunks to DB                                │    │
│  │  └─ 5. Update document status                           │    │
│  └────────────────────────────────────────────────────────┘    │
│            │                                    │                │
│            │                                    │                │
│            ▼                                    ▼                │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │  Document        │              │  LangChain           │    │
│  │  Entity          │              │  Text Splitter       │    │
│  │                  │              │                      │    │
│  │  - id            │              │  RecursiveCharacter  │    │
│  │  - title         │              │  TextSplitter        │    │
│  │  - content       │              │  - chunkSize: 1000   │    │
│  │  - contentType   │              │  - overlap: 200      │    │
│  │  - chunkCount    │              │                      │    │
│  │  - status        │              └──────────────────────┘    │
│  └──────────────────┘                                           │
│            │                                                     │
│            │ Cascade relationship                               │
│            ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  DocumentChunk Entity ◄── NEW                        │      │
│  │                                                        │      │
│  │  - id                                                  │      │
│  │  - documentId (FK)                                     │      │
│  │  - content                                             │      │
│  │  - chunkIndex                                          │      │
│  │  - metadata                                            │      │
│  └──────────────────────────────────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Save to database
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  documents          │         │  document_chunks          │  │
│  ├─────────────────────┤         ├──────────────────────────┤  │
│  │ id                  │◄────┐   │ id                        │  │
│  │ organization_id     │     │   │ document_id (FK)          │  │
│  │ title               │     └───│ content                   │  │
│  │ content             │         │ chunk_index               │  │
│  │ content_type        │         │ metadata                  │  │
│  │ chunk_count         │         │ created_at                │  │
│  │ processing_status   │         └──────────────────────────┘  │
│  │ created_at          │                                        │
│  │ updated_at          │         Index: document_id            │
│  └─────────────────────┘         Index: (document_id, chunk_index)
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Processing Flow

```
┌─────────────┐
│   User      │
│  Uploads    │
│   File      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  1. Frontend Validation          │
│     - File type check            │
│     - File size check (< 10MB)   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  2. FormData Creation            │
│     - Append file                │
│     - Append title (optional)    │
│     - Append dataSourceId        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  3. API Request                  │
│     POST /documents/upload       │
│     Content-Type: multipart/     │
│                   form-data      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  4. Backend Validation           │
│     - Multer intercepts          │
│     - MIME type validation       │
│     - File size validation       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  5. Create Document Record       │
│     - Status: "processing"       │
│     - Store metadata             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  6. Text Extraction              │
│     ┌─────────────────────┐     │
│     │ PDF → pdf-parse     │     │
│     │ TXT → toString()    │     │
│     │ MD  → toString()    │     │
│     └─────────────────────┘     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  7. Text Chunking                │
│     RecursiveCharacterTextSplitter
│     - Split by: \n\n, \n, space │
│     - Chunk size: 1000 chars    │
│     - Overlap: 200 chars        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  8. Save Chunks                  │
│     - Bulk insert                │
│     - Preserve order (index)     │
│     - Store metadata             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  9. Update Document              │
│     - Status: "completed"        │
│     - Set chunk_count            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  10. Return Response             │
│      Document object with        │
│      status and chunk count      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  11. Frontend Updates            │
│      - Show success toast        │
│      - Refresh document list     │
│      - Close modal               │
└─────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────┐
│  Error Occurs              │
└────────────┬───────────────┘
             │
             ├─── Invalid File Type ───► Toast Error Message
             │                           "Only PDF, TXT, MD allowed"
             │
             ├─── File Too Large ──────► Toast Error Message
             │                           "File must be < 10MB"
             │
             ├─── PDF Parse Error ─────► Update document status
             │                           to "failed" + log error
             │
             ├─── Database Error ──────► Rollback transaction
             │                           Return 500 error
             │
             └─── Network Error ───────► Toast Error Message
                                         "Failed to upload"
```

## Data Flow Example

### Input
```
File: "documentation.pdf" (2.5 MB)
Title: "Product Documentation"
```

### Processing
```
1. Document Created:
   {
     id: "uuid-1",
     title: "Product Documentation",
     contentType: "application/pdf",
     processingStatus: "processing",
     organizationId: "org-123"
   }

2. Text Extracted:
   "This is the product documentation... [5000 words]"

3. Chunks Created:
   [
     { chunkIndex: 0, content: "This is the product..." },
     { chunkIndex: 1, content: "...product documentation..." },
     { chunkIndex: 2, content: "...the features include..." },
     ... (15 chunks total)
   ]

4. Document Updated:
   {
     ...
     processingStatus: "completed",
     chunkCount: 15
   }
```

### Output
```json
{
  "id": "uuid-1",
  "organizationId": "org-123",
  "title": "Product Documentation",
  "contentType": "application/pdf",
  "chunkCount": 15,
  "processingStatus": "completed",
  "metadata": {
    "originalName": "documentation.pdf",
    "size": 2621440
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:02Z"
}
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    Knowledge Base Module                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Controllers:                                             │
│  └── KnowledgeBaseController                             │
│      ├── Data Source endpoints (existing)                │
│      └── Document endpoints (new) ◄──┐                   │
│                                       │                   │
│  Services:                            │                   │
│  ├── KnowledgeBaseService             │                   │
│  │   ├── Data source methods          │                   │
│  │   └── Document methods (new) ──────┤                   │
│  │                                     │                   │
│  └── DocumentProcessorService (new) ◄─┘                   │
│      ├── processDocument()                                │
│      ├── extractTextFromPDF()                             │
│      ├── chunkText()                                      │
│      └── saveChunks()                                     │
│                                                           │
│  Entities:                                                │
│  ├── DataSource (existing)                                │
│  ├── Document (existing, enhanced)                        │
│  └── DocumentChunk (new)                                  │
│                                                           │
│  DTOs:                                                    │
│  ├── CreateDataSourceDto                                  │
│  ├── UpdateDataSourceDto                                  │
│  ├── CreateDocumentDto (new)                              │
│  ├── DocumentResponseDto (new)                            │
│  └── DocumentChunkDto (new)                               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Integration Points

### With Future Features

```
Document Upload (Current)
    │
    ├──► Priority 3: Vector Search
    │    └── Generate embeddings for each chunk
    │        └── Store in Qdrant
    │            └── Enable semantic search
    │
    ├──► Agent Conversations
    │    └── RAG (Retrieval Augmented Generation)
    │        └── Search relevant chunks
    │            └── Inject into agent context
    │
    └──► Analytics
         └── Track document usage
             └── Measure retrieval effectiveness
```

## Performance Characteristics

```
File Size     Processing Time    Chunks Created
-------------------------------------------------
100 KB        0.5 - 1.0 sec     5 - 10
500 KB        1.0 - 1.5 sec     20 - 30
1 MB          1.5 - 2.5 sec     40 - 60
5 MB          5.0 - 8.0 sec     200 - 300
10 MB (max)   10 - 15 sec       400 - 500
```

## Security Layers

```
┌─────────────────────────────────┐
│  1. Authentication Layer         │
│     - JWT token required         │
│     - User must be logged in     │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  2. Authorization Layer          │
│     - Organization isolation     │
│     - Documents scoped to org    │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  3. Input Validation Layer       │
│     - File type whitelist        │
│     - File size limits           │
│     - DTO validation             │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  4. Processing Layer             │
│     - Safe text extraction       │
│     - Sanitized content          │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│  5. Storage Layer                │
│     - SQL injection prevention   │
│     - Transaction safety         │
└─────────────────────────────────┘
```
