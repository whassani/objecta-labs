# 🔍 Debug Chat Response Issue

## 🐛 Problem
Every response in chat says: "It appears you've provided a list of JavaScript objects..."

This suggests the AI is receiving the wrong context or the system prompt is malformed.

---

## 🔎 Possible Causes

### 1. Agent System Prompt Issue
The agent might have a bad system prompt that's causing this behavior.

**Check:**
```sql
-- Check your agent's system prompt
SELECT id, name, system_prompt FROM agents WHERE id = 'YOUR_AGENT_ID';
```

### 2. Message History Format
The conversation history might be formatted incorrectly.

### 3. RAG Context Issue
If RAG is enabled, the document context might be malformed.

---

## 🔧 Quick Fixes

### Fix 1: Reset Agent System Prompt

Go to your agent settings and set a proper system prompt:

```
You are a helpful AI assistant. Answer questions clearly and concisely.
Be friendly and professional. If you don't know something, say so.
```

### Fix 2: Disable RAG Temporarily

If the agent has "Use Knowledge Base" enabled:
1. Go to Agent settings
2. Disable "Use Knowledge Base"
3. Test the chat
4. If it works, the issue is with RAG context

### Fix 3: Check Agent Configuration

1. Go to `/dashboard/agents`
2. Find your agent
3. Click Edit
4. Check these settings:
   - System Prompt: Should be clear instructions
   - Model: Should be valid (gpt-4, mistral, etc.)
   - Temperature: 0.7 is good default
   - Use Knowledge Base: Try disabling first

---

## 🧪 Test Steps

### Step 1: Create Fresh Agent
```
1. Go to Agents page
2. Create new agent
3. Name: "Test Agent"
4. System Prompt: "You are a helpful assistant."
5. Model: gpt-4 or mistral
6. Disable RAG
7. Save
```

### Step 2: Create Fresh Conversation
```
1. Go to Conversations
2. Create new conversation
3. Select "Test Agent"
4. Send simple message: "Hello"
5. Check response
```

### Expected: "Hello! How can I help you today?"
### If Still Wrong: Check environment variables

---

## 🔍 Debug Logging

### Enable Debug Logging

Add this to check what's being sent to LLM:

In `conversations-stream.service.ts` around line 163:

```typescript
// Before streaming
console.log('=== DEBUG: Messages being sent to LLM ===');
console.log('System Prompt:', systemPrompt);
console.log('Message History:', messages.map(m => ({
  type: m.constructor.name,
  content: typeof m.content === 'string' ? m.content.substring(0, 100) : 'complex'
})));
console.log('=== END DEBUG ===');
```

Then check backend logs when sending a message.

---

## 🎯 Most Likely Issues

### Issue #1: Bad System Prompt (90% chance)
The agent has a system prompt that's causing this behavior.

**Solution:** Edit agent, set a simple clear system prompt.

### Issue #2: Message Format (5% chance)
The message history contains malformed data.

**Solution:** Start fresh conversation with new agent.

### Issue #3: LLM Provider Issue (5% chance)
The LLM provider (Ollama/OpenAI) is not configured correctly.

**Solution:** Check environment variables:
```env
USE_OLLAMA=true  # or false for OpenAI
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
```

---

## 🚀 Quick Resolution Steps

### Do This Now:

1. **Go to Agents page**
   ```
   http://localhost:3000/dashboard/agents
   ```

2. **Edit your agent**
   - Click on the agent you're using
   - Click Edit

3. **Update System Prompt to:**
   ```
   You are a helpful AI assistant. Answer questions clearly and concisely.
   ```

4. **Disable RAG** (for now)
   - Uncheck "Use Knowledge Base"

5. **Save agent**

6. **Create new conversation with this agent**

7. **Test with simple message:**
   ```
   "Hello, how are you?"
   ```

8. **Expected response:**
   ```
   "Hello! I'm doing well, thank you for asking. How can I assist you today?"
   ```

---

## 🔧 Backend Check

### Verify LLM is Working

```bash
# If using Ollama
curl http://localhost:11434/api/tags

# Should show available models
```

### Check Environment
```bash
cd backend
cat .env | grep -E "OLLAMA|OPENAI|USE_"
```

Should see:
```
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 📝 Common Mistakes

### ❌ Bad System Prompt Examples:
```
"[object Object]"
"undefined"
"${agent.name}"
```

### ✅ Good System Prompt Examples:
```
"You are a helpful assistant."
"You are a coding expert who helps with programming questions."
"You are a friendly chatbot that answers questions about our products."
```

---

## 🎯 Resolution

Most likely you need to:

1. ✅ **Edit your agent**
2. ✅ **Set proper system prompt**
3. ✅ **Disable RAG temporarily**
4. ✅ **Test with new conversation**

This should fix the issue immediately!

---

**Try this and let me know if it fixes the problem!**
