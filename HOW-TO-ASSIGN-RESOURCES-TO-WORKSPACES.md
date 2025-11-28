# How to Assign Agents, Workflows & Knowledge Base to Workspaces

## Overview

This guide explains how to assign resources (agents, workflows, knowledge base documents) to specific workspaces. Currently, **agents** and **workflows** have built-in workspace support, while **knowledge base** needs to be enhanced.

---

## 📊 Current Status

| Resource | Workspace Support | Status |
|----------|-------------------|--------|
| **Agents** | ✅ Yes | Fully supported with `workspaceId` field |
| **Workflows** | ✅ Yes | Fully supported with `workspaceId` field |
| **Knowledge Base** | ⚠️ Partial | Organization-level only (needs workspace field) |

---

## 🤖 Assigning Agents to Workspaces

### Backend (Already Implemented)

The `Agent` entity has a `workspaceId` field:

```typescript
@Entity('agents')
export class Agent {
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;
  
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;
}
```

### API Endpoints

**Create Agent with Workspace:**
```bash
POST /api/agents
{
  "name": "Marketing Assistant",
  "description": "Helps with marketing content",
  "model": "gpt-4",
  "workspaceId": "workspace-uuid-here",  // ← Assign to workspace
  "systemPrompt": "You are a marketing expert..."
}
```

**Filter Agents by Workspace:**
```bash
GET /api/agents?workspaceId=workspace-uuid-here
```

### Frontend Implementation

#### Method 1: Create Agent from Workspace Detail Page

Add a link that pre-fills the workspace:

```tsx
// In /dashboard/workspaces/[id]/page.tsx
<Link href={`/dashboard/agents/new?workspaceId=${workspaceId}`}>
  <Button>
    <PlusIcon className="h-5 w-5 mr-2" />
    Create Agent
  </Button>
</Link>
```

#### Method 2: Add Workspace Selector to Agent Form

Update the create agent form to include workspace selection:

```tsx
// In /dashboard/agents/new/page.tsx
import { workspacesApi } from '@/lib/api'

// Fetch workspaces
const { data: workspaces } = useQuery({
  queryKey: ['workspaces'],
  queryFn: () => workspacesApi.getAll().then(res => res.data),
})

// Add to form
<div>
  <label>Workspace</label>
  <select
    value={formData.workspaceId}
    onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
  >
    <option value="">No workspace (organization-wide)</option>
    {workspaces?.map(ws => (
      <option key={ws.id} value={ws.id}>{ws.name}</option>
    ))}
  </select>
</div>
```

#### Method 3: Filter Agents by Workspace

Display only workspace-specific agents:

```tsx
// Fetch agents for specific workspace
const { data: agents } = useQuery({
  queryKey: ['agents', workspaceId],
  queryFn: () => agentsApi.getAll(workspaceId).then(res => res.data),
})
```

---

## 🔧 Assigning Workflows to Workspaces

### Backend (Already Implemented)

The `Workflow` entity has a `workspaceId` field:

```typescript
@Entity('workflows')
export class Workflow {
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;
  
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;
}
```

### API Endpoints

**Create Workflow with Workspace:**
```bash
POST /api/workflows
{
  "name": "Lead Generation Flow",
  "description": "Automated lead qualification",
  "workspaceId": "workspace-uuid-here",  // ← Assign to workspace
  "nodes": [...],
  "edges": [...]
}
```

**Filter Workflows by Workspace:**
```bash
GET /api/workflows?workspaceId=workspace-uuid-here
```

### Frontend Implementation

Same three methods as agents:

1. **Link from workspace page:**
```tsx
<Link href={`/dashboard/workflows/new?workspaceId=${workspaceId}`}>
  Create Workflow
</Link>
```

2. **Add workspace selector to workflow form**

3. **Filter workflows by workspace:**
```tsx
const { data: workflows } = useQuery({
  queryKey: ['workflows', workspaceId],
  queryFn: () => workflowsApi.getAll({ workspaceId }).then(res => res.data),
})
```

---

## 📚 Assigning Knowledge Base to Workspaces

### Current Status: Organization-Level Only

Knowledge base documents are currently at the organization level without workspace support.

### Option 1: Quick Fix - Use Collections

Collections can act as workspace containers:

```bash
POST /api/knowledge-base/data-sources
{
  "name": "Marketing Workspace Docs",
  "type": "manual",
  "config": {
    "workspaceId": "workspace-uuid-here"  // Store in config
  }
}
```

### Option 2: Add Workspace Field (Recommended)

#### Step 1: Database Migration

```sql
-- Add workspace_id to documents table
ALTER TABLE documents 
ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Add index
CREATE INDEX idx_documents_workspace ON documents(workspace_id);

-- Add workspace_id to data_sources table
ALTER TABLE data_sources 
ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Add index
CREATE INDEX idx_data_sources_workspace ON data_sources(workspace_id);
```

#### Step 2: Update Entity

```typescript
// backend/src/modules/knowledge-base/entities/document.entity.ts
@Entity('documents')
export class Document {
  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;
  
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;
}
```

#### Step 3: Update Service

```typescript
// Filter by workspace
async findAll(organizationId: string, workspaceId?: string) {
  const query = { organizationId };
  if (workspaceId) {
    query['workspaceId'] = workspaceId;
  }
  return this.documentsRepository.find({ where: query });
}
```

#### Step 4: Update Controller

```typescript
@Get('documents')
async getDocuments(
  @Request() req,
  @Query('workspaceId') workspaceId?: string
) {
  return this.knowledgeBaseService.findAll(
    req.user.organizationId, 
    workspaceId
  );
}
```

---

## 🎯 Complete Implementation Example

Let me create a complete example showing all three resources:

### 1. Enhanced Workspace Detail Page

```tsx
// frontend/src/app/(dashboard)/dashboard/workspaces/[id]/page.tsx

export default function WorkspaceDetailPage() {
  const workspaceId = params.id as string
  
  // Fetch workspace-specific resources
  const { data: agents } = useQuery({
    queryKey: ['workspace-agents', workspaceId],
    queryFn: () => agentsApi.getAll(workspaceId).then(res => res.data),
  })
  
  const { data: workflows } = useQuery({
    queryKey: ['workspace-workflows', workspaceId],
    queryFn: () => workflowsApi.getAll({ workspaceId }).then(res => res.data),
  })
  
  const { data: documents } = useQuery({
    queryKey: ['workspace-documents', workspaceId],
    queryFn: () => knowledgeBaseApi.getDocuments(workspaceId).then(res => res.data),
  })
  
  return (
    <div>
      {/* Agents Section */}
      <Card>
        <h2>Agents ({agents?.length || 0})</h2>
        {agents?.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        <Link href={`/dashboard/agents/new?workspaceId=${workspaceId}`}>
          <Button>Create Agent</Button>
        </Link>
      </Card>
      
      {/* Workflows Section */}
      <Card>
        <h2>Workflows ({workflows?.length || 0})</h2>
        {workflows?.map(workflow => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
        <Link href={`/dashboard/workflows/new?workspaceId=${workspaceId}`}>
          <Button>Create Workflow</Button>
        </Link>
      </Card>
      
      {/* Knowledge Base Section */}
      <Card>
        <h2>Documents ({documents?.length || 0})</h2>
        {documents?.map(doc => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
        <Link href={`/dashboard/knowledge-base?workspaceId=${workspaceId}`}>
          <Button>Upload Documents</Button>
        </Link>
      </Card>
    </div>
  )
}
```

### 2. Pre-fill Form from URL Parameters

```tsx
// frontend/src/app/(dashboard)/dashboard/agents/new/page.tsx

export default function NewAgentPage() {
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model: 'gpt-4',
    workspaceId: workspaceId || '',  // ← Pre-filled from URL
  })
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input type="hidden" name="workspaceId" value={formData.workspaceId} />
    </form>
  )
}
```

---

## 🔄 Move Resources Between Workspaces

### API Endpoint

```typescript
// backend/src/modules/agents/agents.controller.ts
@Put(':id/move-to-workspace')
async moveToWorkspace(
  @Param('id') id: string,
  @Body() moveDto: { workspaceId: string },
  @CurrentUser() user: UserPayload
) {
  return this.agentsService.update(
    id, 
    { workspaceId: moveDto.workspaceId }, 
    user.organizationId
  );
}
```

### Frontend Implementation

```tsx
// Move agent to different workspace
const moveAgent = async (agentId: string, newWorkspaceId: string) => {
  await agentsApi.update(agentId, { workspaceId: newWorkspaceId })
  queryClient.invalidateQueries(['agents'])
}

// UI Component
<select
  value={agent.workspaceId}
  onChange={(e) => moveAgent(agent.id, e.target.value)}
>
  <option value="">No workspace</option>
  {workspaces?.map(ws => (
    <option key={ws.id} value={ws.id}>{ws.name}</option>
  ))}
</select>
```

---

## 📋 Summary & Quick Actions

### ✅ Already Working

**Agents:**
- ✅ Create with workspace
- ✅ Filter by workspace
- ✅ Move between workspaces

**Workflows:**
- ✅ Create with workspace
- ✅ Filter by workspace
- ✅ Move between workspaces

### ⚠️ Needs Implementation

**Knowledge Base:**
- ❌ Add `workspaceId` field to database
- ❌ Update entity and DTOs
- ❌ Update service and controller
- ❌ Update frontend forms

### 🚀 Quick Start (Agents & Workflows)

**To assign an agent to a workspace:**
```bash
# When creating
curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Bot",
    "model": "gpt-4",
    "workspaceId": "your-workspace-uuid"
  }'

# Or update existing
curl -X PUT http://localhost:3001/api/agents/agent-uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "your-workspace-uuid"
  }'
```

**To filter agents by workspace:**
```bash
curl -X GET "http://localhost:3001/api/agents?workspaceId=your-workspace-uuid" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 UI Enhancements Needed

### 1. Workspace Selector Component

Create a reusable workspace selector:

```tsx
// components/WorkspaceSelector.tsx
export function WorkspaceSelector({ value, onChange }) {
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })
  
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Organization-wide</option>
      {workspaces?.map(ws => (
        <option key={ws.id} value={ws.id}>
          {ws.icon} {ws.name}
        </option>
      ))}
    </select>
  )
}
```

### 2. Resource Count Badges

Show count of resources in each workspace:

```tsx
<Card>
  <h3>Marketing Team</h3>
  <div className="flex gap-2">
    <Badge>{agentCount} Agents</Badge>
    <Badge>{workflowCount} Workflows</Badge>
    <Badge>{docCount} Documents</Badge>
  </div>
</Card>
```

### 3. Bulk Move Operation

Allow moving multiple resources at once:

```tsx
<Button onClick={() => bulkMove(selectedIds, targetWorkspaceId)}>
  Move {selectedIds.length} items to workspace
</Button>
```

---

## 📖 Next Steps

**To fully implement workspace resource assignment:**

1. ✅ **Agents & Workflows** - Already working, just need UI enhancements
2. ⚠️ **Knowledge Base** - Needs database migration and code updates
3. 🔧 **UI Improvements** - Add workspace selectors to all create/edit forms
4. 📊 **Analytics** - Track resources per workspace
5. 🔄 **Bulk Operations** - Move multiple resources at once

**Would you like me to:**
1. Add workspace field to Knowledge Base (database + backend + frontend)?
2. Create workspace selector component for all forms?
3. Update workspace detail page to show all resources?
4. Add bulk move operations?

Let me know which you'd like to implement next!
