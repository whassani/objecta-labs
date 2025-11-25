# ✅ Workflow Testing Checklist

## 🔍 Issue: "Test Run shows no response, just debug panel as before"

### Root Cause
The frontend was using **simulation mode** instead of **backend mode**, so it wasn't making real API calls to the backend with LLM integration.

### ✅ Fix Applied
Changed execution mode from `'normal'` (simulation) to `'backend'` (real API calls)

---

## 🧪 How to Test Your Workflow

### Prerequisites

1. **Backend Running**
   ```bash
   cd backend
   npm run start:dev
   # Should show: Nest application successfully started
   ```

2. **Ollama Running**
   ```bash
   ollama serve
   # In another terminal:
   ollama list  # Verify models are available
   ```

3. **Frontend Running**
   ```bash
   cd frontend
   npm run dev
   # Visit: http://localhost:3002 (or 3000)
   ```

---

## 📝 Step-by-Step Test

### Step 1: Create an Agent

1. Go to **Agents** in sidebar
2. Click **"Create Agent"**
3. Fill in:
   - **Name:** Test Agent
   - **Model:** mistral (or llama3, codellama)
   - **System Prompt:** "You are a helpful assistant."
   - **Temperature:** 0.7
4. Click **Save**
5. **Note the Agent ID** (you'll see it in the URL or response)

### Step 2: Create a Simple Workflow

1. Go to **Workflows** in sidebar
2. Click **"Create Workflow"**
3. Add nodes:
   - **Trigger Node** (should be there by default)
   - **Agent Node** (drag from palette)
4. Connect them: Trigger → Agent
5. Click on the **Agent Node**
6. In settings panel:
   - Select your agent (Test Agent)
   - Set prompt: "Say hello in a creative way!"
7. Click **Save**

### Step 3: Test the Workflow

#### Option A: Using Test Modal (Recommended for Non-Technical Users)

1. Click **"Test Workflow"** button (green, top right)
2. Click **"Simple Test"** to fill sample data
3. Click **"Run Test"**
4. Watch the debug panel appear!

**What You Should See:**
- ✅ Panel slides up from bottom
- ✅ "Executing..." status
- ✅ Trigger node turns blue (running) then green (complete)
- ✅ Agent node turns blue (running)
- ⏳ **Wait 5-10 seconds** (first request loads model into memory)
- ✅ Agent node turns green (complete)
- ✅ Status shows "Completed"
- ✅ You can click on nodes to see their output

#### Option B: Direct API Test (For Technical Users)

```bash
# Get your JWT token from browser localStorage
# Then test the API directly

curl -X POST http://localhost:3001/api/workflows/YOUR_WORKFLOW_ID/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "triggerData": {
      "test": true,
      "message": "Hello"
    }
  }'
```

---

## 🐛 Troubleshooting

### Issue: Panel appears but nothing happens

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Common issues:
   - 401 Unauthorized → Not logged in
   - 404 Not Found → Workflow ID wrong
   - 500 Server Error → Backend issue

**Fix:**
- Make sure you're logged in
- Check workflow was saved
- Verify backend is running

### Issue: Agent node stays blue (running) forever

**Possible Causes:**

1. **Ollama not running**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # If error, start it:
   ollama serve
   ```

2. **Model not downloaded**
   ```bash
   # Download model
   ollama pull mistral
   ```

3. **Wrong model name**
   - Make sure agent uses: `mistral`, `llama3`, or `codellama`
   - NOT: `llama2` (not installed)

4. **Backend not reaching Ollama**
   - Check backend logs for errors
   - Verify `OLLAMA_BASE_URL=http://127.0.0.1:11434` in .env

### Issue: "Cannot connect to Ollama" error

**Fix:**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://127.0.0.1:11434/api/tags

# Should return JSON with models list
```

### Issue: Panel shows but no debug info

**This means:**
- Frontend is in simulation mode
- Need to reload page after the fix

**Fix:**
```bash
# Hard refresh the page
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or clear cache and reload
```

---

## ✅ Success Indicators

### What Success Looks Like:

1. **Panel Appears** ✅
   - Beautiful draggable panel slides up
   - Shows "Executing..." at top

2. **Nodes Light Up** ✅
   - Trigger: Blue → Green (fast, <1s)
   - Agent: Blue (5-10s first time) → Green

3. **Real AI Response** ✅
   - Click on Agent node in panel
   - See "Variables" or click the node
   - Should show actual AI-generated text
   - NOT "LLM integration pending"

4. **Completion** ✅
   - Status changes to "Completed"
   - Shows duration (e.g., "8.5s")
   - All nodes green with checkmarks

### Example Success Output:

```json
{
  "agentName": "Test Agent",
  "response": "Greetings, friend! 🌟 Welcome to our wonderful corner of the digital universe...",
  "model": "mistral",
  "usage": {
    "promptTokens": 25,
    "completionTokens": 45,
    "totalTokens": 70
  }
}
```

---

## 🎯 Quick Debug Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if Ollama is running
curl http://127.0.0.1:11434/api/tags

# Check what models you have
ollama list

# View backend logs (if you started with npm run start:dev)
# Logs appear in the terminal

# Test Ollama directly
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "mistral",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

---

## 📊 Timing Expectations

### First Request (Cold Start)
- **5-15 seconds** - Ollama loads model into memory
- This is NORMAL and expected
- Shows as agent node staying blue

### Subsequent Requests (Warm)
- **1-3 seconds** - Much faster
- Model already in memory

### Total Workflow Time
- Simple (Trigger + Agent): 6-16 seconds first time
- Simple (Trigger + Agent): 2-4 seconds after warm-up

---

## 🔄 After Making Changes

If you modified workflow:
1. **Save** the workflow
2. **Reload** the page (Cmd+R / Ctrl+R)
3. **Test** again

If you updated backend code:
1. Backend auto-restarts (watch mode)
2. Wait for "Nest application successfully started"
3. **Test** again

---

## 💡 Pro Tips

### Tip 1: Watch Backend Logs

When testing, keep an eye on backend terminal:
```
[WorkflowExecutor] Starting execution of workflow abc-123
[AgentNodeExecutor] Executing agent: Test Agent
[LLMService] Executing chat with ollama provider (model: mistral)
[AgentNodeExecutor] Agent execution completed
[WorkflowExecutor] Workflow completed successfully
```

### Tip 2: Use Browser DevTools

Open Console (F12) and watch for:
- API calls to `/api/workflows/:id/execute`
- WebSocket connections
- Any red errors

### Tip 3: Test with Simple Prompts First

Start with easy prompts:
- ✅ "Say hello"
- ✅ "Count to 5"
- ✅ "What is 2+2?"

Then move to complex:
- "Write a detailed analysis of..."
- "Generate a report about..."

### Tip 4: Check Agent Configuration

Make sure your agent has:
- ✅ Valid model name (mistral, llama3, codellama)
- ✅ System prompt (can be simple)
- ✅ Temperature between 0 and 1
- ✅ Saved successfully

---

## 📞 Still Having Issues?

### Collect This Information:

1. **Browser Console Errors** (F12 → Console tab)
2. **Backend Logs** (from terminal)
3. **Workflow Configuration** (screenshot or JSON)
4. **Agent Configuration** (model name, prompt)
5. **What you see** (screenshot of debug panel)

### Common Solutions:

| Problem | Solution |
|---------|----------|
| Nothing happens | Check browser console for errors |
| 401 Unauthorized | Log in again |
| Agent stuck blue | Wait 15s (first request) or check Ollama |
| "Model not found" | Run `ollama pull mistral` |
| Panel not appearing | Hard refresh page (Cmd+Shift+R) |
| Simulation mode | Clear cache and reload |

---

## ✅ Final Checklist

Before reporting issues, verify:

- [ ] Backend is running (`npm run start:dev`)
- [ ] Ollama is running (`ollama serve`)
- [ ] Model is downloaded (`ollama list`)
- [ ] Agent is created and saved
- [ ] Workflow is created and saved
- [ ] Trigger and Agent nodes are connected
- [ ] Agent node has agent selected
- [ ] Logged in to frontend
- [ ] Page is refreshed after fix
- [ ] Waited 15+ seconds for first request

---

## 🎉 Success!

If you see real AI responses in the debug panel, **congratulations!** Your workflow automation system is now fully operational with real LLM integration.

**Next Steps:**
- Build more complex workflows
- Add conditions and loops
- Connect multiple agents
- Test different prompts
- Share with your team!

---

**Need help?** Check the other guides:
- `USER-FRIENDLY-TESTING-GUIDE.md` - Full testing guide
- `NON-TECHNICAL-USER-GUIDE.md` - For business users
- `WORKFLOW-TESTING-GUIDE.md` - For developers
