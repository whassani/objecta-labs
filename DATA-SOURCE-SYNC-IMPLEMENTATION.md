# 🔄 Data Source Sync Implementation - Complete Guide

## Overview

We've implemented a comprehensive data source sync system that allows automatic synchronization of documents from external platforms into the knowledge base. This enables users to keep their knowledge base up-to-date with content from Google Drive, Confluence, GitHub, Notion, and more.

## 🎯 Features Implemented

### 1. **Sync Adapters Architecture**
- ✅ Base adapter interface with standardized methods
- ✅ Google Drive adapter (OAuth2)
- ✅ Confluence adapter (API token)
- ✅ GitHub adapter (Personal Access Token)
- ✅ Notion adapter (Integration token)
- ✅ Extensible design for adding new adapters

### 2. **Sync Orchestration**
- ✅ Central sync service to coordinate all adapters
- ✅ Intelligent document matching (create/update/delete)
- ✅ Error handling and retry logic
- ✅ Sync statistics and reporting

### 3. **Automated Scheduling**
- ✅ Hourly, daily, and weekly sync frequencies
- ✅ Cron-based scheduler using NestJS Schedule
- ✅ Manual trigger support
- ✅ Organization-wide sync

### 4. **API Endpoints**
- ✅ Test connection before setup
- ✅ Trigger sync manually
- ✅ Get sync status and history
- ✅ View supported data sources

## 📁 File Structure

```
backend/src/modules/knowledge-base/
├── sync/
│   ├── base-sync-adapter.interface.ts   # Base adapter interface
│   ├── data-source-sync.service.ts      # Sync orchestration
│   ├── sync-scheduler.service.ts        # Automated scheduling
│   ├── sync.controller.ts               # API endpoints
│   └── adapters/
│       ├── google-drive.adapter.ts
│       ├── confluence.adapter.ts
│       ├── github.adapter.ts
│       └── notion.adapter.ts
├── knowledge-base.module.ts             # Updated with sync services
└── knowledge-base.service.ts            # Updated syncDataSource method
```

## 🚀 Installation

### 1. Install Dependencies

```bash
cd backend
npm install @nestjs/schedule googleapis @octokit/rest @notionhq/client
```

### 2. Required Dependencies
- `@nestjs/schedule`: For cron-based scheduling
- `googleapis`: Google Drive API client
- `@octokit/rest`: GitHub API client
- `@notionhq/client`: Notion API client
- `axios`: Already installed (for Confluence)

## 🔌 Supported Data Sources

### 1. **Google Drive**

**Authentication:** OAuth2

**Required Credentials:**
```json
{
  "accessToken": "ya29.xxx",
  "refreshToken": "1//xxx",
  "clientId": "xxx.apps.googleusercontent.com",
  "clientSecret": "xxx"
}
```

**Configuration Options:**
```json
{
  "folderId": "optional-folder-id",
  "includeSharedDrives": false,
  "fileTypes": ["document", "pdf"]
}
```

**Supported File Types:**
- Google Docs (exported as text)
- PDFs
- Text files

---

### 2. **Confluence**

**Authentication:** Basic Auth / API Token

**Required Credentials:**
```json
{
  "baseUrl": "https://your-domain.atlassian.net",
  "username": "your-email@example.com",
  "apiToken": "your-api-token"
}
```

**Configuration Options:**
```json
{
  "spaceKey": "MYSPACE",
  "includeArchived": false,
  "expandContent": true
}
```

**Features:**
- Syncs pages from specified space(s)
- Extracts content from Confluence storage format
- Tracks page versions and updates

---

### 3. **GitHub**

**Authentication:** Personal Access Token

**Required Credentials:**
```json
{
  "accessToken": "ghp_xxxxxxxxxxxx"
}
```

**Configuration Options:**
```json
{
  "owner": "username-or-org",
  "repo": "repository-name",
  "branch": "main",
  "path": "docs/",
  "fileExtensions": [".md", ".txt", ".mdx"]
}
```

**Supported File Types:**
- Markdown (.md, .mdx)
- Text files (.txt)
- Documentation files

---

### 4. **Notion**

**Authentication:** Integration Token

**Required Credentials:**
```json
{
  "integrationToken": "secret_xxxxxxxxxxxx"
}
```

**Configuration Options:**
```json
{
  "databaseId": "optional-database-id",
  "includeArchived": false
}
```

**Features:**
- Syncs pages and databases
- Extracts content from Notion blocks
- Handles nested content structures

## 📡 API Endpoints

### Get Supported Sources
```http
GET /knowledge-base/sync/supported-sources
```

**Response:**
```json
[
  {
    "type": "google-drive",
    "name": "Google Drive",
    "schema": {
      "folderId": { "type": "string", "required": false },
      "includeSharedDrives": { "type": "boolean", "default": false }
    }
  }
]
```

---

### Test Connection
```http
POST /knowledge-base/sync/test-connection
```

**Request Body:**
```json
{
  "sourceType": "github",
  "credentials": {
    "accessToken": "ghp_xxxxxxxxxxxx"
  },
  "config": {
    "owner": "myorg",
    "repo": "docs"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

---

### Sync Data Source
```http
POST /knowledge-base/sync/data-sources/:id
```

**Response:**
```json
{
  "success": true,
  "documentsProcessed": 25,
  "documentsAdded": 10,
  "documentsUpdated": 12,
  "documentsDeleted": 3,
  "errors": [],
  "lastSyncTimestamp": "2024-01-15T10:30:00Z"
}
```

---

### Sync All Organization Sources
```http
POST /knowledge-base/sync/organization
```

**Response:**
```json
{
  "message": "Organization sync triggered"
}
```

---

### Get Adapter Schema
```http
GET /knowledge-base/sync/adapters/:sourceType/schema
```

**Example:** `GET /knowledge-base/sync/adapters/confluence/schema`

**Response:**
```json
{
  "sourceType": "confluence",
  "name": "Confluence",
  "requiredCredentials": ["baseUrl", "username", "apiToken"],
  "configSchema": {
    "spaceKey": {
      "type": "string",
      "description": "Confluence space key to sync",
      "required": false
    }
  }
}
```

## 🔄 Sync Workflow

### 1. **Create Data Source**
```http
POST /knowledge-base/data-sources
Content-Type: application/json

{
  "sourceType": "github",
  "name": "My GitHub Docs",
  "description": "Documentation repository",
  "authType": "api_key",
  "credentials": {
    "accessToken": "ghp_xxxxxxxxxxxx"
  },
  "config": {
    "owner": "myorg",
    "repo": "docs",
    "branch": "main",
    "path": "docs/",
    "fileExtensions": [".md"]
  },
  "syncFrequency": "daily"
}
```

### 2. **Test Connection (Optional)**
```http
POST /knowledge-base/sync/test-connection
```

### 3. **Trigger Initial Sync**
```http
POST /knowledge-base/sync/data-sources/{dataSourceId}
```

### 4. **Automated Syncs**
- The scheduler automatically syncs based on `syncFrequency`
- Hourly: Every hour
- Daily: Every day at midnight
- Manual: Only when triggered

## 🎛️ Sync Behavior

### Document Matching
- **External ID**: Each synced document stores the external platform's ID
- **Create**: New documents are created if no match found
- **Update**: Existing documents updated if modified date is newer
- **Delete**: Optional - enable `syncDeletes` in config to remove documents deleted from source

### Incremental Syncs
- Uses `lastSyncedAt` timestamp to fetch only modified documents
- Reduces API calls and processing time
- Full sync runs if `lastSyncedAt` is null

### Error Handling
- Individual document errors don't stop the entire sync
- Errors are collected and reported in sync result
- Data source status updated to 'error' if sync fails
- Retry logic in scheduler for failed syncs

## 🛠️ Adding New Adapters

### 1. Create Adapter Class

```typescript
// sync/adapters/my-platform.adapter.ts
import { Injectable } from '@nestjs/common';
import { BaseSyncAdapter, SyncDocument, SyncConfig } from '../base-sync-adapter.interface';

@Injectable()
export class MyPlatformSyncAdapter extends BaseSyncAdapter {
  getAdapterName(): string {
    return 'My Platform';
  }

  getRequiredCredentials(): string[] {
    return ['apiKey'];
  }

  validateCredentials(credentials: any): boolean {
    return !!credentials.apiKey;
  }

  getConfigSchema(): any {
    return {
      // Define config options
    };
  }

  async testConnection(credentials: any, config: any): Promise<boolean> {
    // Test connection logic
  }

  async fetchDocuments(credentials: any, config: SyncConfig): Promise<SyncDocument[]> {
    // Fetch and transform documents
  }
}
```

### 2. Register Adapter

```typescript
// knowledge-base.module.ts
import { MyPlatformSyncAdapter } from './sync/adapters/my-platform.adapter';

@Module({
  providers: [
    // ... other providers
    MyPlatformSyncAdapter,
  ],
})
export class KnowledgeBaseModule {}
```

### 3. Add to Sync Service

```typescript
// sync/data-source-sync.service.ts
constructor(
  // ... other injections
  private myPlatformAdapter: MyPlatformSyncAdapter,
) {
  this.adapters = new Map([
    // ... other adapters
    ['my-platform', myPlatformAdapter],
  ]);
}
```

## 📊 Monitoring & Analytics

### Sync Status
Each data source tracks:
- `status`: active, syncing, error, paused
- `lastSyncedAt`: Last successful sync timestamp
- `errorMessage`: Most recent error if any

### Sync Statistics
Each sync returns:
- Total documents processed
- Documents added/updated/deleted
- List of errors encountered
- Timestamp of sync

## 🔐 Security Considerations

### Credential Storage
- Store credentials encrypted in database
- Use environment variables for API keys when possible
- Never expose credentials in API responses

### API Rate Limits
- Implement rate limiting for external API calls
- Use exponential backoff for retries
- Respect platform-specific rate limits

### Access Control
- Verify organization ownership before syncing
- Implement user permissions for data source management
- Audit log for sync activities

## 🧪 Testing

### Test Connection
```bash
curl -X POST http://localhost:3000/knowledge-base/sync/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "credentials": {"accessToken": "ghp_xxx"},
    "config": {"owner": "test", "repo": "docs"}
  }'
```

### Trigger Manual Sync
```bash
curl -X POST http://localhost:3000/knowledge-base/sync/data-sources/{id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 Frontend Integration

### Create Data Source UI
```typescript
// Example data source form
const createDataSource = async (formData: any) => {
  // Test connection first
  const testResult = await api.post('/knowledge-base/sync/test-connection', {
    sourceType: formData.sourceType,
    credentials: formData.credentials,
    config: formData.config,
  });

  if (testResult.success) {
    // Create data source
    await api.post('/knowledge-base/data-sources', formData);
  }
};
```

### Display Sync Status
```typescript
// Poll for sync status
const getSyncStatus = async (dataSourceId: string) => {
  const dataSource = await api.get(`/knowledge-base/data-sources/${dataSourceId}`);
  
  return {
    status: dataSource.status,
    lastSyncedAt: dataSource.lastSyncedAt,
    errorMessage: dataSource.errorMessage,
  };
};
```

## 📈 Future Enhancements

### Potential Additions
1. **More Adapters**: Dropbox, OneDrive, SharePoint, Slack
2. **Webhook Support**: Real-time syncing via webhooks
3. **Selective Sync**: Choose specific folders/pages to sync
4. **Sync History**: Track all sync runs with detailed logs
5. **Conflict Resolution**: Handle document conflicts intelligently
6. **Batch Processing**: Optimize for large document sets
7. **Content Filtering**: Regex-based content filtering
8. **Metadata Mapping**: Custom field mapping from source to KB

## 🐛 Troubleshooting

### Common Issues

**1. Connection Test Fails**
- Verify credentials are correct
- Check API token/OAuth token hasn't expired
- Ensure network access to external platform
- Review platform-specific API documentation

**2. Sync Fails After Starting**
- Check error message in data source entity
- Verify permissions on external platform
- Review rate limits
- Check document format compatibility

**3. Documents Not Updating**
- Verify `lastSyncedAt` timestamp
- Check if documents have actually changed
- Ensure incremental sync is working
- Try manual full sync

**4. Missing Dependencies**
- Run `npm install` in backend directory
- Verify all adapter dependencies installed
- Check for version conflicts

## 🎉 Summary

You now have a fully functional data source sync system that:
- ✅ Connects to multiple external platforms
- ✅ Automatically syncs documents on schedule
- ✅ Handles incremental updates intelligently
- ✅ Provides comprehensive API for management
- ✅ Extensible architecture for new adapters
- ✅ Production-ready error handling and logging

## 🔗 Related Documentation
- [Knowledge Base System](./COMPLETE-RAG-SYSTEM-SUMMARY.md)
- [Vector Search](./PRIORITY-3-VECTOR-SEARCH-COMPLETE.md)
- [Document Upload](./PRIORITY-2-DOCUMENT-UPLOAD-COMPLETE.md)

---

**Next Steps:**
1. Install the required npm packages
2. Configure your external platform credentials
3. Create your first data source
4. Test the connection and trigger a sync
5. Monitor the sync results and adjust configuration as needed
