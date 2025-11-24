# Agent Actions & Tools Specification

## Overview

Enable AI agents to **execute actions** beyond just chatting - allowing them to read, write, update, and delete data across various systems. This transforms agents from passive chatbots to active assistants.

---

## 1. Agent Actions Architecture

### LangChain Tools Integration

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Example: Database query tool
const databaseQueryTool = new DynamicStructuredTool({
  name: 'query_database',
  description: 'Query the database to retrieve information',
  schema: z.object({
    table: z.string().describe('Table name to query'),
    filters: z.object({}).describe('Query filters'),
  }),
  func: async ({ table, filters }) => {
    // Execute database query
    const results = await database.query(table, filters);
    return JSON.stringify(results);
  },
});

// Agent with tools
const agent = await initializeAgentExecutorWithOptions(
  [databaseQueryTool, apiCallTool, fileWriteTool],
  model,
  {
    agentType: 'openai-functions',
    verbose: true,
  }
);
```

---

## 2. Core Action Types (CRUD Operations)

### 2.1 READ Actions

**Purpose**: Retrieve information from external systems

#### Database Query
```typescript
{
  name: 'database_read',
  description: 'Query database tables',
  permissions: ['read'],
  schema: {
    table: 'string',
    columns: 'string[]',
    where: 'object',
    limit: 'number'
  }
}
```

#### API Get Request
```typescript
{
  name: 'api_get',
  description: 'Make GET request to external API',
  permissions: ['read'],
  schema: {
    url: 'string',
    headers: 'object',
    queryParams: 'object'
  }
}
```

#### File Read
```typescript
{
  name: 'file_read',
  description: 'Read file contents',
  permissions: ['read'],
  schema: {
    path: 'string',
    encoding: 'string'
  }
}
```

### 2.2 WRITE Actions

**Purpose**: Create new data in external systems

#### Database Insert
```typescript
{
  name: 'database_create',
  description: 'Insert new record into database',
  permissions: ['write'],
  schema: {
    table: 'string',
    data: 'object'
  }
}
```

#### API Post Request
```typescript
{
  name: 'api_post',
  description: 'Make POST request to create resource',
  permissions: ['write'],
  schema: {
    url: 'string',
    headers: 'object',
    body: 'object'
  }
}
```

#### File Write
```typescript
{
  name: 'file_write',
  description: 'Write content to file',
  permissions: ['write'],
  schema: {
    path: 'string',
    content: 'string',
    encoding: 'string'
  }
}
```

### 2.3 UPDATE Actions

**Purpose**: Modify existing data

#### Database Update
```typescript
{
  name: 'database_update',
  description: 'Update existing record',
  permissions: ['update'],
  schema: {
    table: 'string',
    where: 'object',
    data: 'object'
  }
}
```

#### API Put/Patch Request
```typescript
{
  name: 'api_update',
  description: 'Make PUT/PATCH request to update resource',
  permissions: ['update'],
  schema: {
    url: 'string',
    method: 'PUT | PATCH',
    headers: 'object',
    body: 'object'
  }
}
```

### 2.4 DELETE Actions

**Purpose**: Remove data from systems

#### Database Delete
```typescript
{
  name: 'database_delete',
  description: 'Delete record from database',
  permissions: ['delete'],
  schema: {
    table: 'string',
    where: 'object'
  }
}
```

#### API Delete Request
```typescript
{
  name: 'api_delete',
  description: 'Make DELETE request to remove resource',
  permissions: ['delete'],
  schema: {
    url: 'string',
    headers: 'object'
  }
}
```

---

## 3. Database Schema

```sql
-- Agent tools/actions
CREATE TABLE agent_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID REFERENCES agents(id),
    
    -- Tool definition
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    tool_type VARCHAR(50) NOT NULL, -- database, api, file, custom
    action_type VARCHAR(20) NOT NULL, -- read, write, update, delete
    
    -- Configuration
    config JSONB NOT NULL, -- Tool-specific config
    schema JSONB NOT NULL, -- Input schema (Zod compatible)
    
    -- Permissions & Security
    permissions TEXT[] DEFAULT '{}', -- ['read', 'write', etc.]
    requires_approval BOOLEAN DEFAULT FALSE,
    allowed_tables TEXT[], -- For database tools
    allowed_endpoints TEXT[], -- For API tools
    rate_limit INTEGER DEFAULT 100, -- Requests per minute
    
    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tool execution logs
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    tool_id UUID NOT NULL REFERENCES agent_tools(id),
    conversation_id UUID REFERENCES conversations(id),
    
    -- Execution details
    input_params JSONB NOT NULL,
    output_result JSONB,
    status VARCHAR(50) NOT NULL, -- pending, approved, executed, failed
    error_message TEXT,
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Metadata
    execution_time_ms INTEGER,
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tool_executions_org_id ON tool_executions(organization_id);
CREATE INDEX idx_tool_executions_agent_id ON tool_executions(agent_id);
CREATE INDEX idx_tool_executions_status ON tool_executions(status);

-- Tool permissions (per user role)
CREATE TABLE tool_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tool_id UUID NOT NULL REFERENCES agent_tools(id),
    role VARCHAR(50) NOT NULL, -- admin, editor, viewer
    
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. NestJS Implementation

### Tools Service

```typescript
// src/modules/tools/tools.service.ts
import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

@Injectable()
export class ToolsService {
  /**
   * Create database query tool
   */
  createDatabaseQueryTool(organizationId: string) {
    return new DynamicStructuredTool({
      name: 'query_database',
      description: 'Query the organization database to retrieve information',
      schema: z.object({
        table: z.string().describe('Table name to query'),
        columns: z.array(z.string()).optional().describe('Columns to select'),
        where: z.object({}).optional().describe('WHERE clause filters'),
        limit: z.number().default(10).describe('Maximum rows to return'),
      }),
      func: async ({ table, columns, where, limit }) => {
        // Validate table is allowed
        if (!this.isTableAllowed(organizationId, table)) {
          throw new Error(`Access to table '${table}' is not allowed`);
        }

        // Execute query (simplified)
        const query = this.buildQuery(table, columns, where, limit);
        const results = await this.executeQuery(organizationId, query);
        
        return JSON.stringify(results);
      },
    });
  }

  /**
   * Create API call tool
   */
  createApiCallTool(organizationId: string) {
    return new DynamicStructuredTool({
      name: 'api_call',
      description: 'Make API request to external service',
      schema: z.object({
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
        url: z.string().url().describe('API endpoint URL'),
        headers: z.object({}).optional(),
        body: z.object({}).optional(),
      }),
      func: async ({ method, url, headers, body }) => {
        // Validate URL is allowed
        if (!this.isUrlAllowed(organizationId, url)) {
          throw new Error(`Access to URL '${url}' is not allowed`);
        }

        // Execute API call
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        return JSON.stringify(data);
      },
    });
  }

  /**
   * Create file operations tool
   */
  createFileOperationsTool(organizationId: string) {
    return new DynamicStructuredTool({
      name: 'file_operations',
      description: 'Read, write, or delete files in organization storage',
      schema: z.object({
        operation: z.enum(['read', 'write', 'delete']),
        path: z.string().describe('File path'),
        content: z.string().optional().describe('Content to write (for write operation)'),
      }),
      func: async ({ operation, path, content }) => {
        // Validate path is allowed
        if (!this.isPathAllowed(organizationId, path)) {
          throw new Error(`Access to path '${path}' is not allowed`);
        }

        switch (operation) {
          case 'read':
            return await this.readFile(organizationId, path);
          case 'write':
            await this.writeFile(organizationId, path, content);
            return 'File written successfully';
          case 'delete':
            await this.deleteFile(organizationId, path);
            return 'File deleted successfully';
        }
      },
    });
  }

  /**
   * Get all tools for an agent
   */
  async getToolsForAgent(agentId: string): Promise<DynamicStructuredTool[]> {
    const agent = await this.getAgent(agentId);
    const toolConfigs = await this.getToolConfigs(agentId);
    
    const tools: DynamicStructuredTool[] = [];

    for (const config of toolConfigs) {
      if (!config.isEnabled) continue;

      switch (config.toolType) {
        case 'database':
          tools.push(this.createDatabaseQueryTool(agent.organizationId));
          break;
        case 'api':
          tools.push(this.createApiCallTool(agent.organizationId));
          break;
        case 'file':
          tools.push(this.createFileOperationsTool(agent.organizationId));
          break;
        // Add more tool types...
      }
    }

    return tools;
  }
}
```

### Agent with Tools Execution

```typescript
// src/modules/agents/agents.service.ts
import { initializeAgentExecutorWithOptions } from 'langchain/agents';

@Injectable()
export class AgentsService {
  constructor(
    private toolsService: ToolsService,
    private langChainService: LangChainService,
  ) {}

  async executeWithTools(
    agentId: string,
    message: string,
  ): Promise<string> {
    // Get agent configuration
    const agent = await this.getAgent(agentId);
    
    // Get LLM
    const llm = this.langChainService.createLLM(agent.model);
    
    // Get enabled tools
    const tools = await this.toolsService.getToolsForAgent(agentId);
    
    // Create agent executor
    const executor = await initializeAgentExecutorWithOptions(
      tools,
      llm,
      {
        agentType: 'openai-functions',
        verbose: true,
        maxIterations: 5,
      }
    );

    // Execute
    const result = await executor.call({
      input: message,
    });

    // Log tool executions
    await this.logToolExecutions(agentId, result);

    return result.output;
  }
}
```

---

Continue in next message...
