# Node Display Name Fix

## 🐛 Issue
When selecting an AI agent or tool in the NodeEditor, the node continued to display "Select an agent" or "Select a tool" instead of showing the actual agent/tool name.

## 🔍 Root Cause

### The Problem
The NodeEditor was only saving the **ID** but not the **name**:
- When user selects agent → Only `agentId` was saved
- When user selects tool → Only `toolId` was saved

### Why It Failed
The ActionNode component looks for the **name** to display:
```typescript
// ActionNode looks for:
data.agentName  // Not found!
data.toolName   // Not found!

// But NodeEditor only saved:
data.agentId    // Only this was saved
data.toolId     // Only this was saved
```

Result: Node displays fallback text "Select an agent" instead of the actual name.

---

## ✅ Solution

### What Was Fixed
Updated NodeEditor to save **both ID and name** when user makes a selection.

### Agent Selection Fix

**Before:**
```typescript
onChange={(e) => handleFieldChange('agentId', e.target.value)}
```
Only saved the ID.

**After:**
```typescript
onChange={(e) => {
  const selectedAgentId = e.target.value;
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  
  // Save both agentId and agentName
  setEditedNode({
    ...editedNode,
    data: {
      ...editedNode.data,
      agentId: selectedAgentId,
      agentName: selectedAgent ? selectedAgent.name : '',
    },
  });
}}
```
Now saves both ID and name!

### Tool Selection Fix

**Before:**
```typescript
onChange={(e) => handleFieldChange('toolId', e.target.value)}
```
Only saved the ID.

**After:**
```typescript
onChange={(e) => {
  const selectedToolId = e.target.value;
  const toolNames: Record<string, string> = {
    'tool-1': 'Calculator',
    'tool-2': 'HTTP API',
  };
  
  // Save both toolId and toolName
  setEditedNode({
    ...editedNode,
    data: {
      ...editedNode.data,
      toolId: selectedToolId,
      toolName: toolNames[selectedToolId] || '',
    },
  });
}}
```
Now saves both ID and name!

---

## 🎯 Result

### Before Fix
```
┌──────────────────────────┐
│ 🤖 AI AGENT              │
│                          │
│ Select an agent          │ ← Wrong! Shows fallback
└──────────────────────────┘
```

### After Fix
```
┌──────────────────────────┐
│ 🤖 AI AGENT              │
│                          │
│ Customer Support Agent   │ ← Correct! Shows actual name
└──────────────────────────┘
```

---

## 📋 Data Structure

### Agent Node Data (After Fix)
```typescript
{
  actionType: 'agent',
  agentId: 'agent-123',           // ← ID for backend reference
  agentName: 'Support Bot',       // ← Name for display
  label: 'Custom Label',          // ← Optional custom label
  description: 'Handles support'  // ← Optional description
}
```

### Tool Node Data (After Fix)
```typescript
{
  actionType: 'tool',
  toolId: 'tool-1',          // ← ID for backend reference
  toolName: 'Calculator',    // ← Name for display
  label: 'Custom Label',     // ← Optional custom label
  description: 'Does math'   // ← Optional description
}
```

---

## 🔄 Display Logic Flow

### 1. User Selects Agent
```
User clicks dropdown → Selects "Customer Support Agent"
         ↓
NodeEditor onChange handler
         ↓
Finds agent object: { id: 'agent-123', name: 'Customer Support Agent' }
         ↓
Saves BOTH to node.data:
  - agentId: 'agent-123'
  - agentName: 'Customer Support Agent'
         ↓
Node re-renders with updated data
         ↓
ActionNode.getActionDetails() finds agentName
         ↓
Displays: "Customer Support Agent" ✅
```

### 2. User Selects Tool
```
User clicks dropdown → Selects "Calculator"
         ↓
NodeEditor onChange handler
         ↓
Looks up tool name from mapping
         ↓
Saves BOTH to node.data:
  - toolId: 'tool-1'
  - toolName: 'Calculator'
         ↓
Node re-renders with updated data
         ↓
ActionNode.getActionDetails() finds toolName
         ↓
Displays: "Calculator" ✅
```

---

## 🧪 Testing

### Test Scenario 1: Agent Selection
1. Create an Action node
2. Set action type to "Agent"
3. Click on the node to open NodeEditor
4. Select an agent from the dropdown
5. Click Save
6. **Expected:** Node displays the agent name (e.g., "Customer Support Agent")
7. **Result:** ✅ PASS

### Test Scenario 2: Tool Selection
1. Create an Action node
2. Set action type to "Tool"
3. Click on the node to open NodeEditor
4. Select a tool from the dropdown
5. Click Save
6. **Expected:** Node displays the tool name (e.g., "Calculator")
7. **Result:** ✅ PASS

### Test Scenario 3: Custom Label Override
1. Select an agent
2. Set a custom label (e.g., "My Support Bot")
3. Click Save
4. **Expected:** Node displays the custom label instead of agent name
5. **Result:** ✅ PASS (custom labels take precedence)

---

## 📁 Files Modified

**1 file changed:**
- ✅ `frontend/src/components/workflows/NodeEditor.tsx`
  - Updated agent selection handler (lines ~180-193)
  - Updated tool selection handler (lines ~220-235)

---

## 💡 Why This Approach?

### Alternative Approaches Considered

#### Option 1: Look up name on render ❌
```typescript
// In ActionNode component
const agentName = agents.find(a => a.id === data.agentId)?.name;
```
**Problems:**
- Requires loading all agents in every node
- Performance issue with many nodes
- Extra API calls
- Doesn't work when agent is deleted

#### Option 2: Store only ID, fetch name from API ❌
```typescript
// Fetch agent details when rendering
const agent = await api.get(`/agents/${data.agentId}`);
```
**Problems:**
- Async rendering complexity
- Multiple API calls on every render
- Loading states needed
- Poor performance

#### Option 3: Store both ID and name ✅ (Chosen)
```typescript
data: {
  agentId: 'agent-123',    // For backend operations
  agentName: 'Support Bot' // For display
}
```
**Benefits:**
- ✅ Fast rendering (no lookups needed)
- ✅ No extra API calls
- ✅ Works even if agent is deleted
- ✅ Simple and efficient
- ✅ Follows common UI pattern

---

## 🎯 Best Practices Applied

### 1. Denormalization for Display
Store both ID (for operations) and name (for display):
```typescript
{
  agentId: '123',           // Normalized reference
  agentName: 'Support Bot'  // Denormalized for display
}
```

### 2. Immediate Feedback
User sees the selection immediately without waiting for re-fetch.

### 3. Resilience
Display still works even if:
- Agent/tool is later deleted
- API is unavailable
- Network is slow

### 4. Performance
No extra lookups or API calls during rendering.

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Sync Agent Name on Load**
   - When workflow loads, refresh agent names from latest data
   - Detect if agent was renamed

2. **Show Stale Indicator**
   - If agent no longer exists, show "(deleted)" or similar

3. **Real-time Updates**
   - WebSocket to update names if changed elsewhere

4. **Batch Name Resolution**
   - On workflow load, resolve all IDs to names in one API call

---

## ✅ Summary

### Problem
Nodes showed "Select an agent" instead of actual agent names.

### Root Cause
NodeEditor only saved IDs, not names.

### Solution
Save both ID and name when user makes selection.

### Files Changed
1 file: `NodeEditor.tsx`

### Result
✅ Nodes now correctly display agent/tool names
✅ Immediate visual feedback
✅ No performance issues
✅ Resilient to data changes

---

*Fix complete - Your nodes now show the correct names!* 🎉
