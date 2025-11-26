# 🚀 Data Source Sync - Quick Start Guide

This guide will help you get started with data source sync in under 10 minutes!

## Step 1: Install Dependencies (2 minutes)

```bash
cd backend
npm install @nestjs/schedule googleapis @octokit/rest @notionhq/client
```

## Step 2: Restart Backend (1 minute)

```bash
npm run start:dev
```

The new sync endpoints will be automatically available at:
- `http://localhost:3000/knowledge-base/sync/*`

## Step 3: Test with GitHub (5 minutes)

### 3.1 Get GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or just `public_repo`
4. Copy the token (starts with `ghp_`)

### 3.2 Create Data Source

```bash
curl -X POST http://localhost:3000/knowledge-base/data-sources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "name": "My GitHub Docs",
    "description": "Documentation from GitHub",
    "authType": "api_key",
    "credentials": {
      "accessToken": "ghp_YOUR_TOKEN_HERE"
    },
    "config": {
      "owner": "your-username",
      "repo": "your-repo",
      "branch": "main",
      "path": "docs/",
      "fileExtensions": [".md", ".txt"]
    },
    "syncFrequency": "daily"
  }'
```

### 3.3 Test Connection

```bash
curl -X POST http://localhost:3000/knowledge-base/sync/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "credentials": {
      "accessToken": "ghp_YOUR_TOKEN_HERE"
    },
    "config": {
      "owner": "your-username",
      "repo": "your-repo"
    }
  }'
```

### 3.4 Trigger Sync

```bash
curl -X POST http://localhost:3000/knowledge-base/sync/data-sources/DATA_SOURCE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should see a response like:
```json
{
  "success": true,
  "documentsProcessed": 15,
  "documentsAdded": 15,
  "documentsUpdated": 0,
  "documentsDeleted": 0,
  "errors": [],
  "lastSyncTimestamp": "2024-01-15T10:30:00Z"
}
```

## Step 4: Verify Documents (1 minute)

```bash
curl -X GET http://localhost:3000/knowledge-base/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should see your synced documents!

## 🎯 What's Next?

### Try Other Platforms

#### Confluence
1. Get API token from https://id.atlassian.com/manage-profile/security/api-tokens
2. Use `confluence` as `sourceType`
3. Provide `baseUrl`, `username`, `apiToken`

#### Notion
1. Create integration at https://www.notion.so/my-integrations
2. Share pages with your integration
3. Use `notion` as `sourceType`
4. Provide `integrationToken`

#### Google Drive
1. Set up OAuth2 credentials in Google Cloud Console
2. Get access and refresh tokens
3. Use `google-drive` as `sourceType`
4. Provide OAuth credentials

### Automated Syncing

Your data sources will automatically sync based on `syncFrequency`:
- `hourly`: Every hour
- `daily`: Every day at midnight
- `weekly`: Every week at midnight Sunday
- `manual`: Only when you trigger it

### Monitor Syncs

Check data source status:
```bash
curl -X GET http://localhost:3000/knowledge-base/data-sources/DATA_SOURCE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

**Connection test fails?**
- Check your credentials are correct
- Verify network access to the platform
- Check token hasn't expired

**Sync completes but no documents?**
- Check the `config` matches your setup (owner, repo, path, etc.)
- Verify file extensions match your files
- Check platform permissions

**Documents not updating?**
- Wait for scheduled sync or trigger manually
- Check `lastSyncedAt` timestamp
- Verify documents have actually changed on the platform

## 📚 Resources

- [Full Documentation](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)
- [API Reference](./docs/API-REFERENCE.md)
- [Knowledge Base Guide](./COMPLETE-RAG-SYSTEM-SUMMARY.md)

## 💡 Pro Tips

1. **Test connection first** - Always test before creating a data source
2. **Start with one folder** - Use `path` config to limit scope initially
3. **Monitor first sync** - Watch the first sync to catch any issues
4. **Check errors array** - Review any errors in the sync result
5. **Use manual frequency** - Start with manual, move to automated when confident

Happy syncing! 🎉
