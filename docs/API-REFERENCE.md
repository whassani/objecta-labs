# 🔌 API Reference - Complete Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.yourdomain.com/api
```

## Authentication

All API endpoints require JWT authentication.

### Getting a Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Using the Token

```bash
Authorization: Bearer {access_token}
```

---

## Document Management API

### Upload Document

```http
POST /knowledge-base/documents/upload
Content-Type: multipart/form-data
```

**Parameters:**
- `file` (required): PDF, TXT, or MD file
- `title` (optional): Custom document title
- `dataSourceId` (optional): Link to data source

**Example:**
```bash
curl -X POST http://localhost:3001/api/knowledge-base/documents/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@document.pdf" \
  -F "title=API Guide"
```

**Response:**
```json
{
  "id": "uuid",
  "title": "API Guide",
  "contentType": "application/pdf",
  "processingStatus": "completed",
  "chunkCount": 15,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### List Documents

```http
GET /knowledge-base/documents?dataSourceId={optional}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "API Guide",
    "chunkCount": 15,
    "processingStatus": "completed",
    "tags": ["api", "technical"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get Document

```http
GET /knowledge-base/documents/:id
```

### Delete Document

```http
DELETE /knowledge-base/documents/:id
```

### Get Document Chunks

```http
GET /knowledge-base/documents/:id/chunks
```

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "The API uses JWT authentication...",
    "chunkIndex": 0,
    "metadata": {}
  }
]
```

### Update Document Tags

```http
PUT /knowledge-base/documents/:id/tags
Content-Type: application/json

{
  "tags": ["api", "authentication", "security"]
}
```

### Find Similar Documents

```http
GET /knowledge-base/documents/:id/similar?limit=5
```

**Response:**
```json
[
  {
    "documentId": "uuid",
    "title": "Authentication Best Practices",
    "similarity": 0.85,
    "reason": "content"
  }
]
```

### Detect Duplicates

```http
GET /knowledge-base/documents/duplicates/detect
```

**Response:**
```json
[
  {
    "originalId": "uuid",
    "originalTitle": "API Guide",
    "duplicates": [
      {
        "documentId": "uuid",
        "title": "API Guide (copy)",
        "similarity": 1.0,
        "reason": "hash"
      }
    ]
  }
]
```

---

## Search API

### Semantic Search

```http
POST /knowledge-base/search?limit=5&threshold=0.7
Content-Type: application/json

{
  "query": "How to configure authentication"
}
```

**Response:**
```json
[
  {
    "chunkId": "uuid",
    "documentId": "uuid",
    "content": "To configure authentication...",
    "score": 0.89,
    "metadata": {
      "documentTitle": "Setup Guide",
      "chunkIndex": 5
    }
  }
]
```

### Hybrid Search

```http
POST /knowledge-base/search/hybrid?limit=10&semanticWeight=0.7&threshold=0.6
Content-Type: application/json

{
  "query": "JWT authentication"
}
```

**Response:**
```json
[
  {
    "chunkId": "uuid",
    "content": "JWT tokens provide...",
    "semanticScore": 0.82,
    "keywordScore": 0.95,
    "hybridScore": 0.86,
    "matchType": "hybrid"
  }
]
```

### Query Suggestions

```http
GET /knowledge-base/search/suggestions?q=auth&limit=5
```

**Response:**
```json
[
  {
    "query": "authentication setup",
    "score": 10,
    "reason": "popular"
  },
  {
    "query": "authorization config",
    "score": 5,
    "reason": "recent"
  }
]
```

### Related Queries

```http
GET /knowledge-base/search/related?q=authentication&limit=5
```

### Popular Queries

```http
GET /knowledge-base/search/popular?limit=10
```

### Recent Searches

```http
GET /knowledge-base/search/recent?limit=10
```

### Search Statistics

```http
GET /knowledge-base/search/stats
```

**Response:**
```json
{
  "totalSearches": 45,
  "uniqueQueries": 32,
  "avgResultsPerSearch": 4.2,
  "avgScore": 0.78
}
```

---

## Analytics API

### Document Statistics

```http
GET /knowledge-base/analytics/document-stats?limit=10
```

**Response:**
```json
[
  {
    "documentId": "uuid",
    "documentTitle": "Setup Guide",
    "timesUsed": 45,
    "avgScore": 0.87,
    "lastUsed": "2024-01-15T10:30:00Z"
  }
]
```

### Vector Store Info

```http
GET /knowledge-base/vector-store/info
```

**Response:**
```json
{
  "name": "objecta_labs",
  "vectorsCount": 150,
  "pointsCount": 150,
  "status": "green"
}
```

---

## Export/Import API

### Export Knowledge Base

```http
POST /knowledge-base/export
```

**Response:**
```json
{
  "version": "1.0",
  "exportDate": "2024-01-15T10:30:00Z",
  "organizationId": "uuid",
  "documents": [...],
  "chunks": [...],
  "metadata": {
    "totalDocuments": 50,
    "totalChunks": 500
  }
}
```

### Export Statistics

```http
GET /knowledge-base/export/stats
```

**Response:**
```json
{
  "totalDocuments": 50,
  "totalChunks": 500,
  "totalDataSources": 3,
  "estimatedSize": "2.5 MB"
}
```

### Import Knowledge Base

```http
POST /knowledge-base/import?skipExisting=true&updateExisting=false
Content-Type: application/json

{
  "version": "1.0",
  "documents": [...],
  "chunks": [...]
}
```

**Response:**
```json
{
  "imported": 45,
  "skipped": 5,
  "updated": 0,
  "errors": []
}
```

---

## Indexing API

### Index Document

```http
POST /knowledge-base/documents/:id/index
```

### Re-index All Documents

```http
POST /knowledge-base/documents/reindex-all
```

**Response:**
```json
{
  "message": "Re-indexing completed",
  "total": 15,
  "successful": 15,
  "failed": 0
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Query is required",
  "error": "Bad Request"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limits

Currently no rate limits in place. Recommended for production:
- 100 requests per minute per user
- 1000 requests per hour per organization

---

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3001/api/docs
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// Upload document
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'My Document');

const response = await api.post('/knowledge-base/documents/upload', formData);

// Search
const results = await api.post('/knowledge-base/search', {
  query: 'authentication'
}, {
  params: { limit: 5, threshold: 0.7 }
});
```

### Python

```python
import requests

api_url = 'http://localhost:3001/api'
headers = {'Authorization': f'Bearer {token}'}

# Upload document
files = {'file': open('document.pdf', 'rb')}
data = {'title': 'My Document'}
response = requests.post(
    f'{api_url}/knowledge-base/documents/upload',
    files=files,
    data=data,
    headers=headers
)

# Search
response = requests.post(
    f'{api_url}/knowledge-base/search',
    json={'query': 'authentication'},
    params={'limit': 5, 'threshold': 0.7},
    headers=headers
)
```

---

## Best Practices

1. **Always include Authorization header**
2. **Handle rate limits gracefully**
3. **Check response status codes**
4. **Use appropriate timeouts**
5. **Implement retry logic for 5xx errors**
6. **Cache tokens (valid for 24 hours)**
7. **Use multipart/form-data for file uploads**
8. **Validate file types and sizes client-side**

---

**Total Endpoints: 27**
**Authentication: Required for all**
**Format: JSON (except file uploads)**
