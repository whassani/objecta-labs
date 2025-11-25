# 📘 Objecta Labs RAG System - User Guide

## Welcome!

This guide will help you get the most out of the Objecta Labs RAG (Retrieval Augmented Generation) system. Whether you're an administrator, developer, or end-user, you'll find everything you need here.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Documents](#managing-documents)
3. [Creating RAG-Enabled Agents](#creating-rag-enabled-agents)
4. [Searching Your Knowledge Base](#searching-your-knowledge-base)
5. [Understanding Analytics](#understanding-analytics)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is RAG?

RAG (Retrieval Augmented Generation) allows AI agents to access and use information from your documents when answering questions. Instead of relying only on their training data, agents can:

- 📄 Search your uploaded documents
- 🎯 Find relevant information
- 💬 Provide accurate, sourced answers
- 📊 Show you where the information came from

### Quick Start (5 Minutes)

1. **Upload Your First Document**
   - Navigate to **Knowledge Base → Documents**
   - Click **Upload Document**
   - Drag & drop a PDF or text file
   - Wait for processing (usually 3-5 seconds)

2. **Create a RAG-Enabled Agent**
   - Go to **Agents → New Agent**
   - Fill in basic details
   - ☑ Check **Enable Knowledge Base (RAG)**
   - Click **Create**

3. **Start Chatting**
   - Go to **Conversations → New Conversation**
   - Select your RAG-enabled agent
   - Ask a question about your document
   - See the magic! ✨

---

## Managing Documents

### Uploading Documents

**Supported Formats:**
- 📄 **PDF** - Up to 10MB
- 📝 **Text (.txt)** - Up to 10MB
- 📋 **Markdown (.md)** - Up to 10MB

**Upload Methods:**

#### Via UI (Recommended)
1. Go to **Knowledge Base → Documents**
2. Click **Upload Document**
3. Either:
   - Drag and drop your file
   - Click to browse and select
4. (Optional) Edit the document title
5. Click **Upload**

#### Via API
```bash
curl -X POST http://localhost:3001/api/knowledge-base/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "title=My Document"
```

### Understanding Document Status

| Status | Meaning | What to Do |
|--------|---------|------------|
| ⏳ **Pending** | Queued for processing | Wait a moment |
| 🔄 **Processing** | Being chunked and indexed | Wait (3-5 seconds) |
| ✅ **Completed** | Ready to use | Start using! |
| ❌ **Failed** | Error occurred | Check logs, try re-uploading |

### Organizing Documents

#### Using Tags
1. Click on a document
2. Click **Edit Tags**
3. Add tags like: `api`, `technical`, `user-guide`
4. Save

**Benefits:**
- Find related documents quickly
- Filter by topic
- Organize by type

#### Using Collections (Folders)
- Group related documents
- Create hierarchies
- Example: `Technical Docs/API/Authentication`

### Finding Similar Documents

**Why it matters:** Avoid duplicates, find related content

**How to use:**
1. Open a document
2. Click **Find Similar**
3. See related documents with similarity scores
4. Click to view related docs

### Detecting Duplicates

**Automatic detection** finds:
- Exact duplicates (same file hash)
- Near-duplicates (similar titles)
- Content duplicates (similar text)

**To check for duplicates:**
1. Go to **Knowledge Base → Analytics**
2. Click **Detect Duplicates**
3. Review list of potential duplicates
4. Delete unnecessary copies

---

## Creating RAG-Enabled Agents

### Basic Setup

1. **Navigate to Agents**
   - Click **Agents** in the sidebar
   - Click **New Agent**

2. **Fill Required Fields**
   ```
   Name: Documentation Assistant
   Description: Helps answer questions about our docs
   System Prompt: You are a helpful assistant that answers 
                  questions based on our documentation. 
                  Always cite your sources.
   Model: gpt-4 or mistral (Ollama)
   ```

3. **Enable RAG**
   - ☑ **Enable Knowledge Base (RAG)**
   - This is the key checkbox!

4. **Configure RAG Settings**

   | Setting | Recommended | Purpose |
   |---------|-------------|---------|
   | **Max Results** | 3 | How many chunks to retrieve |
   | **Similarity Threshold** | 0.7 | Minimum relevance (70%) |

### RAG Settings Explained

#### Max Results (1-10)
- **1-2**: Very focused, single-topic answers
- **3-5**: Balanced (recommended)
- **6-10**: Comprehensive, multiple perspectives

#### Similarity Threshold (0-1)
- **0.5-0.6**: More results, less relevant
- **0.7-0.8**: Balanced (recommended)
- **0.8-1.0**: Very strict, highly relevant only

### Use Case Examples

#### Technical Support Agent
```
Name: Tech Support Bot
Max Results: 5
Threshold: 0.7
System Prompt: "You are a technical support agent. 
Use the documentation to help users solve problems. 
Always include steps and examples."
```

#### Sales Assistant
```
Name: Sales Assistant
Max Results: 3
Threshold: 0.8
System Prompt: "You help customers understand our products. 
Use accurate information from our product docs. 
Be friendly and helpful."
```

#### Code Helper
```
Name: Code Assistant
Max Results: 5
Threshold: 0.7
System Prompt: "You help developers with coding questions. 
Reference our code documentation and provide examples."
```

---

## Searching Your Knowledge Base

### Basic Search

1. **Click Search Button**
   - Available on Knowledge Base page
   - Opens search modal

2. **Enter Your Query**
   - Use natural language
   - Be specific for better results

3. **View Results**
   - Ranked by relevance
   - Shows similarity scores
   - Displays source document

### Search Modes

#### Semantic Search (Default)
- **What it is:** AI-powered meaning-based search
- **Best for:** Finding concepts, similar ideas
- **Example:** "user access control" → finds "authentication"

#### Hybrid Search
- **What it is:** Combines semantic + keyword matching
- **Best for:** When you know exact terms
- **Example:** "JWT token" → finds exact phrase + related concepts

**To use Hybrid:**
1. Open search modal
2. Select **Hybrid** mode
3. Adjust semantic weight (70% default)
4. Search

### Advanced Search Options

#### Max Results
- Default: 5
- Range: 1-20
- Higher = more comprehensive results

#### Similarity Threshold
- Default: 0.7 (70%)
- Range: 0-1
- Higher = stricter matching

#### Semantic Weight (Hybrid only)
- Default: 0.7 (70% semantic, 30% keyword)
- Adjust slider for balance
- 1.0 = pure semantic
- 0.0 = pure keyword

### Query Suggestions

**As you type**, see suggestions:
- 🔥 Popular queries (searched often)
- 🕐 Recent searches (your history)
- 💡 Template suggestions (common patterns)

**Benefits:**
- Save time typing
- Discover popular topics
- Learn from others' searches

### Search Tips

#### ✅ Good Queries
- "How to configure authentication"
- "API rate limits"
- "Database connection setup"
- "Troubleshoot login errors"

#### ❌ Poor Queries
- "stuff" (too vague)
- "documentation" (too broad)
- "thing about users" (unclear)

#### 💡 Pro Tips
1. **Be specific**: "JWT authentication" > "auth"
2. **Use natural language**: Ask like you're talking to a person
3. **Include context**: "Python API client setup" > "setup"
4. **Check suggestions**: Popular queries are often helpful

---

## Understanding Analytics

### Document Usage Analytics

**Location:** Knowledge Base → Analytics tab

#### What You See
- 📊 **Most Used Documents**: Which docs agents reference most
- 📈 **Usage Trends**: How often each doc is used
- ⭐ **Average Scores**: How relevant docs are when used
- 🕐 **Last Used**: When each doc was last referenced

#### Why It Matters
- **Identify valuable content**: Focus on what users need
- **Find gaps**: Low usage might mean missing content
- **Track ROI**: See which docs provide value
- **Improve docs**: Update high-traffic pages

#### Example Insights
```
Top Document: "API Authentication" (45 uses, 87% avg score)
→ Action: Keep this doc updated, add more auth examples

Bottom Document: "Legacy API v1" (2 uses, 65% avg score)
→ Action: Consider archiving or updating
```

### Search Analytics

#### Popular Queries
- Most frequently searched terms
- Search count
- Average results returned

**Use this to:**
- Understand user needs
- Identify documentation gaps
- Improve search experience

#### Recent Searches
- Your organization's recent queries
- Timestamp and results count

**Use this to:**
- Monitor search patterns
- Quick re-search
- Support troubleshooting

#### Search Statistics
- Total searches performed
- Unique queries
- Average results per search
- Average relevance scores

**Healthy metrics:**
- Avg results: 3-5 (good)
- Avg score: 70-85% (good)
- Many unique queries (diverse needs)

---

## Advanced Features

### Conversation-Aware Search

**What it is:** Agents use conversation history to improve search

**How it works:**
```
User: "Tell me about authentication"
Agent: "Authentication uses JWT tokens..."

User: "How do I configure it?" ← NEW
```

Agent searches with context:
```
Previous: "authentication JWT tokens"
Current: "How do I configure it"
Combined: "How do I configure JWT authentication"
```

**Result:** Better, more relevant answers!

### Source Preview

**What it is:** Click any source citation to see the full chunk

**How to use:**
1. Agent responds with sources
2. Click on source name
3. Modal opens showing:
   - Full chunk content
   - Document title
   - Chunk index
   - Similarity score
4. Verify information

**Benefits:**
- Verify accuracy
- See more context
- Understand why chunk was selected
- Build trust in AI responses

### Export/Import Knowledge Base

#### Export (Backup)

**When to use:**
- Before major changes
- Regular backups
- Migration to new environment

**How to export:**
1. Go to **Knowledge Base → Analytics**
2. Click **Export**
3. Download JSON file
4. Save securely

**What's included:**
- All documents with content
- All chunks
- Data sources
- Metadata

#### Import (Restore)

**When to use:**
- Restore from backup
- Migrate between environments
- Share knowledge base

**How to import:**
1. Go to **Knowledge Base**
2. Click **Import**
3. Upload JSON file
4. Choose import mode:
   - **Skip Existing**: Don't overwrite
   - **Update Existing**: Replace old data
   - **Replace All**: Full replacement
5. Confirm and import

---

## Best Practices

### Document Management

#### ✅ Do's
- **Use descriptive titles**: "API Authentication Guide" > "Guide.pdf"
- **Add tags**: Organize by topic, type, audience
- **Check for duplicates**: Run duplicate detection monthly
- **Keep updated**: Review and update quarterly
- **Delete obsolete**: Remove outdated content

#### ❌ Don'ts
- Upload unrelated files
- Use vague titles
- Ignore duplicates
- Let docs get stale
- Mix personal and org content

### Agent Configuration

#### Choosing RAG Settings

**For Technical Documentation:**
```
Max Results: 3-5
Threshold: 0.7-0.8
Why: Need accurate, specific information
```

**For General Q&A:**
```
Max Results: 2-3
Threshold: 0.6-0.7
Why: Cast wider net, more flexible
```

**For Troubleshooting:**
```
Max Results: 5-7
Threshold: 0.6-0.7
Why: Need multiple perspectives
```

### Search Best Practices

1. **Start broad, then narrow**
   - First: "authentication"
   - Then: "JWT authentication setup"

2. **Use filters**
   - Filter by document type
   - Filter by date range
   - Filter by tags

3. **Check popular queries**
   - See what others search for
   - Learn common patterns

4. **Try different phrasings**
   - If no results, rephrase
   - Use synonyms
   - Try shorter/longer queries

---

## Troubleshooting

### Document Upload Issues

#### Problem: Upload fails
**Solutions:**
1. Check file size (<10MB)
2. Verify file type (PDF, TXT, MD)
3. Try different browser
4. Check network connection

#### Problem: Processing stuck
**Solutions:**
1. Wait 30 seconds (may be large file)
2. Refresh page
3. Check backend logs
4. Try re-uploading

#### Problem: Can't find document
**Solutions:**
1. Check processing status
2. Use search feature
3. Check filters
4. Verify organization

### Search Issues

#### Problem: No results
**Solutions:**
1. Lower similarity threshold
2. Try different keywords
3. Use semantic search
4. Check if docs are indexed

#### Problem: Irrelevant results
**Solutions:**
1. Increase similarity threshold
2. Be more specific in query
3. Try hybrid search
4. Use exact keywords

#### Problem: Search is slow
**Solutions:**
1. Check network connection
2. Reduce max results
3. Clear browser cache
4. Check system load

### Agent Issues

#### Problem: Agent doesn't use documents
**Solutions:**
1. Verify RAG is enabled
2. Check documents are indexed
3. Try more specific questions
4. Review agent configuration

#### Problem: Sources not showing
**Solutions:**
1. Check message metadata
2. Verify similarity threshold
3. Try different questions
4. Check backend logs

#### Problem: Wrong information
**Solutions:**
1. Click source preview to verify
2. Check document content
3. Update/improve documents
4. Adjust RAG settings

---

## Getting Help

### Resources
- 📚 **Documentation**: Check all `.md` files
- 🔧 **API Docs**: http://localhost:3001/api/docs
- 💬 **Community**: Join our Discord/Slack
- 🐛 **Report Issues**: GitHub Issues

### Support Checklist

Before asking for help:
1. ✅ Check this user guide
2. ✅ Review error messages
3. ✅ Check backend logs
4. ✅ Try troubleshooting steps
5. ✅ Note steps to reproduce

### Common Questions

**Q: How long does document processing take?**
A: Usually 3-5 seconds for typical documents.

**Q: How many documents can I upload?**
A: No hard limit, but 1000+ is tested and works well.

**Q: Can I delete documents?**
A: Yes, just click delete. Vectors are removed automatically.

**Q: How accurate is RAG?**
A: With 0.7 threshold, expect 70-85% relevance typically.

**Q: Does it work in multiple languages?**
A: Yes! Supports 100+ languages via nomic-embed-text.

---

## Next Steps

Now that you know the basics:

1. ✅ Upload your important documents
2. ✅ Create specialized agents
3. ✅ Start conversations
4. ✅ Monitor analytics
5. ✅ Optimize based on usage

**Welcome to intelligent AI agents powered by your knowledge!** 🚀
