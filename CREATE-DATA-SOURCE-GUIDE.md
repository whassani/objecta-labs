# 📝 Create Data Source - User Guide

## 🎉 New Feature: Full Creation Form

You can now create data sources directly from the UI!

---

## 🚀 How to Use

### Step 1: Open the Modal
1. Go to **Knowledge Base** → **Data Source Sync** tab
2. Click **"Add Data Source"** button

### Step 2: Select Platform
Choose from:
- 🐙 **GitHub** - Sync markdown files and documentation
- 🌐 **Confluence** - Import wiki pages and spaces
- 📝 **Notion** - Connect pages and databases
- ☁️ **Google Drive** - Sync docs, PDFs, and files

### Step 3: Configure

Fill in the required fields for your selected platform:

---

## 📋 Platform-Specific Setup

### 🐙 GitHub

**Required Fields:**
- **Name:** Display name (e.g., "My Docs")
- **Personal Access Token:** Your GitHub PAT
- **Owner:** Username or organization
- **Repository:** Repository name

**Optional Fields:**
- **Branch:** Default is "main"
- **Path:** Subfolder to sync (e.g., "docs/")

**Get Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (or `public_repo` for public repos only)
4. Copy the token (starts with `ghp_`)

**Example:**
```
Name: My Documentation
Token: ghp_xxxxxxxxxxxx
Owner: myusername
Repo: my-docs
Branch: main
Path: docs/
```

---

### 🌐 Confluence

**Required Fields:**
- **Name:** Display name
- **Confluence URL:** Your Atlassian URL
- **Username:** Your email
- **API Token:** Atlassian API token

**Optional Fields:**
- **Space Key:** Limit to specific space

**Get Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token

**Example:**
```
Name: Company Wiki
URL: https://mycompany.atlassian.net
Username: me@company.com
API Token: xxxxxxxxxxxxxxxx
Space Key: DOCS
```

---

### 📝 Notion

**Required Fields:**
- **Name:** Display name
- **Integration Token:** Notion integration token

**Get Token:**
1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Give it a name and select workspace
4. Copy the "Internal Integration Token"
5. **Important:** Share pages with your integration!

**Example:**
```
Name: Notion Knowledge Base
Token: secret_xxxxxxxxxxxx
```

---

### ☁️ Google Drive

**Note:** Google Drive requires OAuth2 setup which is more complex. Coming soon with guided OAuth flow!

---

## 🧪 Test Connection

Before creating, click **"Test Connection"** to verify:
- ✅ Credentials are valid
- ✅ You have proper permissions
- ✅ The platform is accessible

---

## ✅ Create

Once the connection test succeeds:
1. Click **"Create"**
2. Wait for confirmation
3. Your data source appears in the list!

---

## 🔄 Sync Your Data

After creation:
1. Find your new data source card
2. Click the **🔄 Sync** button
3. Watch the status update
4. Documents will appear in the **Documents** tab

---

## 💡 Tips

### Best Practices
1. **Test first** - Always test connection before creating
2. **Start small** - Use path filters to limit scope initially
3. **Check permissions** - Ensure tokens have required access
4. **Manual first** - Start with manual sync, automate later

### Common Issues

**"Connection failed"**
- Check token is valid and not expired
- Verify URL is correct (for Confluence)
- Ensure you have access to the repository/space

**"Failed to create"**
- Name is required
- Check required fields are filled
- Verify credentials format

**Notion: "No pages found"**
- Share pages with your integration
- Integration needs access to pages/databases

---

## 🎬 Quick Example: GitHub

Let's create a GitHub data source for a public repository:

### 1. Get Token
```
https://github.com/settings/tokens
→ Generate new token
→ Select "public_repo"
→ Copy token: ghp_abc123...
```

### 2. Fill Form
```
Name: Hello World Docs
Description: Example repository
Token: ghp_abc123...
Owner: octocat
Repo: Hello-World
Branch: master
Path: (leave empty)
```

### 3. Test & Create
```
→ Click "Test Connection"
→ ✅ Connection successful!
→ Click "Create"
→ ✅ Data source created!
```

### 4. Sync
```
→ Find "Hello World Docs" card
→ Click 🔄 Sync button
→ Wait for completion
→ Check Documents tab!
```

---

## 📊 What Happens Next

### After Creation
1. Data source appears in the list
2. Status shows "active"
3. Ready to sync!

### After First Sync
1. Files are fetched from platform
2. Content is extracted
3. Text is chunked (1000 chars)
4. Embeddings generated (Ollama)
5. Indexed in vector store (Qdrant)
6. Documents appear in Documents tab
7. Ready for RAG queries!

---

## 🔧 Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Refresh the page
- Ensure you're on the "Data Source Sync" tab

### Form doesn't submit
- Fill all required fields (marked with *)
- Name must not be empty
- Check token format

### Test connection fails
**GitHub:**
- Token must start with `ghp_`
- Owner and repo must exist
- Token needs appropriate scopes

**Confluence:**
- URL must include `https://`
- Email must be valid
- API token from correct place

**Notion:**
- Token must start with `secret_`
- Pages must be shared with integration

---

## 🎉 Success!

You've now:
- ✅ Opened the creation modal
- ✅ Selected a platform
- ✅ Filled in credentials
- ✅ Tested the connection
- ✅ Created your data source
- ✅ Ready to sync!

---

## 📚 Next Steps

1. **Sync your data source** - Click the sync button
2. **Monitor progress** - Watch status indicators
3. **Check documents** - Go to Documents tab
4. **Test search** - Try semantic search
5. **Configure schedule** - Set up automatic syncing (coming soon!)

---

## 🆘 Need Help?

- **Documentation:** [DATA-SOURCE-SYNC-IMPLEMENTATION.md](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)
- **Quick Start:** [DATA-SOURCE-SYNC-QUICK-START.md](./DATA-SOURCE-SYNC-QUICK-START.md)
- **Test Script:** `node backend/test-data-source-sync.js`

---

**Happy syncing! 🚀**
