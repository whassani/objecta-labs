# 🧪 Complete Workflow Testing Guide

## 📋 Overview

This guide shows you how to test **all workflow trigger types** and execution modes in your system.

---

## 🎯 Available Trigger Types

Your system supports these workflow triggers:

1. **Manual** - Test Run button (what you're using now)
2. **Webhook** - HTTP endpoint triggers
3. **Schedule** - Time-based (cron) triggers
4. **Event** - System event triggers

Let me show you how to test each one!

---

## 1️⃣ Manual Trigger (Test Run)

### ✅ What You're Already Using

This is the **Test Run** button you've been using.

### How It Works
```
User clicks "Test Run" 
  ↓
Frontend calls POST /api/workflows/:id/execute
  ↓
Backend executes workflow immediately
  ↓
Results shown in debug panel
```

### Test It
```bash
# You're already doing this! ✅
Click "Test Run" button in the UI
```

---

## 2️⃣ Webhook Trigger

### 🎯 What It Does

External systems can trigger your workflow by calling an HTTP endpoint.

### Setup Steps

#### Step 1: Create a Workflow with Webhook Trigger

**Via UI:**
1. Create/Edit a workflow
2. Set trigger type to "Webhook"
3. Save the workflow

**Via API:**
```bash
# 1. Create workflow
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Webhook Test Workflow",
    "description": "Test webhook triggers",
    "triggerType": "webhook",
    "definition": {
      "nodes": [
        {
          "id": "trigger_1",
          "type": "trigger",
          "data": { "triggerType": "webhook" }
        },
        {
          "id": "agent_1",
          "type": "agent",
          "data": {
            "agentId": "YOUR_AGENT_ID",
            "prompt": "Process this webhook data: {{trigger.payload}}"
          }
        }
      ],
      "edges": [
        { "source": "trigger_1", "target": "agent_1" }
      ]
    },
    "organizationId": "YOUR_ORG_ID"
  }'
```

#### Step 2: Create Webhook URL

```bash
# Create webhook for the workflow
curl -X POST http://localhost:3001/api/webhooks/create/WORKFLOW_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "id": "webhook-id",
  "workflowId": "workflow-id",
  "webhookUrl": "wh_abc123...",
  "secretToken": "secret123...",
  "isActive": true
}
```

#### Step 3: Trigger the Webhook

```bash
# Simple trigger (no signature)
curl -X POST http://localhost:3001/api/webhooks/wh_abc123... \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.created",
    "data": {
      "userId": "123",
      "email": "test@example.com"
    }
  }'

# Response:
{
  "success": true,
  "executionId": "exec-123",
  "message": "Workflow triggered successfully"
}
```

#### Step 4: With Signature Verification (Secure)

```bash
# Generate signature (in your app)
# signature = HMAC-SHA256(payload, secretToken)

curl -X POST http://localhost:3001/api/webhooks/wh_abc123... \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: CALCULATED_SIGNATURE" \
  -d '{
    "event": "order.completed",
    "data": { "orderId": "456" }
  }'
```

### Real-World Example: GitHub Webhook

```bash
# 1. Create webhook in GitHub settings
# URL: http://your-domain.com/api/webhooks/wh_abc123...

# 2. GitHub sends events automatically
# Example: Push event
{
  "ref": "refs/heads/main",
  "commits": [...],
  "pusher": {
    "name": "john",
    "email": "john@example.com"
  }
}

# 3. Your workflow processes the push event
# Agent can analyze commits, send notifications, etc.
```

---

## 3️⃣ Schedule Trigger (Cron Jobs)

### 🎯 What It Does

Workflows run automatically at specified times (like cron jobs).

### Setup Steps

#### Step 1: Create Scheduled Workflow

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Daily Report",
    "description": "Generate daily report at 9 AM",
    "triggerType": "schedule",
    "triggerConfig": {
      "schedule": "0 9 * * *",
      "timezone": "America/New_York"
    },
    "definition": {
      "nodes": [
        {
          "id": "trigger_1",
          "type": "trigger",
          "data": { "triggerType": "schedule" }
        },
        {
          "id": "agent_1",
          "type": "agent",
          "data": {
            "agentId": "YOUR_AGENT_ID",
            "prompt": "Generate daily sales report"
          }
        }
      ],
      "edges": [
        { "source": "trigger_1", "target": "agent_1" }
      ]
    },
    "organizationId": "YOUR_ORG_ID"
  }'
```

### Cron Schedule Examples

```bash
# Every minute (for testing)
"schedule": "* * * * *"

# Every hour
"schedule": "0 * * * *"

# Daily at 9 AM
"schedule": "0 9 * * *"

# Every Monday at 8 AM
"schedule": "0 8 * * 1"

# First day of month at midnight
"schedule": "0 0 1 * *"
```

### Test Scheduled Workflows

```bash
# Option 1: Wait for schedule (slow)
# Just wait for the cron time to arrive

# Option 2: Trigger manually (fast)
# Use Test Run button to test logic immediately

# Option 3: Set to run every minute (quick test)
# Update schedule to "* * * * *" temporarily
```

---

## 4️⃣ Event Trigger

### 🎯 What It Does

Workflows triggered by internal system events.

### Example Events

```typescript
// User registration
{
  event: 'user.registered',
  data: { userId, email, timestamp }
}

// Document uploaded
{
  event: 'document.uploaded',
  data: { documentId, filename, size }
}

// Conversation started
{
  event: 'conversation.started',
  data: { conversationId, userId }
}
```

### Setup Steps

```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Welcome New Users",
    "triggerType": "event",
    "triggerConfig": {
      "eventType": "user.registered"
    },
    "definition": {
      "nodes": [
        {
          "id": "trigger_1",
          "type": "trigger",
          "data": { "triggerType": "event" }
        },
        {
          "id": "agent_1",
          "type": "agent",
          "data": {
            "agentId": "YOUR_AGENT_ID",
            "prompt": "Send welcome email to {{trigger.data.email}}"
          }
        }
      ],
      "edges": [
        { "source": "trigger_1", "target": "agent_1" }
      ]
    },
    "organizationId": "YOUR_ORG_ID"
  }'
```

---

## 🔄 Conversational Workflows

### 🎯 What It Means

Workflows that involve back-and-forth conversation with users.

### Example: Customer Support Bot

```javascript
// Workflow structure
{
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger",
      "data": { "triggerType": "webhook" }
    },
    {
      "id": "agent_1",
      "type": "agent",
      "data": {
        "agentId": "support-agent",
        "prompt": "User message: {{trigger.payload.message}}"
      }
    },
    {
      "id": "condition_1",
      "type": "condition",
      "data": {
        "condition": "{{agent_1.response}} contains 'escalate'"
      }
    },
    {
      "id": "agent_2",
      "type": "agent",
      "data": {
        "agentId": "supervisor-agent",
        "prompt": "Escalated issue: {{agent_1.response}}"
      }
    }
  ],
  "edges": [
    { "source": "trigger_1", "target": "agent_1" },
    { "source": "agent_1", "target": "condition_1" },
    { "source": "condition_1", "target": "agent_2" }
  ]
}
```

### Testing Conversational Flow

```bash
# Simulate conversation turns

# Turn 1: User asks question
curl -X POST http://localhost:3001/api/webhooks/wh_abc123... \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "message": "I need help with my account",
    "userId": "user-456"
  }'

# Turn 2: Follow-up question
curl -X POST http://localhost:3001/api/webhooks/wh_abc123... \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "message": "I forgot my password",
    "userId": "user-456",
    "previousResponse": "{{previous_agent_response}}"
  }'
```

---

## 🧪 Complete Test Scenarios

### Scenario 1: Order Processing Workflow

```bash
# 1. Create webhook workflow
# 2. Simulate order webhook
curl -X POST http://localhost:3001/api/webhooks/wh_order123 \
  -d '{
    "orderId": "ORD-789",
    "items": [
      { "product": "Widget", "quantity": 2 }
    ],
    "total": 49.99
  }'

# 3. Workflow processes:
#    - Validates order
#    - Checks inventory
#    - Sends confirmation email
#    - Updates database
```

### Scenario 2: Daily Report Generation

```bash
# 1. Create scheduled workflow (daily at 9 AM)
# 2. Workflow runs automatically
# 3. Generates report using agent
# 4. Sends email with results
```

### Scenario 3: Multi-Agent Customer Support

```bash
# 1. User sends message via webhook
# 2. Agent 1 (Classifier): Categorizes inquiry
# 3. Condition: Routes to appropriate agent
# 4. Agent 2 (Specialist): Handles specific issue
# 5. Agent 3 (QA): Validates response quality
# 6. Send response back to user
```

---

## 🛠️ Testing Tools

### 1. Postman Collection

Create a Postman collection with these requests:

```json
{
  "info": { "name": "Workflow Testing" },
  "item": [
    {
      "name": "Create Webhook",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/webhooks/create/{{workflowId}}"
      }
    },
    {
      "name": "Trigger Webhook",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/webhooks/{{webhookUrl}}",
        "body": {
          "mode": "raw",
          "raw": "{{webhookPayload}}"
        }
      }
    }
  ]
}
```

### 2. Test Script

```bash
#!/bin/bash
# test-workflow.sh

BASE_URL="http://localhost:3001"
TOKEN="your-jwt-token"
WORKFLOW_ID="your-workflow-id"

# Create webhook
WEBHOOK=$(curl -s -X POST "$BASE_URL/api/webhooks/create/$WORKFLOW_ID" \
  -H "Authorization: Bearer $TOKEN")

WEBHOOK_URL=$(echo $WEBHOOK | jq -r '.webhookUrl')

# Trigger webhook
curl -X POST "$BASE_URL/api/webhooks/$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "data": "Hello from test script"
  }'
```

### 3. Frontend Testing

```typescript
// In your frontend
const testWebhook = async () => {
  // Create webhook
  const webhook = await api.post(`/webhooks/create/${workflowId}`);
  
  // Trigger it
  const result = await api.post(`/webhooks/${webhook.webhookUrl}`, {
    event: 'test',
    data: { message: 'Test from UI' }
  });
  
  console.log('Execution ID:', result.executionId);
};
```

---

## 📊 Monitoring Workflow Executions

### Check Execution Status

```bash
# Get execution details
curl -X GET http://localhost:3001/api/workflows/executions/EXECUTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response shows:
{
  "id": "exec-123",
  "status": "completed",
  "startTime": "2024-01-01T12:00:00Z",
  "endTime": "2024-01-01T12:00:05Z",
  "steps": [
    {
      "nodeId": "trigger_1",
      "status": "completed",
      "output": { ... }
    },
    {
      "nodeId": "agent_1",
      "status": "completed",
      "output": {
        "response": "AI generated response",
        "usage": { "totalTokens": 150 }
      }
    }
  ]
}
```

### List Recent Executions

```bash
curl -X GET "http://localhost:3001/api/workflows/WORKFLOW_ID/executions?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 Quick Start Testing

### Test #1: Simple Webhook (5 minutes)

```bash
# 1. Create workflow via UI with webhook trigger
# 2. Add one agent node
# 3. Get webhook URL from API
# 4. Test with curl:

curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK_URL \
  -d '{"test": "Hello World"}'

# 5. Check execution in UI
```

### Test #2: Scheduled Workflow (2 minutes setup)

```bash
# 1. Create workflow via UI with schedule trigger
# 2. Set schedule to "* * * * *" (every minute)
# 3. Wait 1 minute
# 4. Check executions list
# 5. See automatic execution!
```

### Test #3: Multi-Step Conversation

```bash
# 1. Create workflow:
#    Trigger → Agent 1 → Condition → Agent 2
# 2. Trigger with webhook
# 3. Watch execution in debug panel
# 4. See agents communicate!
```

---

## 🐛 Debugging Tips

### Enable Detailed Logs

```typescript
// In backend, set log level
this.logger.log('Workflow execution started');
this.logger.debug('Node data:', node.data);
this.logger.error('Execution failed:', error);
```

### Check Execution Steps

Use the **debug panel** to see:
- ✅ Which nodes completed
- ⏳ Which nodes are running
- ❌ Which nodes failed
- 📊 Variable values at each step

### Common Issues

**Webhook not triggering:**
```bash
# Check webhook exists
curl http://localhost:3001/api/webhooks/WORKFLOW_ID \
  -H "Authorization: Bearer TOKEN"

# Check it's active
# Look for "isActive": true
```

**Schedule not running:**
```bash
# Verify cron syntax
# Use: https://crontab.guru/

# Check backend logs
# Look for: "Schedule service initialized"
```

---

## 📚 Next Steps

1. **Start Simple**: Test with webhooks first
2. **Add Complexity**: Multi-agent workflows
3. **Add Scheduling**: Automated tasks
4. **Production**: Add error handling, logging

---

## 🎉 Summary

You can test workflows with:

| Trigger Type | How to Test | Use Case |
|--------------|-------------|----------|
| **Manual** | Test Run button | Quick testing |
| **Webhook** | curl/Postman | External integrations |
| **Schedule** | Cron timing | Automated tasks |
| **Event** | Internal triggers | System reactions |

**Pro Tip**: Start with webhooks - they're the easiest to test and most flexible!

---

Need help setting up a specific test? Let me know! 🚀
