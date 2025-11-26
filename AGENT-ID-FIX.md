# 🎯 Fix: Invalid Agent ID Error

## 🐛 The Real Problem!

```
ERROR: invalid input syntax for type uuid: "agent-1"
```

### What This Means

Your workflow is configured with `agentId: "agent-1"`, but the database expects a **UUID** like:
```
abc-123-def-456-789-012...
```

**This is a data/configuration issue, not a code bug!**

---

## ✅ Solution: Create a Real Agent

### Step-by-Step Fix (5 minutes)

#### Step 1: Go to Agents Page

In your app sidebar:
1. Click **"Agents"**
2. You'll see list of agents (might be empty)

#### Step 2: Create New Agent

Click **"Create Agent"** button and fill in:

```
Name:          Test Agent
Description:   Agent for testing workflows
Model:         mistral          ← IMPORTANT: Use 'mistral', 'llama3', or 'codellama'
System Prompt: You are a helpful AI assistant.
Temperature:   0.7
```

#### Step 3: Save Agent

Click **Save**. The system will:
- Generate a UUID (e.g., `"a1b2c3d4-e5f6-7890-1234-567890abcdef"`)
- Save to database
- Return the agent with proper ID

#### Step 4: Update Your Workflow

1. Go back to your workflow
2. Click on the **Agent Node**
3. In the settings panel (right side):
   - **Select Agent:** Choose "Test Agent" from dropdown
   - **Prompt:** "Say hello in a creative way!"
4. **Save the workflow**

#### Step 5: Test Again

1. Click **"Test Workflow"**
2. Click **"Simple Test"**
3. Click **"Run Test"**
4. **Wait 10-15 seconds**
5. Should work! ✅

---

## 🔍 How to Check If Agent Exists

### Via Database (Technical)

```bash
# Check agents in database
psql -d objecta_labs -U postgres -c "SELECT id, name, model FROM agents;"
```

### Via UI (Non-Technical)

1. Go to **Agents** page
2. If empty → Create one!
3. If agents exist → Note the agent names
4. Use those agents in your workflow

---

## 🎯 Why This Happened

### Common Scenarios:

**Scenario 1: Testing Without Setup**
```
Created workflow → Added agent node → Used placeholder "agent-1" → Error!
```

**Solution:** Create real agent first

**Scenario 2: Imported/Copied Workflow**
```
Copied workflow from template → Agent IDs don't match → Error!
```

**Solution:** Update agent IDs to match your agents

**Scenario 3: Agent Was Deleted**
```
Had agent → Deleted it → Workflow still references old ID → Error!
```

**Solution:** Update workflow with new agent

---

## 📋 Proper Workflow Setup Order

### Correct Order:

1. ✅ **Create Agent** first
   - Get real UUID
   - Configure model, prompt, etc.

2. ✅ **Create Workflow** second
   - Add nodes
   - Connect them

3. ✅ **Configure Agent Node** third
   - Select agent from dropdown
   - Set prompt

4. ✅ **Save Workflow**

5. ✅ **Test**
   - Now it works!

---

## 🛠️ Quick Fix Commands

### Check Existing Agents

```bash
# Via database
psql -d objecta_labs -U postgres -c \
  "SELECT id, name, model, system_prompt FROM agents;"
```

### Create Agent via API (If UI Not Available)

```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Agent",
    "description": "Testing workflows",
    "model": "mistral",
    "systemPrompt": "You are a helpful assistant.",
    "temperature": 0.7
  }'

# Returns: { "id": "abc-123-...", "name": "Test Agent", ... }
# Use this ID in your workflow!
```

---

## ✅ Verification

### After Creating Agent and Updating Workflow:

**Test again:**
1. Hard refresh (Cmd+Shift+R)
2. Click "Test Workflow"
3. Watch console logs

**Should see:**
```
✅ Backend execution started: exec-123...
⏳ Execution status: running
⏳ Execution status: running
✅ Execution status: completed
✅ Workflow completed
```

**Should NOT see:**
```
❌ invalid input syntax for type uuid: "agent-1"
❌ Agent not found
```

---

## 💡 Pro Tip: Agent Dropdown

When you click on an agent node in the workflow editor, the settings panel should show:

```
┌─────────────────────────┐
│ Agent Node Settings     │
├─────────────────────────┤
│ Select Agent:           │
│ ┌─────────────────────┐ │
│ │ [Select...]        ▼│ │ ← Click this dropdown
│ └─────────────────────┘ │
│                         │
│ Available agents:       │
│ • Test Agent           │
│ • Support Bot          │
│ • Content Writer       │
└─────────────────────────┘
```

**Select an agent from the dropdown** rather than typing an ID manually!

---

## 🎯 Summary

**Error:** `invalid input syntax for type uuid: "agent-1"`

**Cause:** Workflow references "agent-1" but database expects UUID

**Fix:** 
1. Create real agent (gets UUID automatically)
2. Select agent in workflow node settings
3. Save workflow
4. Test again

**Expected result:** Works! ✅

---

## 📞 Next Steps

1. **Create your agent** (if you haven't)
2. **Update workflow** to use real agent
3. **Hard refresh** browser
4. **Test again**

Should work perfectly now! 🚀

---

**Did you create the agent yet? Or do you need help with that step?** Let me know! 😊