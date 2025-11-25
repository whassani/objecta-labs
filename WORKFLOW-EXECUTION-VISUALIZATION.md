# Workflow Execution Visualization

## Summary
Implemented real-time visual execution tracking for workflows with control flow support. Shows live execution state, node status, edge animations, and detailed logs.

## Features

### 🎬 Visual Execution States

#### Node States:
1. **Pending** (Gray)
   - Node waiting to execute
   - Clock icon
   - Default state before execution

2. **Running** (Blue, Pulsing)
   - Node currently executing
   - Spinning loader icon
   - Blue pulsing animation around node
   - Shows execution time

3. **Completed** (Green)
   - Node finished successfully
   - Green checkmark icon
   - Slightly faded to show it's done
   - Displays total duration

4. **Failed** (Red, Shaking)
   - Node execution failed
   - Red X icon
   - Shake animation on failure
   - Shows error message

5. **Skipped** (Gray)
   - Node was not executed (e.g., other branch in condition)
   - Gray dot icon

#### Edge States:
1. **Normal** - Gray, static
2. **Active/Executing** - Blue, animated flowing dots
3. **Selected** - Red, thicker

### 📊 Execution Visualizer Panel

**Location:** Bottom overlay on workflow canvas

**Components:**

1. **Status Header**
   - Current execution status (Running/Paused/Completed/Failed)
   - Progress: X / Y nodes completed
   - Failed node count (if any)
   - Total execution duration

2. **Control Buttons**
   - **Start** - Begin workflow execution
   - **Pause** - Pause execution
   - **Resume** - Continue paused execution
   - **Stop** - Abort execution
   - **Reset** - Clear execution state

3. **Node Status Grid**
   - Grid of all nodes with status indicators
   - Shows node label and status icon
   - Displays execution duration per node
   - Color-coded by status

4. **Execution Logs** (Collapsible)
   - Timestamped log entries
   - Color-coded by level (info/warning/error)
   - Node-specific messages
   - Show/Hide toggle

### 🎮 Control Flow Handling

#### Delay Node:
```
Execution: Waits for configured duration
Visualization: Shows "Delaying for X seconds" in logs
Duration: Configurable (seconds/minutes/hours/days)
```

#### Loop Node:
```
Execution: Iterates specified number of times
Visualization: 
  - Shows "Loop iteration X of Y" in logs
  - Updates iteration count on node
  - Executes loop body on each iteration
Outputs: 
  - "Each" handle (right) - runs per iteration
  - "Done" handle (bottom) - runs after completion
```

#### Condition Node:
```
Execution: Evaluates condition and branches
Visualization: Shows "Condition evaluated to: true/false"
Outputs:
  - "true" handle - taken if condition is true
  - "false" handle - taken if condition is false
Demo: Random branching (50/50) for visualization
```

#### Merge Node:
```
Execution: Waits for all inputs (or first, based on mode)
Visualization: Shows when branches merge
Mode: 'all' (wait for all) or 'any' (first wins)
```

### 🎨 Visual Effects

**Animations:**

1. **Pulse Animation** (Running nodes)
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
}
```

2. **Flow Animation** (Active edges)
```css
@keyframes flow {
  0% { stroke-dasharray: 5, 5; stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 10; }
}
```

3. **Shake Animation** (Failed nodes)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

**Color Scheme:**
- Blue (#3b82f6): Running/Active
- Green (#10b981): Completed/Success
- Red (#ef4444): Failed/Error
- Yellow (#f59e0b): Warning/Paused
- Gray (#6b7280): Pending/Inactive

## Implementation

### Components Created

#### 1. ExecutionVisualizer.tsx
**Purpose:** Main UI panel for execution control and monitoring

**Props:**
```typescript
{
  nodes: Node[];
  edges: Edge[];
  execution?: ExecutionState;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onReset?: () => void;
}
```

**Features:**
- Status header with progress
- Control buttons (start/pause/resume/stop/reset)
- Node status grid with color coding
- Collapsible execution logs
- Responsive design

#### 2. useWorkflowExecution Hook
**Purpose:** Manages workflow execution state and logic

**Returns:**
```typescript
{
  execution: ExecutionState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}
```

**Features:**
- Sequential node execution
- Control flow handling (delay, loop, condition, merge)
- State management (pending → running → completed/failed)
- Edge activation tracking
- Execution logging
- Pause/resume support
- Graceful stopping

### Execution Flow

```
1. Click "Test Run" button
   ↓
2. useWorkflowExecution.start() called
   ↓
3. Find trigger nodes (entry points)
   ↓
4. Execute nodes sequentially:
   - Update node state to "running"
   - Simulate execution (sleep based on node type)
   - Handle control flow logic
   - Update state to "completed" or "failed"
   - Activate outgoing edges
   - Add log entries
   ↓
5. Continue to next nodes based on edges
   ↓
6. Repeat until all nodes executed or error occurs
   ↓
7. Set final status (completed/failed)
```

### Control Flow Examples

#### Delay Execution:
```
1. Delay node starts
2. Log: "Delaying for 5 seconds"
3. Wait 5 seconds (configurable)
4. Node completes
5. Continue to next node
```

#### Loop Execution:
```
1. Loop node starts
2. Log: "Starting loop (3 iterations)"
3. For each iteration:
   - Log: "Loop iteration 1 of 3"
   - Execute loop body (via "Each" output)
   - Wait 200ms between iterations
4. After all iterations:
   - Continue via "Done" output
```

#### Condition Branching:
```
1. Condition node starts
2. Evaluate condition (simulated: random)
3. Log: "Condition evaluated to: true"
4. Take appropriate branch:
   - If true: Follow "true" output
   - If false: Follow "false" output
5. Skip nodes on other branch
```

## Usage

### Basic Execution:
1. Create a workflow with nodes and connections
2. Click **"Test Run"** button in header
3. Watch execution visualizer appear at bottom
4. See nodes light up as they execute
5. View progress and logs in real-time

### Pause/Resume:
1. During execution, click **"Pause"**
2. Execution pauses after current node completes
3. Click **"Resume"** to continue
4. Nodes resume from where they left off

### Stop Execution:
1. Click **"Stop"** during execution
2. Current node completes
3. Execution halts
4. Status shows as "Failed" (stopped by user)

### Reset After Execution:
1. After completion/failure, click **"Reset"**
2. All node states cleared
3. Visualizer panel disappears
4. Ready to execute again

### View Logs:
1. Click **"Show Logs"** in visualizer
2. See timestamped execution events
3. Filter by node ID
4. Color-coded by severity (info/warning/error)

## Testing

### Test Basic Execution:
1. Create workflow: Trigger → Action → Action
2. Click "Test Run"
3. ✅ Visualizer appears at bottom
4. ✅ Nodes execute sequentially
5. ✅ Each node shows running → completed
6. ✅ Total execution time displayed

### Test Delay Node:
1. Add: Trigger → Delay (5 seconds) → Action
2. Click "Test Run"
3. ✅ Delay node shows "Wait 5 seconds"
4. ✅ Execution pauses for 5 seconds
5. ✅ Log shows "Delaying for 5 seconds"
6. ✅ Continues after delay

### Test Loop Node:
1. Add: Trigger → Loop (3 times) → Action
2. Connect Loop "Each" output to Action
3. Connect Loop "Done" output to next node
4. Click "Test Run"
5. ✅ Loop shows 3 iterations in logs
6. ✅ Action executes 3 times
7. ✅ Continues after loop completes

### Test Condition Node:
1. Add: Trigger → Condition → Two different paths
2. Click "Test Run"
3. ✅ One branch executes, other skipped
4. ✅ Log shows which branch was taken
5. ✅ Only executed branch shows as "completed"
6. ✅ Skipped branch shows as "skipped"

### Test Pause/Resume:
1. Create long workflow (5+ nodes)
2. Click "Test Run"
3. After 2 nodes, click "Pause"
4. ✅ Execution pauses
5. ✅ Status shows "Paused"
6. Click "Resume"
7. ✅ Execution continues
8. ✅ All nodes complete

### Test Stop:
1. Create workflow
2. Click "Test Run"
3. During execution, click "Stop"
4. ✅ Execution halts immediately
5. ✅ Status shows "Failed"
6. ✅ Log shows "stopped by user"

## Files Created

- `frontend/src/components/workflows/ExecutionVisualizer.tsx` - UI component
- `frontend/src/hooks/useWorkflowExecution.ts` - Execution logic hook

## Files Modified

- `frontend/src/components/workflows/WorkflowCanvas.tsx` - Added execution state styling
- `frontend/src/app/(dashboard)/dashboard/workflows/[id]/edit/page.tsx` - Integrated visualizer

## Future Enhancements

- [ ] Real backend integration (API calls instead of simulation)
- [ ] Breakpoints (pause at specific nodes)
- [ ] Step-by-step execution
- [ ] Variable inspection during execution
- [ ] Execution history/replay
- [ ] Export execution logs
- [ ] Real-time collaboration (multiple users watching)
- [ ] Performance metrics per node
- [ ] Parallel execution visualization
- [ ] Custom execution speed (slow motion)
- [ ] Node output preview
- [ ] Error recovery/retry options

## Performance Notes

- Execution is simulated with setTimeout for visualization
- Default node execution times:
  - Triggers: 500ms
  - Actions: 1500ms
  - Conditions: 300ms
  - Delays: Configurable
  - Loops: 500ms per iteration
- Real backend execution would be async/await based
- Animations use CSS for performance
- State updates are batched for efficiency
