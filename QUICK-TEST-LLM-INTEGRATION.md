# 🚀 Quick Test: LLM Integration

## 5-Minute Test Guide

### Prerequisites
- Ollama installed: https://ollama.ai
- Node.js installed

### Step 1: Start Ollama

```bash
# Start Ollama server
ollama serve

# In another terminal, pull a model
ollama pull mistral
```

### Step 2: Quick API Test

```bash
cd backend
node test-llm-integration.js
```

**Expected Output:**
```
✅ Ollama is running!
✅ LLM chat successful!
📝 Response: Hello there! How can I assist you today?
```

### Step 3: Start Backend

```bash
cd backend

# Copy env file if not done already
cp .env.example .env

# Install dependencies (if needed)
npm install

# Start in dev mode
npm run start:dev
```

### Step 4: Test in Application

**Via API (using curl):**

```bash
# 1. Create an agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Assistant",
    "description": "Testing LLM integration",
    "model": "mistral",
    "systemPrompt": "You are a helpful assistant.",
    "temperature": 0.7,
    "organizationId": "your-org-id"
  }'

# 2. Create a workflow with agent node
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LLM Test Workflow",
    "nodes": [
      {
        "id": "trigger_1",
        "type": "trigger",
        "data": { "triggerType": "manual" }
      },
      {
        "id": "agent_1",
        "type": "agent",
        "data": {
          "agentId": "AGENT_ID_FROM_STEP_1",
          "prompt": "Say hello in a creative way!"
        }
      }
    ],
    "edges": [
      { "source": "trigger_1", "target": "agent_1" }
    ],
    "organizationId": "your-org-id"
  }'

# 3. Execute the workflow
curl -X POST http://localhost:3001/api/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{ "organizationId": "your-org-id" }'
```

**Via Frontend:**

1. Navigate to http://localhost:3000
2. Go to Agents → Create New Agent
   - Name: "Test Assistant"
   - Model: "mistral"
   - System Prompt: "You are helpful."
3. Go to Workflows → Create New Workflow
4. Add Trigger node
5. Add Agent node (select "Test Assistant")
6. Connect nodes
7. Click **Play ▶️**
8. See real AI response! ✨

## ✅ Success Indicators

### What to Look For:

1. **No "LLM integration pending" message** ❌
2. **Real AI-generated text** ✅
3. **Token counts in response** ✅
4. **Execution completes successfully** ✅

### Example Success Response:

```json
{
  "success": true,
  "data": {
    "agentName": "Test Assistant",
    "response": "Greetings! I hope this message finds you well...",
    "usage": {
      "promptTokens": 25,
      "completionTokens": 45,
      "totalTokens": 70
    },
    "finishReason": "stop"
  }
}
```

## 🐛 Troubleshooting

### "Cannot connect to Ollama"
```bash
# Start Ollama
ollama serve
```

### "Model not found"
```bash
# Pull the model
ollama pull mistral
```

### "Agent not found"
- Make sure you created the agent first
- Use the correct `agentId` in the workflow node

### Backend won't start
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

## 📊 Performance Notes

### First Request (Cold Start)
- **Time:** 5-10 seconds
- **Reason:** Ollama loads model into memory
- **Normal:** Yes, this is expected

### Subsequent Requests
- **Time:** 1-3 seconds
- **Fast:** Model already in memory

### Token Usage
- **Simple prompt:** ~50 tokens
- **Complex task:** ~200-500 tokens
- **Cost (Ollama):** FREE ✅
- **Cost (OpenAI):** Check pricing

## 🎯 What Changed?

### Before:
```json
{
  "response": "Agent received prompt: X. [Note: LLM integration pending]"
}
```

### After:
```json
{
  "response": "Based on your request, here's a thoughtful response..."
}
```

## 🚀 Next Steps

Once LLM integration is verified:

1. ✅ **Merge to main** - Feature is complete
2. 🧪 **Update integration tests** - Fix test compatibility
3. 🎨 **Test complex workflows** - Multi-agent scenarios
4. 📊 **Monitor performance** - Track token usage
5. 🔧 **Add more providers** - Anthropic, Google, etc.

## 📞 Quick Commands Reference

```bash
# Start Ollama
ollama serve

# List models
ollama list

# Pull new model
ollama pull llama3

# Test LLM integration
cd backend && node test-llm-integration.js

# Start backend
cd backend && npm run start:dev

# Check logs
cd backend && tail -f logs/app.log
```

---

**Ready?** Start with Step 1 and you'll have LLM integration running in 5 minutes! 🚀
