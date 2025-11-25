# Workflow Execution Advanced Features - User Guide

## Overview

The workflow execution system now includes professional debugging and monitoring capabilities:

- 🔴 **Breakpoints** - Pause execution at specific nodes
- 👣 **Step-by-Step Mode** - Execute one node at a time
- 🔌 **Backend Integration** - Real-time execution streaming
- 🔍 **Variable Inspection** - View data at each step
- 📜 **Execution History** - Replay past executions

## Quick Start

### 1. Basic Execution

1. Open a workflow in the editor
2. Click the **Play** button to start execution
3. Watch nodes light up as they execute
4. View progress in the execution visualizer at the bottom

### 2. Using Breakpoints

**Set a Breakpoint:**
1. Click on a node in the node status grid
2. Click the **Bug icon** (🐛) to show breakpoints panel
3. Red dot appears on nodes with breakpoints

**Execution Behavior:**
- Workflow pauses when it reaches a breakpoint
- Click **Resume** to continue
- Click **Stop** to halt execution

**Clear Breakpoints:**
- Click "Clear All" in the breakpoints panel
- Or toggle individual breakpoints off

### 3. Step-by-Step Debugging

**Enable Step Mode:**
1. Click the **Step icon** (👣) in the toolbar
2. Icon turns blue when active

**Execute Step-by-Step:**
1. Start execution (Play button)
2. Execution pauses before each node
3. Click **Step** button to execute next node
4. Repeat until workflow completes

**Best For:**
- Understanding complex workflow logic
- Debugging problematic nodes
- Learning how workflows behave

### 4. Variable Inspection

**View Variables:**
1. Click the **Eye icon** (👁️) to show variables panel
2. Panel appears with purple theme
3. Shows data for currently executing/selected node

**What You See:**
- **Input**: Data passed into the node
- **Output**: Results produced by the node
- **Context**: Runtime variables and state

**Tips:**
- Works best with step-by-step mode
- Also available at breakpoints
- JSON formatted for easy reading

### 5. Execution History

**View History:**
1. Run a workflow to completion
2. Click the **History icon** (🕐)
3. Panel shows list of past executions

**Replay Execution:**
1. Click any history entry
2. View the exact state from that run
3. Inspect nodes, variables, and logs
4. Compare different executions

**History Details:**
- Timestamp of execution
- Success/failure status
- Duration
- Full execution state

## UI Components

### Execution Visualizer Layout

```
┌──────────────────────────────────────────────────────────┐
│  Status   |  ▶️ Pause Stop Reset  |  👣 🐛 👁️ 🕐 Logs   │
├──────────────────────────────────────────────────────────┤
│  Node Grid - Shows all nodes with status indicators      │
│  🔴 = Breakpoint   🔵 = Current   ✅ = Complete           │
├──────────────────────────────────────────────────────────┤
│  🐛 Breakpoints Panel (Red theme)                        │
│     - List of active breakpoints                         │
│     - Conditions                                          │
│     - Remove buttons                                      │
├──────────────────────────────────────────────────────────┤
│  👁️ Variables Panel (Purple theme)                       │
│     - Input data                                          │
│     - Output data                                         │
│     - Context variables                                   │
├──────────────────────────────────────────────────────────┤
│  🕐 History Panel (Indigo theme)                          │
│     - List of past executions                            │
│     - Click to replay                                     │
│     - Status and duration                                 │
├──────────────────────────────────────────────────────────┤
│  📋 Logs Panel (Gray theme)                               │
│     - Execution logs                                      │
│     - Timestamps                                          │
│     - Info/Warning/Error levels                          │
└──────────────────────────────────────────────────────────┘
```

### Node Status Colors

- **Gray** - Pending (not yet executed)
- **Blue** - Running (currently executing)
- **Green** - Completed (success)
- **Red** - Failed (error occurred)
- **Yellow** - Skipped (conditional branch not taken)

### Indicators

- **Red Dot** 🔴 - Breakpoint set
- **Blue Ring** 🔵 - Current executing node
- **Duration** - Execution time shown for completed nodes

## Common Workflows

### Debugging a Failed Workflow

1. **Enable step mode** to see each node
2. **Watch variables** to understand data flow
3. **Check logs** for error messages
4. **Set breakpoints** before problem node
5. **Inspect input/output** at each step

### Performance Analysis

1. Run workflow normally
2. Check **duration** on each node
3. Identify slow nodes
4. Use **history** to compare runs
5. Optimize bottleneck nodes

### Learning Complex Logic

1. Enable **step mode**
2. Show **variables panel**
3. Execute node by node
4. Watch how data transforms
5. Understand branching logic

### Testing Changes

1. Run workflow once
2. Save to **history**
3. Make changes
4. Run again
5. Compare results in history

## Keyboard Shortcuts (Future Enhancement)

- `Space` - Play/Pause
- `S` - Step (when in step mode)
- `R` - Reset
- `B` - Toggle breakpoints panel
- `V` - Toggle variables panel
- `H` - Toggle history panel
- `L` - Toggle logs panel

## Tips & Best Practices

### Effective Breakpoints

- Set breakpoints **before** complex logic
- Use breakpoints on **condition nodes** to see branches
- Set breakpoints on **loop nodes** to check iterations
- Clear breakpoints when done debugging

### Step-by-Step Efficiency

- Use step mode for **first-time debugging**
- Combine with **variables panel** for full visibility
- Use **normal mode** once workflow is stable
- Step mode is slower - use sparingly in production

### Variable Inspection

- Variables captured automatically
- Data persists until next run
- JSON format allows copy/paste
- Useful for debugging API responses

### History Management

- Last 50 executions kept
- History cleared on browser refresh
- Click to replay any execution
- Compare before/after changes

## Backend Mode (Advanced)

When backend is configured:

1. **Real-time updates** via WebSocket
2. **Distributed execution** on server
3. **Production-ready** monitoring
4. **Scalable** for complex workflows

**Enable Backend Mode:**
```typescript
// In workflow editor
setExecutionMode('backend');
```

**Requirements:**
- Backend server running
- WebSocket enabled
- Proper CORS configuration

## Troubleshooting

### Execution Doesn't Start

- Check for trigger nodes
- Verify workflow is saved
- Check browser console for errors

### Breakpoint Not Hitting

- Verify breakpoint is enabled (red dot visible)
- Check if node is actually executed
- Verify conditional hasn't skipped node

### Variables Not Showing

- Click on executed node
- Enable variables panel
- Run in step mode for live capture

### History Not Saving

- Complete execution (don't stop mid-run)
- Check browser memory/storage
- History limited to 50 entries

### WebSocket Connection Failed

- Verify backend is running
- Check NEXT_PUBLIC_WS_URL env var
- Check CORS configuration
- Fallback to simulation mode works

## Advanced Features

### Conditional Breakpoints (Coming Soon)

Set conditions on breakpoints:
```javascript
// Break when variable exceeds threshold
variables.count > 100

// Break on specific data
input.status === 'error'
```

### Watch Variables (Coming Soon)

Monitor specific variables:
- Add to watch list
- Alert on changes
- Track across execution

### Performance Profiling (Coming Soon)

Detailed metrics:
- CPU time per node
- Memory usage
- Network calls
- Bottleneck detection

## Integration with Other Features

### Works With:

- ✅ All node types (trigger, action, condition, control)
- ✅ Loop nodes (shows iterations)
- ✅ Conditional branching
- ✅ Merge nodes
- ✅ Delay nodes
- ✅ Agent nodes
- ✅ Tool nodes

### Complements:

- Workflow templates
- Version control
- Scheduled executions
- Webhook triggers
- Analytics dashboard

## Conclusion

The advanced execution features provide professional-grade debugging capabilities:

- **Find bugs faster** with step-by-step execution
- **Understand data flow** with variable inspection
- **Analyze performance** with execution history
- **Debug efficiently** with breakpoints
- **Monitor real-time** with backend integration

These tools make workflow development and maintenance significantly easier and more productive.
