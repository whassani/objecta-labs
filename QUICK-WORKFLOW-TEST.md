# ⚡ Quick Workflow Testing - 5 Minute Guide

## 🚀 Test a Webhook Right Now!

### Step 1: Create Webhook (1 min)

```bash
# Replace YOUR_JWT_TOKEN and WORKFLOW_ID
curl -X POST http://localhost:3001/api/webhooks/create/WORKFLOW_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**You'll get:**
```json
{
  "webhookUrl": "wh_abc123def456...",
  "secretToken": "secret_xyz..."
}
```

### Step 2: Test It (30 seconds)

```bash
# Replace wh_abc123... with your webhookUrl
curl -X POST http://localhost:3001/api/webhooks/wh_abc123... \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from webhook!",
    "userId": "test-123"
  }'
```

**You'll get:**
```json
{
  "success": true,
  "executionId": "exec-789",
  "message": "Workflow triggered successfully"
}
```

### Step 3: Check Execution (30 seconds)

```bash
# Check the execution status
curl http://localhost:3001/api/workflows/executions/exec-789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Done!** 🎉 You just triggered a workflow via webhook!

---

## 🎯 Common Test Scenarios

### Test #1: Simple Data Processing

```bash
# Send order data
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "orderId": "ORD-001",
    "amount": 99.99,
    "customer": "john@example.com"
  }'

# Workflow processes → Agent analyzes → Response sent
```

### Test #2: Multi-Step Conversation

```bash
# First message
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "conversationId": "conv-123",
    "message": "What is your return policy?"
  }'

# Follow-up
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "conversationId": "conv-123",
    "message": "How long does it take?"
  }'
```

### Test #3: Event Processing

```bash
# Simulate user signup event
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "event": "user.signup",
    "data": {
      "email": "newuser@example.com",
      "name": "John Doe"
    }
  }'
```

---

## 🛠️ Testing Tools

### Option 1: curl (Command Line)

Already shown above ☝️ - Fastest for testing!

### Option 2: Postman

1. Create new request
2. Method: POST
3. URL: `http://localhost:3001/api/webhooks/YOUR_WEBHOOK`
4. Body → raw → JSON
5. Add your test payload
6. Click Send!

### Option 3: JavaScript/TypeScript

```typescript
const testWebhook = async () => {
  const response = await fetch('http://localhost:3001/api/webhooks/wh_abc...', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      test: true,
      data: 'Hello World'
    })
  });
  
  const result = await response.json();
  console.log('Execution ID:', result.executionId);
};
```

### Option 4: Python

```python
import requests

response = requests.post(
    'http://localhost:3001/api/webhooks/wh_abc...',
    json={
        'event': 'test',
        'data': {'message': 'Hello from Python'}
    }
)

print(response.json())
```

---

## 🎪 Test Workflow Examples

### Example 1: Email Notification

**Workflow:**
```
Webhook → Agent (Generate Email) → HTTP (Send via API)
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "recipient": "user@example.com",
    "subject": "Order Confirmation",
    "orderId": "ORD-123"
  }'
```

### Example 2: Data Validation

**Workflow:**
```
Webhook → Condition (Check Data) → Agent (Process Valid) / Agent (Handle Invalid)
```

**Test Valid:**
```bash
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{ "email": "valid@email.com", "age": 25 }'
```

**Test Invalid:**
```bash
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{ "email": "invalid", "age": -5 }'
```

### Example 3: Multi-Agent Pipeline

**Workflow:**
```
Webhook → Agent1 (Classify) → Agent2 (Process) → Agent3 (Summarize)
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/webhooks/YOUR_WEBHOOK \
  -d '{
    "text": "Customer inquiry about refund policy",
    "priority": "high"
  }'
```

---

## 📊 Monitor Your Tests

### Via UI

1. Open workflow in UI
2. Click "Executions" tab
3. See list of all runs
4. Click any execution to see details

### Via API

```bash
# List recent executions
curl "http://localhost:3001/api/workflows/WORKFLOW_ID/executions?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get specific execution
curl http://localhost:3001/api/workflows/executions/EXEC_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Via Logs

```bash
# Watch backend logs
cd backend && npm run start:dev

# You'll see:
# [WebhookService] Webhook received: wh_abc123...
# [WorkflowExecutor] Executing workflow: workflow-id
# [AgentNodeExecutor] Agent execution completed
```

---

## 🐛 Quick Debugging

### Issue: Webhook not found

```bash
# Check if webhook exists
curl http://localhost:3001/api/webhooks/WORKFLOW_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create it if missing
curl -X POST http://localhost:3001/api/webhooks/create/WORKFLOW_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Issue: Execution failed

```bash
# Get execution details
curl http://localhost:3001/api/workflows/executions/EXEC_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check for error in response:
{
  "status": "failed",
  "error": "Agent not found" // <-- The problem!
}
```

### Issue: Agent not responding

**Checklist:**
- ✅ Is Ollama running? (`ollama serve`)
- ✅ Is model downloaded? (`ollama pull mistral`)
- ✅ Is agent created in system?
- ✅ Is agent ID correct in workflow?

---

## 💡 Pro Tips

### Tip 1: Test with Simple Payloads First

```bash
# Start simple
curl -X POST http://localhost:3001/api/webhooks/wh_abc... \
  -d '{"test": true}'

# Then add complexity
curl -X POST http://localhost:3001/api/webhooks/wh_abc... \
  -d '{
    "event": "order.created",
    "data": { "orderId": "123", "items": [...] }
  }'
```

### Tip 2: Use Variables in Workflows

```javascript
// In agent prompt:
"Process this order: {{trigger.payload.orderId}}"

// Access nested data:
"Customer email: {{trigger.payload.data.customer.email}}"
```

### Tip 3: Save Webhook URLs

```bash
# Save to file for reuse
echo "wh_abc123def456..." > webhook-url.txt

# Use in tests
WEBHOOK=$(cat webhook-url.txt)
curl -X POST http://localhost:3001/api/webhooks/$WEBHOOK -d '{...}'
```

### Tip 4: Batch Testing

```bash
#!/bin/bash
# test-batch.sh

WEBHOOK="wh_abc123..."

for i in {1..5}; do
  echo "Test $i"
  curl -X POST http://localhost:3001/api/webhooks/$WEBHOOK \
    -d "{\"testNumber\": $i, \"message\": \"Test $i\"}"
  sleep 1
done
```

---

## 🎯 Next Steps

1. **✅ Test your first webhook** (use commands above)
2. **📊 Check execution in UI** (see results)
3. **🔄 Test with different payloads** (experiment)
4. **🚀 Build real workflows** (production use)

---

## 📚 Full Documentation

For detailed testing guide, see: `WORKFLOW-TESTING-GUIDE.md`

For webhook security, signatures, and advanced features, check the full guide!

---

## 🆘 Need Help?

**Common URLs:**
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:3002`
- Webhook endpoint: `http://localhost:3001/api/webhooks/YOUR_WEBHOOK_URL`

**Quick Commands:**
```bash
# Start backend
cd backend && npm run start:dev

# Start frontend  
cd frontend && npm run dev

# Start Ollama (for AI)
ollama serve

# Pull model
ollama pull mistral
```

---

**Ready to test?** Copy the commands above and start testing your workflows! 🚀
