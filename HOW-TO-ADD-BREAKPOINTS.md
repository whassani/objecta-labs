# 🔴 How to Add Breakpoints to Workflows

## Overview
Breakpoints allow you to pause workflow execution at specific nodes to inspect variables, debug issues, and understand data flow.

---

## 📍 Method 1: Click on Node in Execution Visualizer (Easiest)

### Steps:
1. **Start Workflow Execution**
   - Click the "▶️ Play" button to start your workflow
   - The ExecutionVisualizer appears at the bottom

2. **Click on Any Node**
   - In the node status grid, click on the node where you want to pause
   - This selects the node

3. **Toggle Breakpoint**
   - Click the 🐛 (Bug) icon in the toolbar
   - This opens the Breakpoints panel

4. **Add Breakpoint**
   - The selected node will have a breakpoint added
   - You'll see a **red dot** (🔴) on the node

5. **Run Again**
   - Stop current execution if needed
   - Click "▶️ Play" to start a new execution
   - Workflow will **pause automatically** when it reaches the breakpoint

### Visual Guide:
```
┌─────────────────────────────────────────────────┐
│ Status | ▶️ ⏸️ Stop Reset | 👣 🐛 👁️ 🕐 Logs  │
├─────────────────────────────────────────────────┤
│  [🔴 Node 1] [Node 2] [Node 3] [Node 4]       │ ← Click node
│     ↑                                           │
│  Red dot = Breakpoint set                       │
├─────────────────────────────────────────────────┤
│  🐛 Breakpoints (1)                  [Clear All]│
│  ┌──────────────────────────────────────────┐  │
│  │ 🔴 Node 1                     [Remove]   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 📍 Method 2: Using the Breakpoints Panel

### Steps:
1. **Open ExecutionVisualizer**
   - Start workflow execution

2. **Click Bug Icon (🐛)**
   - Opens the Breakpoints panel

3. **Select Nodes**
   - Click on nodes in the node grid
   - They will be highlighted

4. **Breakpoint Automatically Added**
   - Selected nodes now have breakpoints
   - Red dots appear on those nodes

5. **Manage Breakpoints**
   - **Remove individual**: Click "Remove" next to breakpoint
   - **Clear all**: Click "Clear All" button

---

## 📍 Method 3: Programmatic (For Testing)

### Using the Hook:
```typescript
const {
  toggleBreakpoint,
  clearAllBreakpoints,
} = useWorkflowExecution(nodes, edges);

// Add breakpoint
toggleBreakpoint('node_id_here', true);

// Remove breakpoint
toggleBreakpoint('node_id_here', false);

// Clear all breakpoints
clearAllBreakpoints();
```

---

## 🎯 Method 4: Conditional Breakpoints (Advanced)

Breakpoints can have conditions - they only pause when the condition is true.

### Steps:
1. **Add Regular Breakpoint** (Methods 1 or 2)

2. **Set Condition** (Currently programmatic):
```typescript
setBreakpointCondition('node_id', 'input.count > 10');
```

### Example Conditions:
```javascript
// Break when count exceeds threshold
'input.count > 100'

// Break on specific iteration
'iteration === 5'

// Break on error condition
'input.status === "error"'

// Break when data exists
'input.data !== null'
```

---

## 🎬 Execution Flow with Breakpoints

### Without Breakpoint:
```
[Trigger] → [Action 1] → [Action 2] → [Action 3] → Complete
  (runs continuously without stopping)
```

### With Breakpoint on Action 2:
```
[Trigger] → [Action 1] → [🔴 Action 2] ⏸️ PAUSED
                              ↑
                         Breakpoint hit!
                         
User clicks "Resume" →  [Action 3] → Complete
```

---

## 🔍 What Happens When Breakpoint Hits?

### 1. Execution Pauses
```
Status: Running → Paused
Current Node: Highlighted with blue ring
```

### 2. Controls Available
- **Resume**: Continue execution
- **Step**: Execute next node (if in step mode)
- **Stop**: Cancel execution
- **Inspect**: View variables

### 3. Variable Inspection
```
Click 👁️ (Eye) icon to see:
┌─────────────────────────────┐
│ Variables at Action 2       │
├─────────────────────────────┤
│ Input:  { count: 5 }        │
│ Output: { result: "..." }   │
│ Context: { iteration: 2 }   │
└─────────────────────────────┘
```

---

## 💡 Use Cases

### Use Case 1: Debug Failed Workflow
```
Problem: Workflow fails at unknown point

Solution:
1. Add breakpoints on all nodes
2. Run workflow
3. Inspect variables at each pause
4. Find where data becomes invalid
5. Fix the issue
```

### Use Case 2: Check Loop Iterations
```
Problem: Loop processes wrong number of items

Solution:
1. Add breakpoint on loop body node
2. Set condition: 'iteration === 3'
3. Run workflow
4. Pauses at iteration 3
5. Inspect variables to see what's happening
```

### Use Case 3: Understand Data Flow
```
Problem: Don't understand how data transforms

Solution:
1. Add breakpoints at key transformation nodes
2. Run workflow
3. Inspect input/output at each breakpoint
4. See how data changes step-by-step
```

### Use Case 4: Validate API Response
```
Problem: API returns unexpected data

Solution:
1. Add breakpoint after API call node
2. Run workflow
3. Inspect output data structure
4. Verify response matches expectations
```

---

## ⚙️ Breakpoint Settings

### Current State:
- ✅ Enable/disable per node
- ✅ Visual indicator (red dot)
- ✅ Automatic pause on hit
- ✅ Resume/step controls
- ✅ Variable inspection

### Conditional (Advanced):
```typescript
// Breakpoint only triggers when condition is true
breakpoint: {
  enabled: true,
  condition: 'input.value > 100'
}
```

---

## 🎨 Visual Indicators

### Node States:
```
No Breakpoint:  [Node 1]
With Breakpoint: [🔴 Node 1]
At Breakpoint:  [🔵 🔴 Node 1]  (blue ring + red dot)
```

### Panel View:
```
🐛 Breakpoints (2)                    [Clear All]
┌────────────────────────────────────────────────┐
│ 🔴 Action 1                         [Remove]   │
│ 🔴 Action 3                         [Remove]   │
│    Condition: input.count > 10                 │
└────────────────────────────────────────────────┘
```

---

## 🎯 Best Practices

### Do:
✅ Set breakpoints before complex logic
✅ Use conditional breakpoints in loops
✅ Remove breakpoints after debugging
✅ Combine with variable inspection
✅ Use step mode for detailed debugging

### Don't:
❌ Set too many breakpoints (slows debugging)
❌ Leave breakpoints in production workflows
❌ Set breakpoints on every node
❌ Forget to clear breakpoints after debugging

---

## 🔧 Troubleshooting

### Breakpoint Not Hit?
1. ✓ Check breakpoint is enabled (red dot visible)
2. ✓ Verify workflow reaches that node
3. ✓ Check condition (if conditional breakpoint)
4. ✓ Ensure workflow is running (not stopped)

### Can't Add Breakpoint?
1. ✓ Ensure workflow is started
2. ✓ Check ExecutionVisualizer is open
3. ✓ Verify node exists in workflow
4. ✓ Try clicking node again

### Breakpoint Doesn't Pause?
1. ✓ Check execution mode (not in backend mode)
2. ✓ Verify breakpoint enabled
3. ✓ Look for condition that's not met
4. ✓ Restart workflow execution

---

## 📊 Example Workflow with Breakpoints

```typescript
// Simple workflow with debugging
const workflow = {
  nodes: [
    { id: 'trigger_1', type: 'trigger', label: 'Start' },
    { id: 'action_1', type: 'action', label: 'Fetch Data' },
    { id: 'action_2', type: 'action', label: 'Process Data' }, // 🔴 Breakpoint
    { id: 'action_3', type: 'action', label: 'Save Result' },
  ]
};

// Execution flow:
// 1. trigger_1 executes
// 2. action_1 executes (fetches data)
// 3. action_2 ⏸️ PAUSES (breakpoint hit)
//    - User inspects variables
//    - Checks data structure
//    - Clicks Resume
// 4. action_3 executes
// 5. Complete
```

---

## 🚀 Quick Start Guide

### For First-Time Users:

1. **Create a workflow** with 3-4 nodes
2. **Click "▶️ Play"** to start execution
3. **Click any node** in the visualizer
4. **Click 🐛 icon** to add breakpoint
5. **Stop and restart** execution
6. **Workflow pauses** at breakpoint
7. **Click 👁️ icon** to inspect variables
8. **Click "Resume"** to continue

---

## 📚 Related Features

### Combine Breakpoints With:

**Step Mode (👣)**
- Execute one node at a time
- Useful with breakpoints for granular control

**Variable Inspection (👁️)**
- See data at breakpoint
- Understand what's happening

**Execution History (🕐)**
- Review past executions
- Compare with/without breakpoints

**Logs (📋)**
- See what happened before breakpoint
- Debug timeline of events

---

## 🎓 Learning Path

### Beginner:
1. Add simple breakpoints
2. Inspect variables
3. Resume execution

### Intermediate:
1. Use conditional breakpoints
2. Combine with step mode
3. Debug loops and conditions

### Advanced:
1. Set complex conditions
2. Debug multi-agent workflows
3. Analyze performance issues

---

## ✨ Summary

### Adding Breakpoints:
1. **Easiest**: Click node → Click 🐛 icon
2. **Programmatic**: Use `toggleBreakpoint()`
3. **Conditional**: Use `setBreakpointCondition()`

### When Breakpoint Hits:
- ⏸️ Execution pauses
- 🔵 Current node highlighted
- 👁️ Inspect variables
- ▶️ Resume or stop

### Use For:
- 🐛 Debugging failed workflows
- 🔍 Understanding data flow
- ✅ Validating logic
- 📊 Inspecting variables

**Happy Debugging!** 🎉
