# 🚀 Workflow Automation Engine - Quick Start Guide

## What Was Built

We've implemented **Phase 1: Foundation** of the Workflow Automation Engine - a complete backend and frontend infrastructure for creating and managing automated workflows.

## 🎯 Key Features

### Backend ✅
- **6 Database Tables**: workflows, executions, steps, templates, secrets, webhooks
- **12 API Endpoints**: Full CRUD + execution management
- **3 Services**: WorkflowsService, WorkflowExecutorService, WorkflowValidatorService
- **Type-Safe**: Complete TypeScript entities and DTOs
- **Multi-tenant**: Organization-scoped security
- **Execution Engine**: Async workflow execution with step tracking

### Frontend ✅
- **Workflows List Page**: Browse, search, filter workflows
- **Create Workflow Page**: Configure workflow metadata
- **Navigation**: Workflows added to sidebar
- **API Client**: Full integration with backend

### Supported Features
- ✅ Create/Edit/Delete workflows
- ✅ Activate/Deactivate workflows
- ✅ Duplicate workflows
- ✅ Execute workflows (manual trigger)
- ✅ Track execution history
- ✅ Cancel running executions
- ✅ 7 Trigger types: Manual, Schedule, Webhook, Event, Database, Email, Form

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Workflows   │  │   Create    │  │   Execution      │   │
│  │ List Page   │  │   Workflow  │  │   History        │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐ │
│  │ Workflows        │  │ Workflow         │  │ Workflow │ │
│  │ Controller       │→│ Executor         │→│Validator│ │
│  │ (12 endpoints)   │  │ Service          │  │ Service  │ │
│  └──────────────────┘  └──────────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  workflows │ executions │ steps │ templates │ secrets │...  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (already installed)
cd ../frontend
npm install
```

### 2. Run Database Migration
```bash
# Make sure PostgreSQL is running and database exists
cd backend
psql -U postgres -d objecta-labs -f src/migrations/create-workflows-tables.sql
```

Expected output:
```
CREATE EXTENSION
CREATE TABLE (workflows)
CREATE TABLE (workflow_executions)
CREATE TABLE (workflow_execution_steps)
CREATE TABLE (workflow_templates)
CREATE TABLE (workflow_secrets)
CREATE TABLE (workflow_webhooks)
CREATE INDEX (x15)
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Navigate to**: http://localhost:3000/dashboard/workflows

## 📖 Usage Examples

### Create a Workflow via UI
1. Go to http://localhost:3000/dashboard/workflows
2. Click "New Workflow"
3. Fill in:
   - Name: "Customer Support Automation"
   - Description: "Auto-respond to common queries"
   - Trigger: Manual
4. Click "Save Workflow"

### Create a Workflow via API
```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Qualification",
    "description": "Automatically qualify and route leads",
    "triggerType": "manual",
    "definition": {
      "nodes": [
        {
          "id": "trigger-1",
          "type": "trigger-manual",
          "position": {"x": 100, "y": 100},
          "data": {"label": "Manual Trigger"}
        }
      ],
      "edges": []
    }
  }'
```

### Execute a Workflow
```bash
curl -X POST http://localhost:3001/api/workflows/{workflowId}/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "triggerData": {
      "customer": "John Doe",
      "query": "How do I reset my password?"
    }
  }'
```

### Check Execution Status
```bash
curl http://localhost:3001/api/workflows/executions/{executionId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create a workflow
- [ ] View workflow list
- [ ] Edit workflow
- [ ] Duplicate workflow
- [ ] Execute workflow
- [ ] View execution history
- [ ] Cancel execution
- [ ] Delete workflow

### Database Verification
```sql
-- Check tables exist
\dt workflows*

-- View workflows
SELECT id, name, status, trigger_type FROM workflows;

-- View executions
SELECT id, workflow_id, status, start_time FROM workflow_executions;

-- View execution steps
SELECT id, execution_id, node_type, status FROM workflow_execution_steps;
```

## 📊 What's Next - Phase 2

### Coming Soon
1. **Visual Workflow Builder** (ReactFlow)
   - Drag-and-drop canvas
   - Node palette
   - Connection system
   - Real-time validation

2. **Core Nodes Implementation**
   - Agent action node
   - Tool execution node
   - HTTP request node
   - Condition node (if/else)
   - Delay node
   - Email action node

3. **Advanced Execution**
   - BullMQ job queue
   - Parallel execution
   - Retry logic
   - Real-time viewer

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Migration Already Applied
```
ERROR: relation "workflows" already exists
```
**Solution**: Tables already created, skip migration

### JWT Token Required
```
401 Unauthorized
```
**Solution**: 
1. Login via UI: http://localhost:3000/login
2. Get token from localStorage
3. Use in API requests: `Authorization: Bearer {token}`

## 📁 File Structure

```
backend/src/modules/workflows/
├── entities/
│   ├── workflow.entity.ts
│   ├── workflow-execution.entity.ts
│   ├── workflow-execution-step.entity.ts
│   ├── workflow-template.entity.ts
│   ├── workflow-secret.entity.ts
│   └── workflow-webhook.entity.ts
├── dto/
│   ├── workflow.dto.ts
│   ├── execution.dto.ts
│   └── template.dto.ts
├── workflows.controller.ts
├── workflows.service.ts
├── workflow-executor.service.ts
├── workflow-validator.service.ts
└── workflows.module.ts

frontend/src/app/(dashboard)/dashboard/workflows/
├── page.tsx                 # Workflows list
└── new/
    └── page.tsx            # Create workflow
```

## 🎯 Success Metrics

### What's Working
- ✅ **Backend**: 12 API endpoints operational
- ✅ **Database**: 6 tables with proper relationships
- ✅ **Frontend**: 2 pages with navigation
- ✅ **Security**: JWT auth + organization scoping
- ✅ **Execution**: Basic workflow execution engine

### Current Limitations
- ⏳ Visual builder not yet implemented (Phase 2)
- ⏳ Node execution returns placeholder data
- ⏳ No schedule/webhook triggers yet
- ⏳ No job queue (in-memory execution)

## 📚 Documentation

- **Full Spec**: `WORKFLOW-AUTOMATION-SPEC.md`
- **Phase 1 Complete**: `WORKFLOW-AUTOMATION-PHASE-1-COMPLETE.md`
- **This Guide**: `WORKFLOW-AUTOMATION-QUICK-START.md`

## 💡 Tips

1. **Start Simple**: Create workflows with basic metadata first
2. **Test Execution**: Use manual trigger to test execution flow
3. **Check Logs**: Backend logs show execution details
4. **Database Inspection**: Use SQL to verify data
5. **API Testing**: Use curl or Postman for API exploration

## 🤝 Contributing

Phase 2 priorities:
1. Visual workflow builder (ReactFlow)
2. Node implementations
3. Job queue integration
4. Schedule triggers
5. Webhook triggers

## 📞 Support

- **Specification**: See `WORKFLOW-AUTOMATION-SPEC.md`
- **Status**: See `WORKFLOW-AUTOMATION-PHASE-1-COMPLETE.md`
- **API Docs**: Swagger endpoint (coming soon)

---

**🎉 Phase 1 Complete! Ready for Phase 2: Visual Builder & Core Nodes**
