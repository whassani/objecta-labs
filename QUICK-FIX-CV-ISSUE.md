# 🔧 Quick Fix: Agent Can't Find Information in CV

## ✅ FIXED: You can now edit agents!

I've just created the missing **Edit Agent** page. Here's how to fix your issue:

---

## Solution 1: Edit Agent (Recommended)

### Steps:

1. **Go to Agents**
   - Navigate to Dashboard → Agents

2. **Click "Edit" on your agent**
   - Click the pencil icon or "Edit" link
   - This should now work! (I just created the page)

3. **Enable RAG and Lower Threshold**
   - ☑ **Enable Knowledge Base (RAG)** (check this!)
   - **Max Results**: Set to 5 (increase from 3)
   - **Similarity Threshold**: Set to **0.5** (lower from 0.7)
   - Click **Save Changes**

4. **Try Again**
   - Go back to your conversation
   - Ask: "What is my name based on my CV?"
   - Should work now! ✅

---

## Solution 2: Quick Test Without Editing

### If edit still doesn't work, create a new agent:

1. **Create New Agent**
   - Go to Agents → New Agent
   - Name: "CV Assistant"
   - System Prompt: "You are a helpful assistant that answers questions about resumes and CVs. Always use the information from uploaded documents."
   - ☑ **Enable Knowledge Base (RAG)** ← IMPORTANT!
   - **Max Results**: 5
   - **Similarity Threshold**: 0.5 ← LOWER FOR TESTING
   - Create

2. **Start New Conversation**
   - Use the new agent
   - Ask: "What is my name according to my CV?"

---

## Why It Wasn't Working

**Most likely causes:**

### 1. RAG Not Enabled ❌
If the checkbox wasn't checked, the agent never searched your documents.

### 2. Threshold Too High ❌
Default 0.7 might be too strict for finding names. Try 0.5-0.6.

### 3. Query Phrasing ❌
"Who am I?" is vague. Try: "What is my name from my CV?"

---

## Testing The Fix

### Test 1: Check Document Status
```
1. Go to Knowledge Base → Documents
2. Find your CV
3. Status should be: ✅ Completed
4. Should show chunk count (e.g., "12 chunks")
```

### Test 2: Search Manually
```
1. Knowledge Base → Click "Search"
2. Search for your name: "John Doe"
3. Do results appear?
   - ✅ YES → Document is indexed, agent issue
   - ❌ NO → Indexing issue (see below)
```

### Test 3: Check Backend Logs
```bash
# While asking the agent, watch logs:
# Should see:
[ConversationsService] Searching knowledge base for: "what is my name"
[VectorStoreService] Found X similar chunks

# If you DON'T see these, RAG isn't enabled
```

---

## If Still Not Working

### Issue: Manual search finds nothing

**Solution: Re-index your CV**
```
1. Go to Knowledge Base → Documents
2. Click "Re-index All" button
3. Wait 10 seconds
4. Try searching again
```

### Issue: Search works but agent doesn't use it

**Check agent settings:**
```bash
# Via API (if you have token):
curl http://localhost:3001/api/agents/YOUR_AGENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Look for:
"useKnowledgeBase": true  ← Must be true!
```

### Issue: Can't edit agent (still)

**Workaround: Create new agent**
- Just create a new agent with correct settings
- Delete old one if needed

---

## Expected Behavior

### What SHOULD Happen:

```
You: "What is my name from my CV?"

Agent Backend:
1. ✓ Check: RAG enabled = true
2. ✓ Search knowledge base for: "What is my name from my CV"
3. ✓ Find chunks containing your name
4. ✓ Inject chunks into context
5. ✓ LLM responds with your name
6. ✓ Shows source: "Your CV - 89% match"

Agent Response:
"Based on your CV, your name is John Doe. You are a [profession]..."

📄 Sources Used (1)
   Your CV          89% match
```

---

## Quick Test Command

If you want to test via API:

```bash
# 1. Get your token (login first in browser, check dev tools)
TOKEN="your-token-here"

# 2. Get your document ID
curl http://localhost:3001/api/knowledge-base/documents \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, title}'

# 3. Search for your name
curl -X POST "http://localhost:3001/api/knowledge-base/search?threshold=0.5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"John Doe"}' | jq

# If this returns results, your document is indexed correctly
```

---

## Recommended Settings for CV Agent

```
Agent Configuration:
├─ Name: "CV Assistant"
├─ System Prompt: "You help answer questions about CVs and resumes. 
│                 Always cite which document you're referring to."
├─ Model: GPT-4 or Mistral
├─ ☑ Enable Knowledge Base (RAG)
├─ Max Results: 5 (more chunks for better context)
└─ Similarity Threshold: 0.5 (lower for better recall)
```

---

## Pro Tips for Finding Names

### Better Query Phrases:
✅ "What is my name according to my CV?"
✅ "Based on my resume, who am I?"
✅ "Tell me the person's name from the uploaded CV"
✅ "What are my contact details from my CV?"

### Avoid:
❌ "Who am I?" (too vague)
❌ "My name?" (too short)
❌ "Tell me about me" (ambiguous)

---

## Next Steps

1. ✅ Try editing the agent now (page exists!)
2. ✅ Enable RAG and lower threshold to 0.5
3. ✅ Save and try your question again
4. ✅ Should work now!

If it still doesn't work after these steps, let me know:
- What status is your document?
- Is RAG checkbox now checked?
- What happens when you search manually?

I'll help you debug further! 🔧
