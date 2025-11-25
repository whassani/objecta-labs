# 🐛 Debugging "Failed" Execution

## 🔧 Fixes Applied

Three critical fixes were made to enable backend execution:

### Fix 1: Execution Mode (Commit `9b82b65`)
**Problem:** Frontend was using simulation mode  
**Solution:** Changed default from `'normal'` to `'backend'`  
**Impact:** Now makes real API calls instead of simulating

### Fix 2: API Payload Format (Commit `486e7a4`)
**Problem:** Sending `{ mode: 'async' }` but backend expects `{ triggerData, context }`  
**Solution:** Changed to correct DTO format  
**Impact:** Backend can now process the request

### Fix 3: Response Field Name (Commit `288bc71`)
**Problem:** Looking for `response.data.executionId` but backend returns `response.data.id`  
**Solution:** Changed to `response.data.id`  
**Impact:** Frontend can now track execution properly

---

## 🧪 How to Test

### Step 1: Refresh Browser
**IMPORTANT:** Must hard refresh to get new code!

- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`
- **Or:** Clear cache and reload

### Step 2: Open Developer Tools
Press `F12` (or `Cmd + Option + I` on Mac)

**Open these tabs:**
1. **Console** - Watch for logs and errors
2. **Network** - Watch for API calls

### Step 3: Test Workflow

1. Click **"Test Workflow"** button
2. Click **"Simple Test"** (or enter your own data)
3. Click **"Run Test"**

### Step 4: Watch What Happens

**In Console Tab:**
```
✅ Should see: "Backend execution started: abc-123-..."
✅ Should see: "Connected to execution stream"
❌ Red errors? → Copy and share them!
```

**In Network Tab:**
```
✅ POST /api/workflows/:id/execute → Status 200 or 201
❌ Status 401? → Not logged in
❌ Status 404? → Workflow not found
❌ Status 500? → Backend error (check backend logs)
```

**In Debug Panel:**
```
✅ Panel appears with "Executing..." or "Running"
✅ Nodes turn blue then green
✅ Shows "Completed" when done
❌ Shows "Failed"? → Check console/network errors
❌ Nothing appears? → Hard refresh again
```

---

## 🔍 Debugging Checklist

### If Debug Panel Doesn't Appear

- [ ] Hard refreshed browser (Cmd+Shift+R)?
- [ ] Logged in to application?
- [ ] Workflow is saved?
- [ ] Using correct workflow page?

### If Shows "Failed" Status

Check **Browser Console** for errors:

```javascript
// Look for these error patterns:
❌ "401 Unauthorized" → Re-login
❌ "404 Not Found" → Check workflow ID
❌ "500 Server Error" → Backend issue (see below)
❌ "Network Error" → Backend not running
```

Check **Browser Network Tab:**

1. Find the POST request to `/api/workflows/:id/execute`
2. Click on it
3. Check **Response** tab
4. Look for error message

### If Backend Execution Starts But Fails

**Backend Logs to Check:**

```bash
cd backend
# Look in terminal where backend is running

# Should see:
✅ [WorkflowExecutor] Starting execution of workflow...
✅ [AgentNodeExecutor] Executing agent: ...
✅ [LLMService] Executing chat with ollama...

# Error patterns:
❌ Cannot connect to Ollama → Start ollama: `ollama serve`
❌ Model 'xyz' not found → Pull model: `ollama pull mistral`
❌ Agent not found → Check agent exists and ID is correct
❌ Cannot find module → Backend needs restart
```

### If Agent Node Takes Forever

**First Request (10-20 seconds is NORMAL):**
- Ollama loads model into memory
- This is expected behavior
- Wait patiently!

**If > 30 seconds:**
```bash
# Check Ollama is responding
curl http://127.0.0.1:11434/api/tags

# If that works, test chat directly:
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "mistral",
  "messages": [{"role": "user", "content": "hi"}],
  "stream": false
}'

# Should return response in 5-10 seconds
```

---

## 📊 Expected API Flow

### Successful Flow:

```
1. Frontend: POST /api/workflows/:id/execute
   Body: { triggerData: {}, context: {} }
   
2. Backend: Creates execution record
   Returns: { id: "exec-123", status: "running", ... }
   
3. Frontend: Saves execution ID
   Connects WebSocket for updates
   
4. Backend: Executes workflow nodes
   - Trigger node: ~200ms
   - Agent node: 5-15 seconds (first time)
   
5. Backend: Updates execution status
   WebSocket sends: node-start, node-complete events
   
6. Frontend: Updates debug panel in real-time
   Shows nodes turning blue → green
   
7. Backend: Completes execution
   Status: "completed"
   
8. Frontend: Shows "Completed" in panel
   Displays final results
```

### What You Should See:

**Browser Console:**
```javascript
// Good logs:
Backend execution started: abc-123-def-456
Connected to execution stream
```

**Backend Logs:**
```
[WorkflowExecutor] Starting execution of workflow abc-123
[AgentNodeExecutor] Executing agent: Test Agent
[LLMService] Executing chat with ollama provider (model: mistral)
[OllamaProvider] Chat request to http://127.0.0.1:11434/api/chat
[LLMService] Chat completed successfully (attempt 1)
[AgentNodeExecutor] Agent execution completed
[WorkflowExecutor] Workflow completed successfully
```

---

## 🆘 Common Issues & Solutions

### Issue: "Network Error" or "Failed to fetch"

**Cause:** Backend not running or wrong URL

**Fix:**
```bash
cd backend
npm run start:dev

# Should see: "Nest application successfully started on port 3001"
```

### Issue: "401 Unauthorized"

**Cause:** Not logged in or token expired

**Fix:**
1. Log out
2. Log in again
3. Try test again

### Issue: "Cannot find agent"

**Cause:** Agent ID mismatch

**Fix:**
1. Open agent node settings
2. Verify agent is selected
3. Save workflow
4. Try again

### Issue: "Cannot connect to Ollama"

**Cause:** Ollama not running

**Fix:**
```bash
# Start Ollama
ollama serve

# Verify models
ollama list

# Pull model if needed
ollama pull mistral
```

### Issue: WebSocket connection failed

**Cause:** WebSocket not fully implemented yet

**Note:** This is expected! The workflow still executes, you just won't see real-time updates. You can:
1. Refresh the page after ~15 seconds
2. Check execution list to see results
3. Or wait for WebSocket implementation

---

## 🎯 Quick Verification Commands

```bash
# 1. Check backend is running
curl http://localhost:3001/

# 2. Check Ollama is running
curl http://127.0.0.1:11434/api/tags

# 3. Check models available
ollama list

# 4. Test Ollama chat directly
curl http://127.0.0.1:11434/api/chat -d '{
  "model": "mistral",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": false
}'

# 5. Check backend logs
# (Look in terminal where you ran npm run start:dev)
```

---

## 📞 What to Share If Still Failing

Please provide:

1. **Browser Console Errors**
   - F12 → Console tab
   - Screenshot or copy all red errors

2. **Network Request Details**
   - F12 → Network tab
   - Find POST /api/workflows/:id/execute
   - Screenshot Response tab

3. **Backend Logs**
   - Copy last 50 lines from terminal where backend runs

4. **Your Setup**
   - Backend running? (yes/no)
   - Ollama running? (yes/no)
   - Models available? (`ollama list` output)
   - Agent configured with which model?

5. **What Debug Panel Shows**
   - Screenshot of the panel
   - Does it appear at all?
   - What status does it show?

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows "Backend execution started: ..."
2. ✅ Console shows "Connected to execution stream" (or error about websocket - that's OK)
3. ✅ Debug panel appears
4. ✅ Trigger node turns green quickly
5. ✅ Agent node turns blue (processing)
6. ✅ After 10-15 seconds, agent node turns green
7. ✅ Status changes to "Completed"
8. ✅ Click on agent node shows real AI response
9. ✅ Response is NOT "[Note: LLM integration pending]"

---

## 🔄 After Each Fix

Always:
1. Hard refresh browser (Cmd+Shift+R)
2. Check DevTools console for errors
3. Test with simple workflow first
4. Wait full 15 seconds before assuming failure

---

**Still stuck?** Share the information listed in "What to Share If Still Failing" section above.
