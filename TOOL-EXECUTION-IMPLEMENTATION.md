# Tool Execution System - Implementation Plan

## Overview
Enable agents to execute tools/actions during conversations using LangChain's tool framework.

## Current State
✅ Tool entity and CRUD operations exist
✅ Tool schema supports: toolType, actionType, config, schema
✅ Conversation service has RAG integration
❌ No tool execution logic
❌ No LangChain tools integration
❌ No built-in tools

## Implementation Steps

### Phase 1: Core Tool Execution Engine
1. **Tool Executor Service** (`tool-executor.service.ts`)
   - Execute tools based on type
   - Handle tool parameters
   - Error handling and retries
   - Rate limiting
   - Logging and monitoring

2. **LangChain Tool Adapter** (`langchain-tool.adapter.ts`)
   - Convert our Tool entity to LangChain tools
   - Handle tool schemas
   - Parameter validation

### Phase 2: Built-in Tools
3. **HTTP API Tool**
   - Make REST API calls
   - Support GET, POST, PUT, DELETE
   - Headers and authentication
   - Response parsing

4. **Calculator Tool**
   - Safe math evaluation
   - Support basic operations

5. **Web Search Tool** (Optional)
   - DuckDuckGo or similar
   - Return relevant results

### Phase 3: Conversation Integration
6. **Update Conversations Service**
   - Detect when agent needs tools
   - Load agent's tools
   - Execute tools during conversation
   - Include tool results in context
   - Track tool usage in messages

### Phase 4: Agent-Tool Association
7. **Agent-Tool Relationship**
   - Many-to-many relationship
   - Agent can have multiple tools
   - Tool can be shared across agents

### Phase 5: Frontend
8. **Tool Management UI**
   - Create/edit tool form
   - Test tool interface
   - Assign tools to agents
   - Tool execution history

## File Structure
```
backend/src/modules/tools/
├── entities/
│   ├── tool.entity.ts (exists)
│   └── agent-tool.entity.ts (NEW - junction table)
├── dto/
│   ├── tool.dto.ts (exists)
│   └── execute-tool.dto.ts (NEW)
├── tools.controller.ts (exists - add execute endpoint)
├── tools.service.ts (exists - add findByAgent)
├── tools.module.ts (exists)
├── tool-executor.service.ts (NEW)
├── langchain-tool.adapter.ts (NEW)
└── built-in/
    ├── http-api.tool.ts (NEW)
    ├── calculator.tool.ts (NEW)
    └── web-search.tool.ts (NEW - optional)
```

## Priority Order
1. Tool Executor Service
2. HTTP API Tool (most useful)
3. Calculator Tool
4. LangChain Tool Adapter
5. Conversation Integration
6. Agent-Tool Association
7. Frontend UI
8. Web Search Tool (if time permits)
