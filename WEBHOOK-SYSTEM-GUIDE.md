# Webhook System - Complete Guide

## 🎯 What is a Webhook?

A **webhook** is a way for external systems to automatically trigger your workflows. Instead of manually clicking "Run Workflow," an external service (like GitHub, Stripe, Shopify, etc.) can send an HTTP request to a special URL that starts your workflow automatically.

Think of it as a **doorbell for your workflow** - when someone rings it (sends a request), your workflow starts running.

---

## 🏗️ How Webhooks Work in Your System

### Architecture Overview

```
External Service (GitHub, Stripe, etc.)
         ↓
    HTTP POST Request
         ↓
Your Backend: POST /webhooks/{webhookUrl}
         ↓
  Webhook Service validates request
         ↓
  Workflow Executor starts workflow
         ↓
  Workflow runs with webhook data
         ↓
  Response sent back to external service
```

---

## 📋 Step-by-Step Workflow

### 1. Creating a Webhook

**Backend API Call:**
```http
POST /webhooks/create/{workflowId}
Authorization: Bearer {your-jwt-token}
```

**What Happens:**
1. System verifies the workflow exists
2. Generates a unique webhook URL (e.g., `wh_a1b2c3d4e5f6...`)
3. Generates a secret token for security
4. Stores webhook in database
5. Returns webhook details

**Response:**
```json
{
  "id": "webhook-uuid",
  "workflowId": "workflow-123",
  "webhookUrl": "wh_a1b2c3d4e5f6789012345678901234",
  "secretToken": "secret_xyz...",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 2. Using the Webhook

**External Service Sends Request:**
```http
POST /webhooks/wh_a1b2c3d4e5f6789012345678901234
Content-Type: application/json
X-Webhook-Signature: sha256_hash (optional, for security)

{
  "event": "order.created",
  "orderId": "12345",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "total": 99.99
}
```

**What Happens:**
1. Request hits public endpoint (no auth required)
2. System looks up webhook by URL
3. Validates webhook signature (if provided)
4. Triggers workflow execution
5. Passes payload to workflow as trigger data
6. Returns execution ID

**Response:**
```json
{
  "success": true,
  "executionId": "execution-456",
  "message": "Workflow triggered successfully"
}
```

### 3. Workflow Accesses Webhook Data

Inside your workflow nodes, you can access:

```javascript
// Available in workflow context
context.triggerData = {
  webhookUrl: "wh_a1b2c3d4e5f6789012345678901234",
  payload: {
    event: "order.created",
    orderId: "12345",
    customer: { ... },
    total: 99.99
  },
  headers: {
    "content-type": "application/json",
    "x-webhook-signature": "..."
  },
  receivedAt: "2024-01-01T12:00:00Z"
}
```

---

## 🔒 Security Features

### 1. Secret Token Verification

When a webhook is created, a secret token is generated. External services can use this to sign their requests.

**How it works:**
```
1. External service creates HMAC-SHA256 signature:
   signature = hmac_sha256(secretToken, payload)

2. External service sends signature in header:
   X-Webhook-Signature: {signature}

3. Backend verifies signature matches:
   expectedSignature = hmac_sha256(storedSecretToken, receivedPayload)
   if (signature === expectedSignature) → Valid! ✅
   else → Reject! ❌
```

**Example (Node.js):**
```javascript
const crypto = require('crypto');

function signWebhook(payload, secretToken) {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secretToken)
    .update(payloadString)
    .digest('hex');
  
  return signature;
}

// Sending webhook
const payload = { event: 'order.created', orderId: '12345' };
const signature = signWebhook(payload, 'secret_xyz...');

fetch('https://your-api.com/webhooks/wh_a1b2c3d4e5f6...', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: JSON.stringify(payload)
});
```

### 2. Active/Inactive Status

Webhooks can be deactivated without deleting them:
- `isActive: true` → Webhook accepts requests
- `isActive: false` → Webhook rejects requests (404 Not Found)

### 3. Organization Isolation

Each webhook is tied to an organization, ensuring data isolation.

---

## 🎨 Real-World Use Cases

### Use Case 1: E-commerce Order Processing

**Scenario:** Shopify sends webhook when order is created

```
Shopify → POST /webhooks/wh_shop123
Payload: { order_id, customer, items, total }
         ↓
Workflow Triggered:
  1. Trigger: Webhook received
  2. Action: Validate payment
  3. Action: Update inventory
  4. Action: Send confirmation email
  5. Action: Notify warehouse
```

### Use Case 2: GitHub CI/CD Pipeline

**Scenario:** GitHub sends webhook on push to main branch

```
GitHub → POST /webhooks/wh_git456
Payload: { repository, branch, commits }
         ↓
Workflow Triggered:
  1. Trigger: Webhook received
  2. Condition: Check if branch === "main"
  3. Action: Run tests
  4. Action: Deploy to production
  5. Action: Send Slack notification
```

### Use Case 3: Payment Processing

**Scenario:** Stripe sends webhook on successful payment

```
Stripe → POST /webhooks/wh_stripe789
Payload: { payment_intent, amount, customer }
         ↓
Workflow Triggered:
  1. Trigger: Webhook received
  2. Action: Update database
  3. Action: Send receipt email
  4. Action: Trigger fulfillment
  5. Action: Update analytics
```

---

## 🛠️ Implementation Guide

### Creating a Webhook-Triggered Workflow

#### Step 1: Create Workflow with Webhook Trigger

In the workflow editor:
1. Drag a **Trigger** node to canvas
2. Set type to **"Webhook"**
3. Configure trigger settings
4. Add action nodes
5. Save workflow

#### Step 2: Generate Webhook URL

**Via API:**
```bash
curl -X POST https://your-api.com/webhooks/create/workflow-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "webhookUrl": "wh_a1b2c3d4e5f6789012345678901234",
  "secretToken": "secret_xyz..."
}
```

#### Step 3: Configure External Service

Give the external service your webhook URL:
```
https://your-api.com/webhooks/wh_a1b2c3d4e5f6789012345678901234
```

**Examples:**

**GitHub Webhook:**
1. Go to Repository → Settings → Webhooks
2. Add webhook URL
3. Select events (push, pull request, etc.)
4. Add secret token (optional)
5. Save

**Stripe Webhook:**
1. Go to Developers → Webhooks
2. Add endpoint URL
3. Select events (payment_intent.succeeded, etc.)
4. Add signing secret
5. Save

**Shopify Webhook:**
1. Go to Settings → Notifications → Webhooks
2. Create webhook
3. Select event (Order creation, etc.)
4. Add URL
5. Save

---

## 📊 Database Schema

### WorkflowWebhook Entity

```typescript
@Entity('workflow_webhooks')
export class WorkflowWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @Column({ name: 'webhook_url', unique: true })
  webhookUrl: string; // e.g., "wh_a1b2c3d4..."

  @Column({ name: 'secret_token', nullable: true })
  secretToken?: string; // For signature verification

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Workflow)
  workflow: Workflow;
}
```

---

## 🧪 Testing Webhooks

### Method 1: Using cURL

```bash
# Simple test
curl -X POST https://your-api.com/webhooks/wh_a1b2c3d4... \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# With signature
SECRET="secret_xyz..."
PAYLOAD='{"test":"data"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

curl -X POST https://your-api.com/webhooks/wh_a1b2c3d4... \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Method 2: Using Postman

1. Create new POST request
2. URL: `https://your-api.com/webhooks/{webhookUrl}`
3. Headers:
   - `Content-Type: application/json`
   - `X-Webhook-Signature: {signature}` (optional)
4. Body (raw JSON):
   ```json
   {
     "test": "data",
     "event": "test.event"
   }
   ```
5. Send request

### Method 3: Using Webhook Testing Tools

**webhook.site:**
1. Go to https://webhook.site
2. Get unique URL
3. Configure your service to send to webhook.site
4. Inspect received webhooks
5. Forward to your actual webhook URL

**ngrok (for local testing):**
```bash
# Start your backend locally on port 3000
npm run start:dev

# In another terminal, start ngrok
ngrok http 3000

# Use ngrok URL for testing
# https://abc123.ngrok.io/webhooks/wh_a1b2c3d4...
```

---

## 📈 Monitoring & Debugging

### View Webhook Activity

**Get webhook details:**
```bash
curl https://your-api.com/webhooks/workflow-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check workflow executions:**
```bash
curl https://your-api.com/workflows/workflow-123/executions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Common Issues & Solutions

#### Issue 1: Webhook Returns 404
**Problem:** Webhook URL not found

**Solutions:**
- ✅ Verify webhook URL is correct
- ✅ Check if webhook is active (`isActive: true`)
- ✅ Ensure webhook wasn't deleted

#### Issue 2: Webhook Returns "Invalid signature"
**Problem:** Signature verification failed

**Solutions:**
- ✅ Verify secret token is correct
- ✅ Check signature algorithm (must be HMAC-SHA256)
- ✅ Ensure payload isn't modified before signing
- ✅ Check header name is `X-Webhook-Signature`

#### Issue 3: Workflow Doesn't Execute
**Problem:** Webhook receives request but workflow doesn't run

**Solutions:**
- ✅ Check workflow has webhook trigger node
- ✅ Verify workflow is published/active
- ✅ Check workflow executor logs
- ✅ Verify organization ID matches

#### Issue 4: Can't Access Webhook Data in Nodes
**Problem:** `context.triggerData` is undefined

**Solutions:**
- ✅ Access via `context.triggerData.payload`
- ✅ Check node executor is passing context correctly
- ✅ Verify workflow was triggered by webhook (not manual)

---

## 🔄 Webhook Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Lifecycle                        │
└─────────────────────────────────────────────────────────────┘

1. CREATE WEBHOOK
   POST /webhooks/create/{workflowId}
   → Generates URL & secret
   → Stores in database
   → Returns webhook details

2. CONFIGURE EXTERNAL SERVICE
   → Add webhook URL to service
   → Configure events to trigger
   → Add secret for signing (optional)

3. EXTERNAL SERVICE SENDS REQUEST
   POST /webhooks/{webhookUrl}
   → Service detects event
   → Sends HTTP POST with payload
   → Includes signature (optional)

4. BACKEND RECEIVES & VALIDATES
   → Looks up webhook by URL
   → Checks if active
   → Verifies signature (if present)
   → Returns 404 if invalid

5. TRIGGER WORKFLOW
   → Finds associated workflow
   → Starts execution
   → Passes payload to workflow
   → Returns execution ID

6. WORKFLOW EXECUTES
   → Trigger node activates
   → Action nodes process payload
   → Results stored in execution

7. RESPONSE SENT
   → Success/failure sent to external service
   → Service logs response
   → Service may retry on failure

8. DEACTIVATE/DELETE (when needed)
   DELETE /webhooks/{webhookId}
   → Webhook marked inactive or deleted
   → Future requests return 404
```

---

## 💡 Best Practices

### 1. Always Use Signature Verification
```javascript
// ✅ Good: Verify signatures
if (webhook.secretToken) {
  verifySignature(payload, signature, secretToken);
}

// ❌ Bad: Accept all requests without verification
```

### 2. Handle Retries Gracefully
External services often retry failed webhooks. Make your workflow idempotent:
```javascript
// Check if already processed
if (await isAlreadyProcessed(payload.orderId)) {
  return { success: true, message: 'Already processed' };
}

// Process
await processOrder(payload);

// Mark as processed
await markAsProcessed(payload.orderId);
```

### 3. Log Everything
```javascript
logger.log(`Webhook received: ${webhookUrl}`);
logger.log(`Payload: ${JSON.stringify(payload)}`);
logger.log(`Execution started: ${executionId}`);
```

### 4. Return Quickly
Don't make the external service wait:
```javascript
// ✅ Good: Start workflow asynchronously
async handleWebhook() {
  // Validate
  // Start execution (async)
  return { success: true, executionId };
  // Workflow continues in background
}

// ❌ Bad: Wait for entire workflow to finish
async handleWebhook() {
  await executeWorkflowAndWaitForCompletion();
  return { success: true };
}
```

### 5. Handle Errors Gracefully
```javascript
try {
  await executeWorkflow();
} catch (error) {
  logger.error(`Webhook execution failed: ${error.message}`);
  // Return error to external service for retry
  throw error;
}
```

---

## 📚 API Reference

### Create Webhook
```http
POST /webhooks/create/:workflowId
Authorization: Bearer {jwt}

Response:
{
  "id": "uuid",
  "workflowId": "string",
  "webhookUrl": "string",
  "secretToken": "string",
  "isActive": boolean,
  "createdAt": "timestamp"
}
```

### Get Webhook
```http
GET /webhooks/:workflowId
Authorization: Bearer {jwt}

Response:
{
  "id": "uuid",
  "workflowId": "string",
  "webhookUrl": "string",
  "isActive": boolean
}
```

### Delete Webhook
```http
DELETE /webhooks/:webhookId
Authorization: Bearer {jwt}

Response:
{
  "message": "Webhook deleted successfully"
}
```

### Trigger Webhook (Public)
```http
POST /webhooks/:webhookUrl
Content-Type: application/json
X-Webhook-Signature: {signature} (optional)

Body: any JSON payload

Response:
{
  "success": true,
  "executionId": "uuid",
  "message": "Workflow triggered successfully"
}
```

---

## ✅ Summary

### What Webhooks Do
- ✅ Automatically trigger workflows from external services
- ✅ No manual intervention needed
- ✅ Real-time event processing
- ✅ Secure with signature verification

### How to Use
1. Create webhook for workflow
2. Configure external service with webhook URL
3. External service sends events to URL
4. Workflow executes automatically
5. Workflow processes event data

### Key Benefits
- ⚡ Real-time automation
- 🔒 Secure with HMAC signatures
- 🔄 Automatic retry handling
- 📊 Full execution tracking
- 🎯 Event-driven architecture

---

*Your webhooks are ready to receive events and trigger workflows automatically!* 🚀
