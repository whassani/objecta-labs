# Node Replacement Issue & Solution

## 🐛 Issue Reported

**Problem:** When replacing a node in a workflow (A→B→C), after deleting B and adding a new B, the execution only goes A→C, skipping the new B node.

**Why This Happens:**
When you delete node B:
1. Node B is removed
2. All edges connected to B are automatically deleted (A→B and B→C)
3. Only nodes A and C remain
4. Edge A→C doesn't exist, so execution stops at A

## 🔍 Root Cause

The workflow system correctly removes edges when a node is deleted to prevent "dangling" connections to non-existent nodes. This is standard behavior in flow editors.

However, when you add a new node in place of B, the edges need to be manually reconnected.

## ✅ Current Workaround

### Manual Reconnection
After replacing a node, manually reconnect the edges:

1. **Delete the old node B**
   - Node B and its edges are removed
   - You now have: A    C (disconnected)

2. **Add the new node B**
   - Drag new node from palette
   - You now have: A    B    C (all disconnected)

3. **Reconnect the edges**
   - Click and drag from A's output handle to B's input handle
   - Click and drag from B's output handle to C's input handle
   - Now you have: A → B → C ✅

### Visual Guide

```
BEFORE:
┌───┐    ┌───┐    ┌───┐
│ A │───▶│ B │───▶│ C │
└───┘    └───┘    └───┘

DELETE NODE B:
┌───┐              ┌───┐
│ A │              │ C │
└───┘              └───┘
(All connections to B are removed)

ADD NEW NODE B:
┌───┐    ┌───┐    ┌───┐
│ A │    │ B │    │ C │
└───┘    └───┘    └───┘
(New B is not connected)

RECONNECT MANUALLY:
┌───┐    ┌───┐    ┌───┐
│ A │───▶│ B │───▶│ C │
└───┘    └───┘    └───┘
(Edges manually recreated)
```

## 🛠️ Better Approach: Modify Instead of Replace

Instead of deleting and replacing nodes, **modify the existing node**:

### Steps:
1. **Click on node B** to select it
2. **NodeEditor opens** on the right side
3. **Change the action type** or settings
4. **Click Save**
5. **Connections are preserved!** ✅

### Example: Changing Agent Node

**Scenario:** You have an Agent node using "Support Agent" but want to use "Sales Agent"

**Don't do this:**
- ❌ Delete the Agent node
- ❌ Add a new Agent node
- ❌ Reconnect all edges
- ❌ Reconfigure settings

**Do this instead:**
- ✅ Click on the existing Agent node
- ✅ In NodeEditor, select different agent
- ✅ Click Save
- ✅ Done! Connections preserved

## 💡 Quick Tips

### 1. Use Node Editor for Configuration Changes
- Changing agent/tool selection
- Updating HTTP URLs
- Modifying email recipients
- Changing conditions
- Adjusting delay times

### 2. When to Actually Replace
Only delete and replace when:
- Changing node **type** (e.g., Agent → Tool → HTTP)
- Complete node redesign needed

### 3. Check Edge Connections
After any node changes, visually verify:
- All arrows point to the right nodes
- No disconnected nodes (unless intentional)
- No missing connections

## 🔮 Future Enhancement Ideas

### Feature Request: "Replace Node" Function
A dedicated replace function that could:
1. Remember incoming edges (from A to B)
2. Remember outgoing edges (from B to C)
3. Delete old node B
4. Add new node B'
5. Automatically reconnect edges (A → B' → C)

### Implementation Notes
```typescript
// Pseudocode for future implementation
function replaceNode(oldNodeId, newNodeType) {
  // 1. Find all edges connected to old node
  const incomingEdges = edges.filter(e => e.target === oldNodeId);
  const outgoingEdges = edges.filter(e => e.source === oldNodeId);
  
  // 2. Create new node at same position
  const oldNode = nodes.find(n => n.id === oldNodeId);
  const newNode = createNode(newNodeType, oldNode.position);
  
  // 3. Recreate edges with new node
  const newIncoming = incomingEdges.map(e => ({
    ...e,
    target: newNode.id
  }));
  const newOutgoing = outgoingEdges.map(e => ({
    ...e,
    source: newNode.id
  }));
  
  // 4. Update workflow
  removeNode(oldNodeId);
  addNode(newNode);
  addEdges([...newIncoming, ...newOutgoing]);
}
```

## 📋 Debugging Steps

If execution skips a node:

### 1. Check Visual Connections
- Look at the canvas
- Verify arrows connect properly
- Edge should be visible A → B → C

### 2. Check Edge Data
- Open browser DevTools
- Console: Check edges array
- Verify source and target IDs match node IDs

### 3. Run Test Execution
- Click "Run Workflow"
- Watch ExecutionVisualizer
- See which nodes light up (running/completed)
- If a node doesn't light up, it's not connected

### 4. Fix Missing Connections
- Manually drag connections from output to input handles
- Save workflow
- Test again

## ✅ Quick Fix Checklist

When you notice execution skipping a node:

- [ ] Check if the node has incoming edge (arrow pointing TO it)
- [ ] Check if the node has outgoing edge (arrow pointing FROM it)
- [ ] Verify edge arrows are connected to handles (not just close to them)
- [ ] Save the workflow after reconnecting
- [ ] Run test execution to verify
- [ ] Check ExecutionVisualizer to confirm all nodes execute

## 🎯 Summary

**Problem:** Edges are lost when deleting and replacing nodes

**Why:** System correctly removes edges to prevent dangling connections

**Quick Fix:** Manually reconnect edges after adding new node

**Better Approach:** Use NodeEditor to modify existing nodes instead of replacing them

**Future:** Add "Replace Node" feature to preserve connections automatically

---

*For immediate solution: Use NodeEditor to modify existing nodes rather than deleting and replacing them!*
