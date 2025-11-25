# 🧪 Testing AI Conversations

## Prerequisites

### Option 1: Using OpenAI (Recommended for Quality)

1. Get an API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key
   USE_OLLAMA=false
   ```

### Option 2: Using Ollama (Free, Local)

1. Install Ollama: https://ollama.ai
2. Download a model:
   ```bash
   ollama pull mistral
   ```
3. Update `backend/.env`:
   ```env
   USE_OLLAMA=true
   OLLAMA_BASE_URL=http://localhost:11434
   ```

---

## Test Steps

### 1. Restart Backend

```bash
cd backend
# Stop (Ctrl+C) and restart
npm run start:dev
```

### 2. Create an Agent

1. Go to http://localhost:3000/dashboard/agents
2. Click "Create Agent"
3. Fill in:
   - **Name**: "Helpful Assistant"
   - **Description**: "A friendly AI assistant"
   - **System Prompt**: 
     ```
     You are a helpful, friendly AI assistant. Answer questions clearly and concisely.
     Be polite and professional.
     ```
   - **Model**: 
     - For OpenAI: `gpt-4` or `gpt-3.5-turbo`
     - For Ollama: `mistral`
   - **Temperature**: `0.7` (balanced)
   - **Max Tokens**: `2000`
4. Click "Create Agent"

### 3. Start a Conversation

1. Go to http://localhost:3000/dashboard/conversations
2. Click "New Conversation"
3. Select your agent
4. Click "Create"

### 4. Chat with AI

**Test Message 1:**
```
Hello! Can you tell me a joke about programming?
```

**Expected:**
- AI responds with a programming joke
- Message appears in chat interface
- No errors in backend console

**Test Message 2:**
```
What did you just tell me?
```

**Expected:**
- AI remembers context (the joke)
- References previous message
- Shows conversation memory is working

**Test Message 3:**
```
Can you explain what TypeScript is in one sentence?
```

**Expected:**
- Clear, concise explanation
- Professional tone (from system prompt)
- Demonstrates AI following instructions

---

## What to Check

### ✅ Success Indicators

**Frontend:**
- Messages appear instantly after sending
- AI responses show up within a few seconds
- No error messages or toasts
- Chat interface scrolls to new messages
- Conversation title auto-generates from first message

**Backend Console:**
- No errors about API keys or models
- Logs show successful message processing
- No "AI generation error" messages

### ❌ Common Issues

**"AI generation error" in response:**
- Check backend console for specific error
- Verify OPENAI_API_KEY is set correctly
- Ensure API key has credits (for OpenAI)
- Check Ollama is running (for local)

**401 Unauthorized from OpenAI:**
- API key is invalid or expired
- Get new key from platform.openai.com

**Connection refused (Ollama):**
- Ollama is not running
- Start with: `ollama serve`
- Or install from ollama.ai

**"Agent not found" error:**
- Agent ID mismatch
- Recreate the conversation

---

## Advanced Tests

### Test Different Models

**GPT-4 (Most Capable, Slower):**
```env
Model: gpt-4
```

**GPT-3.5-Turbo (Fast, Cheaper):**
```env
Model: gpt-3.5-turbo
```

**Mistral (Local, Free):**
```env
Model: mistral
USE_OLLAMA=true
```

### Test Temperature Settings

**Creative (Temperature: 1.2):**
- More varied, creative responses
- Less predictable

**Balanced (Temperature: 0.7):**
- Good mix of creativity and consistency
- Recommended default

**Focused (Temperature: 0.2):**
- Deterministic, factual responses
- Best for technical questions

### Test Conversation Memory

Send a series of messages that require context:

1. "My name is John"
2. "What's my name?"
3. "Tell me a story about someone with my name"

AI should:
- Remember your name
- Reference it in responses
- Maintain context across messages

---

## Troubleshooting

### OpenAI Rate Limits

If you hit rate limits:
- Wait a few seconds between messages
- Or switch to Ollama for unlimited local usage

### Ollama Model Not Found

```bash
# List available models
ollama list

# Download model
ollama pull mistral

# Or try other models
ollama pull llama2
ollama pull codellama
```

### Backend Not Connecting to OpenAI

Check backend console for:
```
AI generation error: Request failed with status code 401
```

Solution: Update your API key in `.env` and restart backend

### Conversation Shows Old Placeholder Messages

If you see "AI response placeholder - will be implemented with LangChain":
- Old data from before implementation
- Create a new conversation
- Or delete old conversations

---

## Performance Benchmarks

### Response Times (Approximate)

| Model | Cold Start | Subsequent |
|-------|-----------|------------|
| gpt-4 | 3-5s | 2-4s |
| gpt-3.5-turbo | 1-2s | 1s |
| mistral (Ollama) | 2-3s | 1-2s |

### Token Usage (OpenAI)

- Input: ~10-100 tokens per message (with history)
- Output: ~50-500 tokens per response
- Cost: ~$0.002-0.02 per conversation turn (GPT-4)

---

## Next Steps After Testing

Once AI conversations work:

1. ✅ **Priority 1 Complete!** 🎉
2. Move to **Priority 2: Document Upload**
3. Implement PDF processing and chat about documents
4. See WHATS-NEXT.md for detailed guide

---

## Success Criteria

- [ ] Created an agent successfully
- [ ] Started a conversation
- [ ] Sent a message and got AI response
- [ ] AI response is relevant and coherent
- [ ] Conversation memory works (context retained)
- [ ] Auto-generated conversation title
- [ ] No errors in console
- [ ] Response time acceptable

**If all checked: Priority 1 is COMPLETE!** ✅

---

## Example Conversation

```
User: Hello! What can you help me with?

AI: Hello! I'm here to help you with a variety of tasks. I can:
- Answer questions on various topics
- Help with problem-solving
- Provide explanations and clarifications
- Assist with creative writing
- And much more!

What would you like help with today?

User: Can you write a haiku about coding?

AI: Of course! Here's a haiku about coding:

Code flows like water
Bugs hide in silent corners
Debug, fix, release

User: Nice! What did you just write about?

AI: I just wrote a haiku about coding! It captures three aspects of the programming experience:
- The fluid, creative process of writing code
- The challenge of finding and fixing bugs
- The satisfaction of completing and releasing software

Would you like me to write another one in a different style?
```

**This demonstrates:**
- ✅ AI following instructions (system prompt)
- ✅ Creative task execution
- ✅ Context retention (remembering previous response)
- ✅ Professional, helpful tone

---

Ready to test! 🚀
