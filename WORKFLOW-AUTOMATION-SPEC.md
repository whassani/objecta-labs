# 🔄 Workflow Automation Engine - Complete Specification

## Overview

Build a visual workflow automation engine that allows users to create, manage, and execute automated workflows using AI agents, tools, and integrations - similar to Zapier, n8n, or Make.com but integrated with ObjectaLabs's AI capabilities.

---

## Core Features

### 1. Visual Workflow Builder
- **Drag-and-drop interface** for creating workflows
- **Node-based editor** with connections between steps
- **Real-time validation** of workflow configuration
- **Zoom and pan** canvas for complex workflows
- **Auto-layout** and alignment tools

### 2. Workflow Nodes (Step Types)

#### Trigger Nodes (Start Points)
- **Schedule Trigger**: Cron-based scheduling (hourly, daily, weekly, etc.)
- **Webhook Trigger**: HTTP endpoint to receive external events
- **Manual Trigger**: Start workflow manually
- **Database Trigger**: Monitor database changes
- **Event Trigger**: Listen to internal events (new document, new message, etc.)
- **Email Trigger**: Trigger on incoming emails
- **Form Submission**: Trigger from web form

#### Action Nodes (Workflow Steps)
- **Agent Action**: Invoke an AI agent with a prompt
- **Tool Execution**: Execute a tool (HTTP API, calculator, custom tools)
- **Data Transformation**: Transform, map, filter data
- **HTTP Request**: Make API calls to external services
- **Database Operation**: Create, read, update, delete records
- **Email Action**: Send emails
- **Notification**: Send Slack, Teams, Discord notifications
- **Delay**: Wait for a specified duration
- **Loop**: Iterate over arrays/lists
- **Conditional**: If/else branching logic
- **Merge**: Combine multiple branches
- **Split**: Split into parallel branches
- **Variable Set**: Store values in workflow variables
- **Code Execution**: Run custom JavaScript/TypeScript code

#### Integration Nodes
- **Slack**: Send messages, create channels
- **Google Workspace**: Gmail, Sheets, Drive, Calendar
- **Microsoft 365**: Outlook, Teams, OneDrive
- **Salesforce**: Create leads, update opportunities
- **HubSpot**: Contact management, deals
- **Stripe**: Payment processing
- **Twilio**: SMS, voice calls
- **Airtable**: Database operations
- **Notion**: Page creation, database updates
- **GitHub**: Repository operations, issues, PRs

### 3. Workflow Management

#### Workflow Operations
- **Create** new workflows from scratch or templates
- **Edit** existing workflows
- **Duplicate** workflows
- **Version control** - save and restore versions
- **Import/Export** workflows as JSON
- **Share** workflows with team members
- **Publish/Unpublish** to activate/deactivate

#### Workflow Properties
- Name and description
- Tags and categories
- Owner and permissions
- Created/updated timestamps
- Status (draft, active, paused, error)
- Execution statistics

### 4. Workflow Execution

#### Execution Engine
- **Asynchronous execution** using job queues (Bull/BullMQ)
- **Parallel execution** of independent branches
- **Error handling** and retry logic
- **Timeout management** per node
- **State persistence** across steps
- **Resume capability** for failed workflows

#### Execution Context
- **Input data** from trigger
- **Variables** shared across nodes
- **Step outputs** accessible to subsequent steps
- **Environment variables** for configuration
- **Secrets** for API keys and credentials

#### Execution Monitoring
- **Real-time execution view** with highlighted active nodes
- **Step-by-step logs** with input/output data
- **Execution history** with filtering and search
- **Performance metrics** (duration, success rate)
- **Error tracking** and debugging tools

### 5. Data Flow & Variables

#### Variable System
- **Workflow variables**: Persistent across execution
- **Step variables**: Scoped to individual steps
- **Global variables**: Shared across workflows
- **Environment variables**: Per environment (dev, staging, prod)

#### Data Mapping
- **Visual data mapper** to connect node outputs to inputs
- **JSONPath expressions** for complex data extraction
- **Transformation functions** (string, number, date, array operations)
- **Template literals** with variable interpolation

### 6. Workflow Templates

#### Pre-built Templates
- **Customer Support Automation**: Auto-respond to common queries
- **Lead Qualification**: Score and route leads automatically
- **Content Generation**: Generate and publish content on schedule
- **Data Sync**: Sync data between systems
- **Report Generation**: Generate and email reports
- **Onboarding Automation**: Automate new user onboarding
- **Invoice Processing**: Extract and process invoice data
- **Social Media Posting**: Schedule and post content
- **Email Campaigns**: Automated email sequences
- **Meeting Scheduling**: Smart calendar management

#### Template Features
- One-click deployment
- Customizable after deployment
- Template marketplace (community templates)
- Template versioning
- Usage analytics

### 7. Error Handling & Reliability

#### Error Strategies
- **Retry logic**: Configurable retry attempts with backoff
- **Fallback nodes**: Alternative paths on failure
- **Error notifications**: Alert via email, Slack, etc.
- **Manual intervention**: Pause and wait for user action
- **Skip and continue**: Ignore errors and proceed

#### Monitoring & Alerts
- **Health checks**: Monitor workflow status
- **Performance alerts**: Slow execution warnings
- **Failure alerts**: Immediate notification on errors
- **SLA monitoring**: Track execution time SLAs
- **Cost monitoring**: Track API usage and costs

### 8. Security & Permissions

#### Access Control
- **Role-based permissions**: View, edit, execute, admin
- **Workflow ownership**: Personal vs team workflows
- **Secret management**: Encrypted storage of API keys
- **Audit logs**: Track all workflow changes
- **Execution isolation**: Secure execution environment

---

## Technical Architecture

### Database Schema

```sql
-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL, -- Node graph definition
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, archived
  trigger_type VARCHAR(50) NOT NULL, -- schedule, webhook, manual, event
  trigger_config JSONB, -- Trigger-specific configuration
  version INTEGER DEFAULT 1,
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_executed_at TIMESTAMP,
  execution_count INTEGER DEFAULT 0
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, cancelled
  trigger_data JSONB, -- Input data from trigger
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INTEGER,
  error TEXT,
  context JSONB -- Execution context and variables
);

-- Workflow execution steps table
CREATE TABLE workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL, -- Node ID from workflow definition
  node_type VARCHAR(100) NOT NULL, -- trigger, action, condition, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, skipped
  input_data JSONB,
  output_data JSONB,
  error TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0
);

-- Workflow templates table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  definition JSONB NOT NULL,
  icon VARCHAR(255),
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow secrets table (encrypted)
CREATE TABLE workflow_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL, -- Encrypted using AES-256
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  UNIQUE(organization_id, name)
);

-- Workflow webhooks table
CREATE TABLE workflow_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  webhook_url VARCHAR(255) UNIQUE NOT NULL,
  secret_token VARCHAR(255), -- For webhook verification
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_execution_steps_execution ON workflow_execution_steps(execution_id);
```

### Backend Architecture

#### Module Structure
```
backend/src/modules/workflows/
├── workflows.module.ts
├── workflows.controller.ts
├── workflows.service.ts
├── workflow-executor.service.ts
├── workflow-validator.service.ts
├── workflow-templates.service.ts
├── workflow-secrets.service.ts
├── dto/
│   ├── workflow.dto.ts
│   ├── execution.dto.ts
│   └── template.dto.ts
├── entities/
│   ├── workflow.entity.ts
│   ├── workflow-execution.entity.ts
│   ├── workflow-execution-step.entity.ts
│   ├── workflow-template.entity.ts
│   └── workflow-secret.entity.ts
├── nodes/
│   ├── base-node.ts
│   ├── trigger-nodes/
│   │   ├── schedule-trigger.node.ts
│   │   ├── webhook-trigger.node.ts
│   │   └── manual-trigger.node.ts
│   ├── action-nodes/
│   │   ├── agent-action.node.ts
│   │   ├── tool-execution.node.ts
│   │   ├── http-request.node.ts
│   │   └── email-action.node.ts
│   └── control-nodes/
│       ├── condition.node.ts
│       ├── loop.node.ts
│       └── delay.node.ts
├── integrations/
│   ├── slack.integration.ts
│   ├── google.integration.ts
│   └── microsoft.integration.ts
└── utils/
    ├── expression-evaluator.ts
    ├── data-transformer.ts
    └── secret-manager.ts
```

### Frontend Architecture

#### Component Structure
```
frontend/src/components/workflows/
├── WorkflowBuilder/
│   ├── WorkflowCanvas.tsx          # Main canvas with ReactFlow
│   ├── NodePalette.tsx             # Drag-and-drop node library
│   ├── NodeEditor.tsx              # Edit node properties
│   ├── ConnectionLine.tsx          # Custom connection styling
│   └── MiniMap.tsx                 # Canvas minimap
├── WorkflowList/
│   ├── WorkflowList.tsx            # List all workflows
│   ├── WorkflowCard.tsx            # Individual workflow card
│   └── WorkflowFilters.tsx         # Filter and search
├── WorkflowExecution/
│   ├── ExecutionViewer.tsx         # View execution details
│   ├── ExecutionLogs.tsx           # Step-by-step logs
│   ├── ExecutionHistory.tsx        # Past executions
│   └── ExecutionMetrics.tsx        # Performance metrics
├── WorkflowTemplates/
│   ├── TemplateGallery.tsx         # Browse templates
│   ├── TemplateCard.tsx            # Template preview
│   └── TemplateDeployModal.tsx     # Deploy template
├── NodeLibrary/
│   ├── TriggerNodes.tsx            # Trigger node components
│   ├── ActionNodes.tsx             # Action node components
│   └── ControlNodes.tsx            # Control flow nodes
└── Shared/
    ├── DataMapper.tsx              # Visual data mapping
    ├── ExpressionEditor.tsx        # Expression builder
    └── WorkflowSettings.tsx        # Workflow configuration
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic workflow engine infrastructure

**Backend**:
- [ ] Database schema and migrations
- [ ] Workflow entity and service
- [ ] Basic CRUD operations
- [ ] Workflow validation logic
- [ ] Simple execution engine (manual trigger only)

**Frontend**:
- [ ] ReactFlow setup and configuration
- [ ] Basic canvas with node dragging
- [ ] Simple node palette
- [ ] Workflow list page
- [ ] Create/edit workflow modal

**Deliverables**:
- Create and save workflows with manual trigger
- View workflow list
- Basic visual editor

### Phase 2: Core Nodes (Week 3-4)
**Goal**: Implement essential workflow nodes

**Nodes to Implement**:
- [ ] Manual trigger node
- [ ] Agent action node (invoke AI agent)
- [ ] Tool execution node
- [ ] HTTP request node
- [ ] Condition node (if/else)
- [ ] Delay node
- [ ] Email action node

**Features**:
- [ ] Node property editor
- [ ] Connection validation
- [ ] Data flow between nodes
- [ ] Execution context management

**Deliverables**:
- Execute simple workflows end-to-end
- Agent integration working
- Basic control flow

### Phase 3: Advanced Execution (Week 5-6)
**Goal**: Robust execution engine

**Features**:
- [ ] Async execution with job queue (BullMQ)
- [ ] Parallel branch execution
- [ ] Error handling and retry logic
- [ ] Execution history and logs
- [ ] Real-time execution viewer
- [ ] Step-by-step debugging

**Deliverables**:
- Production-ready execution engine
- Comprehensive error handling
- Execution monitoring

### Phase 4: Triggers & Scheduling (Week 7-8)
**Goal**: Automated workflow triggers

**Features**:
- [ ] Schedule trigger (cron)
- [ ] Webhook trigger
- [ ] Event-based triggers
- [ ] Webhook management UI
- [ ] Schedule configuration UI

**Deliverables**:
- Workflows run automatically
- Webhook endpoints working
- Scheduled executions

### Phase 5: Templates & Integrations (Week 9-10)
**Goal**: Pre-built templates and integrations

**Features**:
- [ ] Template system
- [ ] 5-10 workflow templates
- [ ] Template gallery UI
- [ ] One-click deployment
- [ ] Slack integration
- [ ] Google Workspace integration
- [ ] Basic integrations library

**Deliverables**:
- Template marketplace
- Working integrations
- Quick start experience

### Phase 6: Advanced Features (Week 11-12)
**Goal**: Enterprise-ready features

**Features**:
- [ ] Workflow versioning
- [ ] Secret management
- [ ] Advanced data mapping
- [ ] Loop and iteration
- [ ] Variables and expressions
- [ ] Import/export workflows
- [ ] Team sharing and permissions

**Deliverables**:
- Complete feature set
- Enterprise security
- Team collaboration

---

## Technology Stack

### Core Libraries
- **ReactFlow**: Visual workflow editor
- **BullMQ**: Job queue for async execution
- **Node-cron**: Cron scheduling
- **JSONPath**: Data extraction from JSON
- **VM2**: Secure JavaScript execution in sandbox
- **Crypto**: Secret encryption

### Additional Dependencies
```json
{
  "backend": {
    "bullmq": "^4.0.0",
    "node-cron": "^3.0.0",
    "jsonpath": "^1.1.1",
    "vm2": "^3.9.19",
    "crypto-js": "^4.2.0"
  },
  "frontend": {
    "reactflow": "^11.10.0",
    "@reactflow/node-resizer": "^2.2.0",
    "@reactflow/minimap": "^11.7.0",
    "@reactflow/controls": "^11.2.0",
    "react-hook-form": "^7.48.0",
    "monaco-editor": "^0.44.0"
  }
}
```

---

## API Endpoints

### Workflows
```
POST   /api/workflows                    # Create workflow
GET    /api/workflows                    # List workflows
GET    /api/workflows/:id                # Get workflow
PUT    /api/workflows/:id                # Update workflow
DELETE /api/workflows/:id                # Delete workflow
POST   /api/workflows/:id/duplicate      # Duplicate workflow
POST   /api/workflows/:id/execute        # Execute workflow manually
PUT    /api/workflows/:id/activate       # Activate workflow
PUT    /api/workflows/:id/deactivate     # Deactivate workflow
```

### Executions
```
GET    /api/workflows/:id/executions     # List executions
GET    /api/executions/:id               # Get execution details
GET    /api/executions/:id/logs          # Get execution logs
POST   /api/executions/:id/cancel        # Cancel execution
POST   /api/executions/:id/retry         # Retry failed execution
```

### Templates
```
GET    /api/workflow-templates           # List templates
GET    /api/workflow-templates/:id       # Get template
POST   /api/workflow-templates/:id/deploy # Deploy template
POST   /api/workflow-templates           # Create custom template
```

### Webhooks
```
GET    /api/workflows/:id/webhooks       # Get webhook info
POST   /api/workflows/:id/webhooks       # Create webhook
DELETE /api/workflows/:id/webhooks/:webhookId # Delete webhook
POST   /webhooks/:webhookUrl             # Webhook endpoint
```

---

## User Interface Mockup

### Workflow List Page
```
┌─────────────────────────────────────────────────────────────┐
│ Workflows                                    [+ New Workflow]│
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search] [Filter: All ▼] [Sort: Recent ▼]               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Customer Support Automation                          │ │
│ │ Automatically respond to common queries                 │ │
│ │ Last run: 5 min ago | Success rate: 98%                 │ │
│ │ [Edit] [Execute] [•••]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Lead Qualification Pipeline                          │ │
│ │ Score and route leads automatically                      │ │
│ │ Last run: 2 hours ago | Success rate: 95%               │ │
│ │ [Edit] [Execute] [•••]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Builder
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back | Customer Support Automation    [Save] [Execute]    │
├──────────┬──────────────────────────────────────────────────┤
│ Nodes    │                                                  │
│          │  ┌──────────────┐                                │
│ Triggers │  │   Schedule   │                                │
│ □ Schedule│  │  Every hour  │                                │
│ □ Webhook│  └──────┬───────┘                                │
│ □ Manual │         │                                        │
│          │         ▼                                        │
│ Actions  │  ┌──────────────┐                                │
│ □ Agent  │  │  Agent Call  │                                │
│ □ Tool   │  │  CS Agent    │                                │
│ □ HTTP   │  └──────┬───────┘                                │
│ □ Email  │         │                                        │
│          │         ▼                                        │
│ Control  │  ┌──────────────┐                                │
│ □ If/Else│  │  Condition   │                                │
│ □ Loop   │  │  Confidence  │                                │
│ □ Delay  │  │     > 0.8    │                                │
│          │  └─┬─────────┬──┘                                │
│          │    │ Yes  No │                                   │
│          │    ▼         ▼                                   │
│          │ [Send]   [Escalate]                              │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Success Metrics

### User Adoption
- 50% of active users create at least 1 workflow
- Average 5 workflows per organization
- 80% of created workflows are activated

### Usage Metrics
- 10,000+ workflow executions per day
- 95%+ execution success rate
- < 5 second average execution time

### Business Impact
- 30% increase in user retention
- 20% increase in paid conversions
- "Workflow Automation" as top-requested feature

---

## Next Steps

1. **Review and approve** this specification
2. **Set up project tracking** (Jira epic/stories)
3. **Begin Phase 1 implementation**
4. **Weekly demos** and iteration
5. **User testing** after Phase 2

---

**Ready to start building? 🚀**
