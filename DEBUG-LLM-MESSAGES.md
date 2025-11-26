# 🔍 Debug LLM Messages

## Added Debug Logging

I've added detailed logging to see exactly what's being sent to the LLM.

---

## How to Use

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

### 2. Send a Message
Go to any conversation and send: "Hello"

### 3. Check Backend Logs
Look for this output in the backend terminal:

```
=== DEBUG: Messages being sent to LLM ===
Number of messages: X
Message 0:
  Type: SystemMessage
  Content (first 200 chars): You are a helpful assistant...
Message 1:
  Type: HumanMessage
  Content (first 200 chars): Hello
...
=== END DEBUG ===
```

---

## What to Look For

### ✅ Good Format:
```
Message 0:
  Type: SystemMessage
  Content: You are a helpful assistant.
Message 1:
  Type: HumanMessage
  Content: Hello
```

### ❌ Bad Format:
```
Message 1:
  Type: HumanMessage
  Content: [object Object]
```

OR

```
Message 1:
  Type: HumanMessage
  Content: Array with 10 items
  First item: {"role":"user","content":"..."}
```

---

## Next Steps

1. **Restart backend** with the new logging
2. **Send a test message**
3. **Copy the DEBUG output** and share it
4. I'll fix the exact issue based on what we see

---

The debug logs will show us exactly what's wrong!
