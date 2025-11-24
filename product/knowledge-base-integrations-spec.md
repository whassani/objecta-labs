# Knowledge Base Integrations Specification

## Overview

Connect AI agents to external data sources (GitHub, Confluence, Notion, Jira, etc.) to provide context-aware responses based on real company data.

---

## 1. Supported Integrations

### Phase 1 (MVP)
- ✅ **Document Upload** - PDF, DOCX, TXT, MD
- ✅ **URL Scraping** - Web pages
- ✅ **Plain Text** - Manual input

### Phase 2 (Growth)
- ✅ **GitHub** - Code, wikis, issues, discussions
- ✅ **Confluence** - Pages, spaces, attachments
- ✅ **Notion** - Pages, databases
- ✅ **Google Drive** - Docs, Sheets, PDFs
- ✅ **Slack** - Messages, threads, files

### Phase 3 (Enterprise)
- ✅ **Jira** - Issues, comments, attachments
- ✅ **SharePoint** - Documents, lists
- ✅ **Salesforce** - Knowledge base, cases
- ✅ **Zendesk** - Articles, tickets
- ✅ **Intercom** - Articles, conversations
- ✅ **Custom APIs** - Any REST/GraphQL API

---

## 2. Architecture

### Integration Flow

```
┌────────────────────────────────────────────────────┐
│  External Sources                                   │
│  ├─ GitHub                                          │
│  ├─ Confluence                                      │
│  ├─ Notion                                          │
│  ├─ Jira                                            │
│  └─ Google Drive                                    │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────┐
│  Integration Service (NestJS)                       │
│  ├─ OAuth/API Authentication                        │
│  ├─ Data Fetching & Sync                           │
│  ├─ Content Extraction                             │
│  └─ Change Detection                               │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────┐
│  Processing Pipeline                                │
│  ├─ Clean & Format Content                         │
│  ├─ Chunk into Segments (LangChain TextSplitter)   │
│  ├─ Generate Embeddings (OpenAI/Ollama)            │
│  └─ Store in Vector DB (Pinecone)                  │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────┐
│  Query & Retrieval                                  │
│  ├─ Semantic Search                                │
│  ├─ Rerank Results                                 │
│  ├─ Source Attribution                             │
│  └─ Return to Agent                                │
└────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

```sql
-- Data source connections
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID REFERENCES agents(id), -- Optional: specific to agent
    
    -- Source details
    source_type VARCHAR(50) NOT NULL, -- github, confluence, notion, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Authentication
    auth_type VARCHAR(50) NOT NULL, -- oauth, api_key, basic
    credentials JSONB NOT NULL, -- Encrypted credentials
    
    -- Configuration
    config JSONB DEFAULT '{}', -- Source-specific settings
    sync_frequency VARCHAR(50) DEFAULT 'daily', -- realtime, hourly, daily, manual
    last_synced_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, paused, error
    error_message TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Synced documents from external sources
CREATE TABLE synced_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    
    -- Document metadata
    external_id VARCHAR(255) NOT NULL, -- ID in external system
    title VARCHAR(500) NOT NULL,
    url TEXT,
    content_type VARCHAR(100),
    
    -- Content
    raw_content TEXT,
    processed_content TEXT,
    
    -- Metadata from source
    source_metadata JSONB DEFAULT '{}',
    author VARCHAR(255),
    created_in_source TIMESTAMP,
    updated_in_source TIMESTAMP,
    
    -- Processing
    processing_status VARCHAR(50) DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    embedding_model VARCHAR(100),
    
    -- Sync
    last_synced_at TIMESTAMP DEFAULT NOW(),
    sync_hash VARCHAR(64), -- To detect changes
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(data_source_id, external_id)
);

CREATE INDEX idx_synced_docs_org_id ON synced_documents(organization_id);
CREATE INDEX idx_synced_docs_source_id ON synced_documents(data_source_id);
CREATE INDEX idx_synced_docs_status ON synced_documents(processing_status);

-- Document chunks with embeddings
CREATE TABLE document_chunks_external (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    synced_document_id UUID NOT NULL REFERENCES synced_documents(id) ON DELETE CASCADE,
    
    -- Chunk data
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    
    -- Vector embedding
    vector_id VARCHAR(255), -- ID in Pinecone/Weaviate
    embedding_model VARCHAR(100),
    
    -- Metadata for retrieval
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chunks_external_doc_id ON document_chunks_external(synced_document_id);
CREATE INDEX idx_chunks_external_vector_id ON document_chunks_external(vector_id);

-- Sync logs
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    
    sync_type VARCHAR(50) NOT NULL, -- full, incremental, manual
    status VARCHAR(50) NOT NULL, -- running, completed, failed
    
    -- Stats
    documents_fetched INTEGER DEFAULT 0,
    documents_processed INTEGER DEFAULT 0,
    documents_failed INTEGER DEFAULT 0,
    
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);
```

---

## 4. Integration: GitHub

### Features
- Code repositories
- README files
- Wiki pages
- Issues & PRs
- Discussions
- Release notes

### LangChain Implementation

```typescript
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';

@Injectable()
export class GitHubIntegrationService {
  async connectRepository(
    organizationId: string,
    config: {
      owner: string;
      repo: string;
      branch?: string;
      accessToken: string;
    }
  ) {
    // Create data source
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'github',
      name: `${config.owner}/${config.repo}`,
      authType: 'oauth',
      credentials: {
        accessToken: this.encrypt(config.accessToken),
      },
      config: {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch || 'main',
      },
    });

    // Initial sync
    await this.syncGitHubRepo(dataSource.id);

    return dataSource;
  }

  async syncGitHubRepo(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const config = dataSource.config;

    // Load documents from GitHub
    const loader = new GithubRepoLoader(
      `https://github.com/${config.owner}/${config.repo}`,
      {
        accessToken: this.decrypt(dataSource.credentials.accessToken),
        branch: config.branch,
        recursive: true,
        unknown: 'warn',
        // Only include certain file types
        ignorePaths: ['node_modules', '.git', 'dist', 'build'],
      }
    );

    const documents = await loader.load();

    // Process each document
    for (const doc of documents) {
      await this.processSyncedDocument({
        organizationId: dataSource.organizationId,
        dataSourceId: dataSource.id,
        externalId: doc.metadata.source,
        title: this.extractTitle(doc.metadata.source),
        url: doc.metadata.source,
        contentType: 'code',
        rawContent: doc.pageContent,
        sourceMetadata: doc.metadata,
      });
    }

    // Update last sync
    await this.updateDataSource(dataSourceId, {
      lastSyncedAt: new Date(),
      status: 'active',
    });
  }
}
```

---

## 5. Integration: Confluence

### Features
- Spaces and pages
- Attachments
- Comments
- Page hierarchy
- Version history

### Implementation

```typescript
import { ConfluenceLoader } from '@langchain/community/document_loaders/web/confluence';

@Injectable()
export class ConfluenceIntegrationService {
  async connectSpace(
    organizationId: string,
    config: {
      baseUrl: string;
      spaceKey: string;
      username: string;
      apiToken: string;
    }
  ) {
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'confluence',
      name: `Confluence - ${config.spaceKey}`,
      authType: 'basic',
      credentials: {
        username: config.username,
        apiToken: this.encrypt(config.apiToken),
      },
      config: {
        baseUrl: config.baseUrl,
        spaceKey: config.spaceKey,
      },
    });

    await this.syncConfluenceSpace(dataSource.id);

    return dataSource;
  }

  async syncConfluenceSpace(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const config = dataSource.config;
    const creds = dataSource.credentials;

    const loader = new ConfluenceLoader({
      baseUrl: config.baseUrl,
      spaceKey: config.spaceKey,
      username: creds.username,
      accessToken: this.decrypt(creds.apiToken),
    });

    const documents = await loader.load();

    for (const doc of documents) {
      await this.processSyncedDocument({
        organizationId: dataSource.organizationId,
        dataSourceId: dataSource.id,
        externalId: doc.metadata.pageId,
        title: doc.metadata.title,
        url: `${config.baseUrl}/wiki/spaces/${config.spaceKey}/pages/${doc.metadata.pageId}`,
        contentType: 'wiki',
        rawContent: doc.pageContent,
        sourceMetadata: doc.metadata,
      });
    }
  }
}
```

---

## 6. Integration: Notion

### Features
- Pages and databases
- Hierarchical structure
- Rich content blocks
- Database properties

### Implementation

```typescript
import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';

@Injectable()
export class NotionIntegrationService {
  async connectWorkspace(
    organizationId: string,
    config: {
      apiToken: string;
      databaseId?: string;
      pageId?: string;
    }
  ) {
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'notion',
      name: 'Notion Workspace',
      authType: 'api_key',
      credentials: {
        apiToken: this.encrypt(config.apiToken),
      },
      config: {
        databaseId: config.databaseId,
        pageId: config.pageId,
      },
    });

    await this.syncNotion(dataSource.id);

    return dataSource;
  }

  async syncNotion(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const config = dataSource.config;

    const loader = new NotionAPILoader({
      clientOptions: {
        auth: this.decrypt(dataSource.credentials.apiToken),
      },
      id: config.databaseId || config.pageId,
      type: config.databaseId ? 'database' : 'page',
    });

    const documents = await loader.load();

    for (const doc of documents) {
      await this.processSyncedDocument({
        organizationId: dataSource.organizationId,
        dataSourceId: dataSource.id,
        externalId: doc.metadata.notionId,
        title: doc.metadata.properties?.title || 'Untitled',
        url: doc.metadata.url,
        contentType: 'notion',
        rawContent: doc.pageContent,
        sourceMetadata: doc.metadata,
      });
    }
  }
}
```

---

## 7. Integration: Jira

### Features
- Issues and comments
- Attachments
- Custom fields
- Project knowledge

### Implementation

```typescript
@Injectable()
export class JiraIntegrationService {
  async connectProject(
    organizationId: string,
    config: {
      baseUrl: string;
      projectKey: string;
      email: string;
      apiToken: string;
    }
  ) {
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'jira',
      name: `Jira - ${config.projectKey}`,
      authType: 'basic',
      credentials: {
        email: config.email,
        apiToken: this.encrypt(config.apiToken),
      },
      config: {
        baseUrl: config.baseUrl,
        projectKey: config.projectKey,
      },
    });

    await this.syncJiraProject(dataSource.id);

    return dataSource;
  }

  async syncJiraProject(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const config = dataSource.config;
    const creds = dataSource.credentials;

    // Fetch issues using Jira REST API
    const issues = await this.fetchJiraIssues({
      baseUrl: config.baseUrl,
      projectKey: config.projectKey,
      email: creds.email,
      apiToken: this.decrypt(creds.apiToken),
    });

    for (const issue of issues) {
      // Combine issue data into searchable content
      const content = `
# ${issue.key}: ${issue.fields.summary}

**Description:**
${issue.fields.description || 'No description'}

**Status:** ${issue.fields.status.name}
**Priority:** ${issue.fields.priority?.name}
**Assignee:** ${issue.fields.assignee?.displayName || 'Unassigned'}

**Comments:**
${issue.fields.comment.comments.map(c => c.body).join('\n\n')}
      `.trim();

      await this.processSyncedDocument({
        organizationId: dataSource.organizationId,
        dataSourceId: dataSource.id,
        externalId: issue.key,
        title: `${issue.key}: ${issue.fields.summary}`,
        url: `${config.baseUrl}/browse/${issue.key}`,
        contentType: 'jira_issue',
        rawContent: content,
        sourceMetadata: issue.fields,
      });
    }
  }

  private async fetchJiraIssues(config: any) {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    
    const response = await fetch(
      `${config.baseUrl}/rest/api/3/search?jql=project=${config.projectKey}&maxResults=100`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data.issues;
  }
}
```

---

Continue in next message...

## 8. Integration: Google Drive

### Features
- Google Docs, Sheets, Slides
- PDFs and other files
- Folder structure
- Shared drives

### Implementation

```typescript
import { GoogleDriveLoader } from '@langchain/community/document_loaders/fs/google_drive';

@Injectable()
export class GoogleDriveIntegrationService {
  async connectDrive(
    organizationId: string,
    config: {
      folderId?: string;
      credentials: object; // OAuth credentials
    }
  ) {
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'google_drive',
      name: 'Google Drive',
      authType: 'oauth',
      credentials: {
        oauth: this.encrypt(JSON.stringify(config.credentials)),
      },
      config: {
        folderId: config.folderId,
      },
    });

    await this.syncGoogleDrive(dataSource.id);
    return dataSource;
  }

  async syncGoogleDrive(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    
    const loader = new GoogleDriveLoader({
      credentials: JSON.parse(this.decrypt(dataSource.credentials.oauth)),
      folderId: dataSource.config.folderId,
    });

    const documents = await loader.load();

    for (const doc of documents) {
      await this.processSyncedDocument({
        organizationId: dataSource.organizationId,
        dataSourceId: dataSource.id,
        externalId: doc.metadata.id,
        title: doc.metadata.name,
        url: doc.metadata.webViewLink,
        contentType: doc.metadata.mimeType,
        rawContent: doc.pageContent,
        sourceMetadata: doc.metadata,
      });
    }
  }
}
```

---

## 9. Integration: Slack

### Features
- Channel messages
- Thread conversations
- Shared files
- Pinned messages

### Implementation

```typescript
@Injectable()
export class SlackIntegrationService {
  async connectWorkspace(
    organizationId: string,
    config: {
      botToken: string;
      channels: string[];
    }
  ) {
    const dataSource = await this.createDataSource({
      organizationId,
      sourceType: 'slack',
      name: 'Slack Workspace',
      authType: 'oauth',
      credentials: {
        botToken: this.encrypt(config.botToken),
      },
      config: {
        channels: config.channels,
      },
    });

    await this.syncSlackChannels(dataSource.id);
    return dataSource;
  }

  async syncSlackChannels(dataSourceId: string) {
    const dataSource = await this.getDataSource(dataSourceId);
    const { WebClient } = require('@slack/web-api');
    
    const client = new WebClient(
      this.decrypt(dataSource.credentials.botToken)
    );

    for (const channelId of dataSource.config.channels) {
      // Fetch messages
      const result = await client.conversations.history({
        channel: channelId,
        limit: 1000,
      });

      // Group messages by thread
      const threads = this.groupMessagesByThread(result.messages);

      for (const thread of threads) {
        const content = thread.messages
          .map(m => `${m.user}: ${m.text}`)
          .join('\n');

        await this.processSyncedDocument({
          organizationId: dataSource.organizationId,
          dataSourceId: dataSource.id,
          externalId: thread.ts,
          title: `Slack thread from #${channelId}`,
          url: this.buildSlackUrl(channelId, thread.ts),
          contentType: 'slack_thread',
          rawContent: content,
          sourceMetadata: { channel: channelId, thread_ts: thread.ts },
        });
      }
    }
  }
}
```

---

## 10. Universal Document Processing

### LangChain Document Processing Pipeline

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { PineconeStore } from '@langchain/pinecone';

@Injectable()
export class DocumentProcessingService {
  /**
   * Process synced document into chunks with embeddings
   */
  async processDocument(syncedDocumentId: string) {
    const doc = await this.getSyncedDocument(syncedDocumentId);

    // 1. Text splitting
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const chunks = await splitter.createDocuments(
      [doc.processedContent || doc.rawContent],
      [{
        sourceId: doc.id,
        sourceType: doc.dataSource.sourceType,
        title: doc.title,
        url: doc.url,
      }]
    );

    // 2. Generate embeddings
    const embeddings = this.getEmbeddingsModel();

    // 3. Store in vector database
    const vectorStore = await PineconeStore.fromDocuments(
      chunks,
      embeddings,
      {
        pineconeIndex: this.pineconeIndex,
        namespace: doc.organizationId, // Tenant isolation
      }
    );

    // 4. Save chunk references
    for (let i = 0; i < chunks.length; i++) {
      await this.saveDocumentChunk({
        organizationId: doc.organizationId,
        syncedDocumentId: doc.id,
        chunkIndex: i,
        content: chunks[i].pageContent,
        tokenCount: this.countTokens(chunks[i].pageContent),
        vectorId: `${doc.id}_${i}`, // Pinecone ID
        metadata: chunks[i].metadata,
      });
    }

    // Update document status
    await this.updateSyncedDocument(doc.id, {
      processingStatus: 'completed',
      chunkCount: chunks.length,
    });
  }

  /**
   * Get embeddings model (Ollama for dev, OpenAI for prod)
   */
  private getEmbeddingsModel() {
    if (process.env.USE_OLLAMA === 'true') {
      return new OllamaEmbeddings({
        model: 'nomic-embed-text', // Fast local embeddings
        baseUrl: 'http://localhost:11434',
      });
    }

    return new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
  }
}
```

---

## 11. UI Mockups

### Data Sources Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base > Data Sources                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [📄 Upload Documents] [🔗 Connect Data Source ▼]                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Connected Data Sources                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🐙 GitHub Repository                          ✅ Active        │ │
│  │  owner/product-docs                                            │ │
│  │  ──────────────────────────────────────────────────────────    │ │
│  │  📊 245 files synced  •  Last sync: 2 hours ago               │ │
│  │  🔄 Auto-sync: Daily  •  Next sync: in 22 hours               │ │
│  │                                                                │ │
│  │  [⚙️ Settings] [🔄 Sync Now] [🗑️ Disconnect]                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📘 Confluence Space                           ✅ Active        │ │
│  │  Product Documentation (PROD)                                  │ │
│  │  ──────────────────────────────────────────────────────────    │ │
│  │  📊 89 pages synced  •  Last sync: 1 hour ago                 │ │
│  │  🔄 Auto-sync: Hourly  •  Next sync: in 45 minutes            │ │
│  │                                                                │ │
│  │  [⚙️ Settings] [🔄 Sync Now] [🗑️ Disconnect]                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📝 Notion Workspace                           🔄 Syncing...    │ │
│  │  Company Wiki                                                  │ │
│  │  ──────────────────────────────────────────────────────────    │ │
│  │  📊 Syncing: 45/156 pages (29%)                               │ │
│  │  [████████░░░░░░░░░░░░░░] 29% Complete                       │ │
│  │                                                                │ │
│  │  [❌ Cancel Sync]                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  📊 Jira Project                               ⚠️ Needs Setup   │ │
│  │  PROJ - Product Project                                        │ │
│  │  ──────────────────────────────────────────────────────────    │ │
│  │  ⚠️  Authentication expired. Please reconnect.                │ │
│  │                                                                │ │
│  │  [🔄 Reconnect]                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Connect Data Source Modal

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔗 Connect Data Source                                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Choose a data source to connect:                                     │
│                                                                       │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │   🐙       │    📘      │    📝      │    📊      │              │
│  │  GitHub    │ Confluence │   Notion   │    Jira    │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                                                       │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │   💬       │    📁      │    🌐      │    🔧      │              │
│  │   Slack    │   Drive    │  Website   │   Custom   │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  💡 Popular Choices                                           │   │
│  │  ─────────────────                                            │   │
│  │  • GitHub - For code documentation and wikis                 │   │
│  │  • Confluence - For company documentation                    │   │
│  │  • Notion - For internal knowledge bases                     │   │
│  │  • Jira - For issue history and project knowledge           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                                                          [Cancel]      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### GitHub Connection Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  🐙 Connect GitHub Repository                               Step 1/2  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Repository Details                                                   │
│  ───────────────────                                                  │
│                                                                       │
│  Repository URL *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ https://github.com/owner/repository                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Branch (Optional)                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ main                                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  What to sync:                                                        │
│  ☑️ Code files (.md, .txt, documentation)                            │
│  ☑️ Wiki pages                                                       │
│  ☑️ README files                                                     │
│  ☐ Issues (requires additional permissions)                          │
│  ☐ Pull Request descriptions                                         │
│                                                                       │
│  File types to include:                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ .md, .txt, .rst, .html [Edit...]                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Ignore patterns:                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ node_modules, .git, dist, build, vendor                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                                              [Cancel] [Next: Auth →]  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  🐙 Connect GitHub Repository                               Step 2/2  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Authentication                                                       │
│  ──────────────                                                       │
│                                                                       │
│  ( ) Personal Access Token (Recommended)                              │
│                                                                       │
│      ┌─────────────────────────────────────────────────────────┐   │
│      │ GitHub Personal Access Token                            │   │
│      │ ┌──────────────────────────────────────────────────┐    │   │
│      │ │ ghp_••••••••••••••••••••••••••••            [👁️] │    │   │
│      │ └──────────────────────────────────────────────────┘    │   │
│      │                                                          │   │
│      │ Required Scopes: repo, read:org                          │   │
│      │ [📚 How to create a token]                              │   │
│      └─────────────────────────────────────────────────────────┘   │
│                                                                       │
│  (●) OAuth (Sign in with GitHub)                                     │
│                                                                       │
│      [🔐 Authorize with GitHub]                                      │
│                                                                       │
│  Sync Frequency:                                                      │
│  ( ) Real-time (webhook)    (●) Daily    ( ) Weekly    ( ) Manual    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📊 Preview                                                  │   │
│  │  ────────                                                    │   │
│  │  Repository: owner/repository                                │   │
│  │  Estimated files: ~245                                       │   │
│  │  Estimated size: ~12MB                                       │   │
│  │  Processing time: ~5-10 minutes                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                                    [← Back] [Cancel] [🔗 Connect]    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 12. Sync Monitoring

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔄 Sync in Progress: Confluence Space                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [████████████████████████░░░░░░] 75% Complete                       │
│                                                                       │
│  Status: Processing pages...                                          │
│  Progress: 67/89 pages                                                │
│  Time elapsed: 3m 45s  •  ETA: 1m 15s                                │
│                                                                       │
│  Recent Activity:                                                     │
│  ├─ ✅ Processed "Getting Started Guide"                             │
│  ├─ ✅ Processed "API Documentation"                                 │
│  ├─ 🔄 Processing "User Manual"...                                   │
│  └─ ⏳ Pending: 22 pages                                             │
│                                                                       │
│  [❌ Cancel Sync]                                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. Complete Integration List

| Integration | Phase | Features | Auth Type |
|-------------|-------|----------|-----------|
| **📄 File Upload** | 1 | PDF, DOCX, TXT, MD | N/A |
| **🌐 Website** | 1 | URL scraping, sitemap | N/A |
| **🐙 GitHub** | 2 | Code, wiki, README, issues | OAuth/PAT |
| **📘 Confluence** | 2 | Pages, spaces, attachments | Basic/OAuth |
| **📝 Notion** | 2 | Pages, databases | API Key |
| **📁 Google Drive** | 2 | Docs, Sheets, PDFs | OAuth |
| **💬 Slack** | 2 | Messages, threads, files | OAuth |
| **📊 Jira** | 2 | Issues, comments | Basic/OAuth |
| **📧 Gmail** | 3 | Emails, threads | OAuth |
| **📋 SharePoint** | 3 | Documents, lists | OAuth |
| **💼 Salesforce** | 3 | Knowledge base, cases | OAuth |
| **🎫 Zendesk** | 3 | Articles, tickets | OAuth |
| **💬 Intercom** | 3 | Articles, conversations | API Key |
| **🗄️ Databases** | 3 | MySQL, Postgres, MongoDB | Credentials |
| **🔗 Custom API** | All | Any REST/GraphQL API | Various |

---

## 14. Features by Integration

### GitHub
- ✅ Repository files (markdown, code, docs)
- ✅ Wiki pages
- ✅ README files
- ✅ Issues and PR descriptions
- ✅ Release notes
- ✅ Discussions
- ✅ Auto-sync on push (webhook)

### Confluence
- ✅ All pages in space
- ✅ Page attachments
- ✅ Comments
- ✅ Page history
- ✅ Hierarchical structure
- ✅ Labels and metadata

### Notion
- ✅ Pages (all types)
- ✅ Databases
- ✅ Nested pages
- ✅ Database properties
- ✅ Inline databases
- ✅ Synced blocks

### Jira
- ✅ Issue descriptions
- ✅ Comments
- ✅ Attachments
- ✅ Custom fields
- ✅ Issue links
- ✅ Project knowledge

### Google Drive
- ✅ Google Docs
- ✅ Google Sheets (as text)
- ✅ Google Slides (as text)
- ✅ PDFs
- ✅ Folder structure
- ✅ Shared drives

### Slack
- ✅ Channel messages
- ✅ Thread conversations
- ✅ Pinned messages
- ✅ Shared files
- ✅ Bookmarks
- ✅ Channel descriptions

---

## 15. Sync Strategies

### Real-Time (Webhook-based)
- **How**: External service sends webhook on change
- **Latency**: <1 minute
- **Cost**: Low
- **Use for**: GitHub, Slack (high-change frequency)

### Scheduled (Cron-based)
- **How**: Periodic polling
- **Options**: Hourly, Daily, Weekly
- **Cost**: Medium
- **Use for**: Confluence, Notion (medium-change frequency)

### Manual
- **How**: User triggers sync
- **Use for**: One-time imports, testing

---

## 16. Cost Optimization

### Incremental Sync
```typescript
async syncIncremental(dataSourceId: string) {
  const dataSource = await this.getDataSource(dataSourceId);
  const lastSync = dataSource.lastSyncedAt;

  // Only fetch documents changed since last sync
  const changedDocs = await this.fetchChangedDocuments(
    dataSource,
    lastSync
  );

  // Process only changed documents
  for (const doc of changedDocs) {
    await this.processDocument(doc);
  }
}
```

### Smart Chunking
- Skip unchanged documents (hash comparison)
- Reuse existing embeddings
- Only update modified sections

---

## Documentation Complete - See files for full details!

