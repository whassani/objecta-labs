# 📚 Knowledge Base - Data Source Sync System

## Quick Links

### 🚀 Getting Started
- **[Quick Start Guide](./DATA-SOURCE-SYNC-QUICK-START.md)** - Get up and running in 10 minutes
- **[Full Implementation Guide](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)** - Comprehensive documentation

### 📖 Documentation
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Supported Platforms](#supported-platforms)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Data Source Sync system enables automatic synchronization of documents from external platforms into your knowledge base. This keeps your RAG system up-to-date with the latest content from:

- 📁 **Google Drive** - Docs, PDFs, and text files
- 🌐 **Confluence** - Wiki pages and documentation
- 🐙 **GitHub** - Markdown documentation and code files
- 📝 **Notion** - Pages and databases

### Key Features

✅ **Automated Syncing** - Schedule hourly, daily, or weekly syncs
✅ **Incremental Updates** - Only sync changed documents
✅ **Smart Matching** - Detect updates and deletions
✅ **Error Handling** - Robust error recovery and reporting
✅ **Extensible** - Easy to add new platforms

---

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────┐
│                  Sync Controller                    │
│            (REST API Endpoints)                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│         Data Source Sync Service                    │
│         (Orchestration & Logic)                     │
└──────────────────┬──────────────────────────────────┘
                   │
      ┌────────────┼────────────┬────────────┐
      │            │            │            │
┌─────▼────┐ ┌────▼─────┐ ┌────▼─────┐ ┌───▼──────┐
│ Google   │ │Confluence│ │  GitHub  │ │  Notion  │
│  Drive   │ │ Adapter  │ │ Adapter  │ │ Adapter  │
│ Adapter  │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Sync Flow

```
1. Scheduler triggers sync (or manual trigger)
   ↓
2. Sync Service fetches data source config
   ↓
3. Appropriate adapter fetches documents from platform
   ↓
4. Documents are matched with existing (by external ID)
   ↓
5. Create new / Update modified / Delete removed
   ↓
6. Documents are chunked and indexed in vector store
   ↓
7. Sync statistics reported back
```

---

## Supported Platforms

### 1. Google Drive
- **Auth:** OAuth2
- **Supported Files:** Google Docs, PDFs, Text files
- **Features:** Folder filtering, Shared drives support
- **[Setup Guide →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#1-google-drive)**

### 2. Confluence
- **Auth:** API Token (Basic Auth)
- **Supported Content:** Pages from spaces
- **Features:** Space filtering, Archived pages option
- **[Setup Guide →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#2-confluence)**

### 3. GitHub
- **Auth:** Personal Access Token
- **Supported Files:** Markdown, Text files
- **Features:** Repository/branch/path filtering
- **[Setup Guide →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#3-github)**

### 4. Notion
- **Auth:** Integration Token
- **Supported Content:** Pages, Databases
- **Features:** Database filtering, Block extraction
- **[Setup Guide →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#4-notion)**

---

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/knowledge-base/sync/supported-sources` | List all supported platforms |
| POST | `/knowledge-base/sync/test-connection` | Test connection before setup |
| POST | `/knowledge-base/sync/data-sources/:id` | Trigger sync for data source |
| POST | `/knowledge-base/sync/organization` | Sync all data sources |
| GET | `/knowledge-base/sync/adapters/:type/schema` | Get config schema for platform |

### Data Source Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/knowledge-base/data-sources` | List all data sources |
| POST | `/knowledge-base/data-sources` | Create new data source |
| GET | `/knowledge-base/data-sources/:id` | Get data source details |
| PUT | `/knowledge-base/data-sources/:id` | Update data source |
| DELETE | `/knowledge-base/data-sources/:id` | Delete data source |

**[Full API Documentation →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#-api-endpoints)**

---

## Frontend Components

### DataSourceManager Component

Location: `frontend/src/components/knowledge-base/DataSourceManager.tsx`

**Features:**
- Visual cards for each data source
- Real-time sync status indicators
- One-click sync triggering
- Platform-specific icons
- Error message display
- Create/delete data sources

**Usage:**
```tsx
import { DataSourceManager } from '@/components/knowledge-base/DataSourceManager'

export default function KnowledgeBasePage() {
  return <DataSourceManager />
}
```

---

## Testing

### Automated Test Script

We provide a comprehensive test script: `backend/test-data-source-sync.js`

**Run Tests:**
```bash
# Set up environment
export JWT_TOKEN="your-jwt-token"
export GITHUB_TOKEN="ghp_your-token"  # For GitHub tests
export TEST_SOURCE="github"  # Platform to test

# Run tests
cd backend
node test-data-source-sync.js

# Run with cleanup
CLEANUP=true node test-data-source-sync.js
```

**Tests Included:**
- ✅ Get supported sources
- ✅ Get adapter schemas
- ✅ Test connection
- ✅ Create data source
- ✅ Trigger sync
- ✅ List documents
- ✅ Delete data source (with cleanup flag)

### Manual Testing

**1. Quick GitHub Test:**
```bash
curl -X POST http://localhost:3000/knowledge-base/sync/test-connection \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "credentials": {"accessToken": "ghp_xxx"},
    "config": {"owner": "octocat", "repo": "Hello-World"}
  }'
```

**[More test examples →](./DATA-SOURCE-SYNC-QUICK-START.md)**

---

## Troubleshooting

### Common Issues

#### Connection Test Fails
**Symptoms:** Test connection returns `success: false`

**Solutions:**
- ✅ Verify credentials are correct and not expired
- ✅ Check token permissions/scopes
- ✅ Ensure network access to platform
- ✅ Review platform API status

#### Sync Completes But No Documents
**Symptoms:** `documentsProcessed: 0` in sync result

**Solutions:**
- ✅ Verify `config` parameters (owner, repo, path, etc.)
- ✅ Check file extensions match your files
- ✅ Ensure platform permissions allow access
- ✅ Review adapter-specific configuration

#### Documents Not Updating
**Symptoms:** Changes on platform not reflected in KB

**Solutions:**
- ✅ Check `lastSyncedAt` timestamp
- ✅ Trigger manual sync to test
- ✅ Verify documents actually changed
- ✅ Review sync frequency setting

#### Rate Limit Errors
**Symptoms:** API errors about rate limits

**Solutions:**
- ✅ Reduce sync frequency
- ✅ Implement exponential backoff
- ✅ Use incremental sync (lastSyncedAt)
- ✅ Check platform rate limit docs

**[Full Troubleshooting Guide →](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#-troubleshooting)**

---

## Installation Checklist

- [ ] Install dependencies: `npm install @nestjs/schedule googleapis @octokit/rest @notionhq/client`
- [ ] Restart backend server
- [ ] Set up credentials for platforms you want to use
- [ ] Test connection for each platform
- [ ] Create first data source
- [ ] Trigger initial sync
- [ ] Verify documents in knowledge base
- [ ] Set up automated sync schedule

---

## Files Overview

### Backend Files

```
backend/src/modules/knowledge-base/
├── sync/
│   ├── base-sync-adapter.interface.ts      # Base interface
│   ├── data-source-sync.service.ts         # Main orchestration
│   ├── sync-scheduler.service.ts           # Automated scheduling
│   ├── sync.controller.ts                  # API endpoints
│   └── adapters/
│       ├── google-drive.adapter.ts         # Google Drive
│       ├── confluence.adapter.ts           # Confluence
│       ├── github.adapter.ts               # GitHub
│       └── notion.adapter.ts               # Notion
└── knowledge-base.module.ts                # Module registration
```

### Frontend Files

```
frontend/src/components/knowledge-base/
└── DataSourceManager.tsx                   # UI component
```

### Documentation

```
├── DATA-SOURCE-SYNC-IMPLEMENTATION.md      # Full documentation
├── DATA-SOURCE-SYNC-QUICK-START.md         # Quick start guide
├── KNOWLEDGE-BASE-SYNC-INDEX.md            # This file
└── backend/test-data-source-sync.js        # Test script
```

---

## Next Steps

1. **Get Started:** Follow the [Quick Start Guide](./DATA-SOURCE-SYNC-QUICK-START.md)
2. **Deep Dive:** Read the [Implementation Guide](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)
3. **Test:** Run the test script to verify everything works
4. **Integrate:** Add the DataSourceManager component to your UI
5. **Extend:** Add custom adapters for your specific platforms

---

## Related Documentation

- [Knowledge Base Overview](./COMPLETE-RAG-SYSTEM-SUMMARY.md)
- [Vector Search](./PRIORITY-3-VECTOR-SEARCH-COMPLETE.md)
- [Document Upload](./PRIORITY-2-DOCUMENT-UPLOAD-COMPLETE.md)
- [Agent RAG Integration](./PRIORITY-4-AGENT-RAG-COMPLETE.md)

---

## Support

Need help? Check these resources:
- 📖 [Full Documentation](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)
- 🐛 [Troubleshooting Guide](./DATA-SOURCE-SYNC-IMPLEMENTATION.md#-troubleshooting)
- 🧪 [Test Script](./backend/test-data-source-sync.js)

---

**Built with:** NestJS, TypeORM, LangChain, Google APIs, Octokit, Notion SDK
