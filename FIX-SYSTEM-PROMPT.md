# ✅ System Prompt Fix

## 🔍 Issue Found

From the debug logs:
```
Message 0: SystemMessage
Content: generaliste

### Relevant Information from Knowledge Base:
[Source 1: CV Walid Hassani (1).pdf]
...
```

**Problem:** The system prompt is just `"generaliste"` which is:
1. Too vague and unclear
2. Not in English
3. Doesn't give the AI proper instructions

This causes the AI to be confused and respond with nonsense.

---

## ✅ Fixes Applied

### Fix 1: Improved System Prompt Construction
Added better default and clearer RAG instructions:

```typescript
// Before
let systemPrompt = agent.systemPrompt;

// After
let systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';
```

### Fix 2: Better RAG Instructions
Added explicit instructions when using knowledge base:

```typescript
if (contextFromDocs) {
  systemPrompt +=
    `\n\n### Relevant Information from Knowledge Base:\n${contextFromDocs}\n\n` +
    `### Instructions:\n` +
    `- Use the information above to answer accurately.\n` +
    `- Reference sources when relevant.\n` +
    `- Use general knowledge if docs don't help.\n` +
    `- Be helpful, clear, and concise.`;
}
```

---

## 🎯 But You Still Need To...

### Update Your Agent's System Prompt

The agent has `"generaliste"` as the system prompt. You should update it to something better:

#### Option 1: General Assistant (English)
```
You are a helpful AI assistant. Answer questions clearly and professionally.
```

#### Option 2: CV/Resume Assistant (matches your use case)
```
You are a professional CV assistant. Help users understand and analyze resumes.
Answer questions based on the provided CV information. Be clear and professional.
```

#### Option 3: French General Assistant
```
Vous êtes un assistant IA utile. Répondez aux questions de manière claire et professionnelle.
```

### How to Update:
1. Go to `http://localhost:3000/dashboard/agents`
2. Click on your agent
3. Click "Edit"
4. Update "System Prompt" field
5. Save

---

## 🧪 Test After Fix

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

### 2. Update Agent System Prompt
Use one of the prompts above

### 3. Create New Conversation
With the updated agent

### 4. Test
```
Send: "Qui est Walid HASSANI?"
Expected: Proper response about Walid from the CV
```

---

## 📊 Expected Debug Output After Fix

```
=== DEBUG: Messages being sent to LLM ===
Number of messages: 2
Message 0:
  Type: SystemMessage
  Content: You are a helpful AI assistant.
  
  ### Relevant Information from Knowledge Base:
  [Source 1: CV...]
  
  ### Instructions:
  - Use the information above...
  
Message 1:
  Type: HumanMessage
  Content: Qui est Walid HASSANI?
=== END DEBUG ===
```

Much better! ✅

---

## ✅ Summary

1. **Code Fixed:** Backend now has better default and instructions ✅
2. **Agent Needs Update:** Change "generaliste" to proper prompt
3. **Restart:** Backend restart needed
4. **Test:** Should work after updating agent

The fix is in place - just update your agent's system prompt!
