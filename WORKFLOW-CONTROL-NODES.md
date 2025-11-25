# Workflow Control Nodes Implementation

## Summary
Implemented three missing control node types: Delay, Loop, and Merge. These nodes were in the palette but weren't rendering correctly.

## New Node Components

### 1. Delay Node
**File:** `frontend/src/components/workflows/nodes/DelayNode.tsx`

**Purpose:** Pauses workflow execution for a specified duration

**Visual Design:**
- Color: Amber (matching control nodes)
- Icon: Timer
- Handles: 1 input (top), 1 output (bottom)

**Data Properties:**
- `duration` (number): How long to wait (default: 5)
- `unit` (string): Time unit - 'seconds', 'minutes', 'hours', 'days'
- `label` (string): Custom label or auto-generated "Wait X seconds"

**Example Configuration:**
```typescript
{
  type: 'control-delay',
  data: {
    duration: 30,
    unit: 'seconds',
    label: 'Wait 30 seconds'
  }
}
```

**Use Cases:**
- Rate limiting API calls
- Waiting for external systems to process
- Implementing timeouts
- Creating scheduled delays

---

### 2. Loop Node
**File:** `frontend/src/components/workflows/nodes/LoopNode.tsx`

**Purpose:** Iterates over a collection or repeats actions a specific number of times

**Visual Design:**
- Color: Amber (matching control nodes)
- Icon: Repeat
- Handles: 
  - 1 input (top)
  - 1 output for each iteration (right side, labeled "Each")
  - 1 output for completion (bottom, labeled "Done")

**Data Properties:**
- `items` (string): Variable/array to iterate over
- `count` (number): Number of times to repeat
- `label` (string): Custom label or auto-generated

**Example Configuration:**
```typescript
// Loop over items
{
  type: 'control-loop',
  data: {
    items: 'users',
    label: 'Loop over users'
  }
}

// Repeat N times
{
  type: 'control-loop',
  data: {
    count: 5,
    label: 'Repeat 5 times'
  }
}
```

**Use Cases:**
- Processing arrays/lists
- Batch operations
- Retrying failed actions
- Generating multiple outputs

---

### 3. Merge Node
**File:** `frontend/src/components/workflows/nodes/MergeNode.tsx`

**Purpose:** Combines multiple workflow branches into one

**Visual Design:**
- Color: Amber (matching control nodes)
- Icon: Merge
- Handles:
  - 2 inputs (top, at 30% and 70%)
  - 1 output (bottom)

**Data Properties:**
- `mode` (string): How to merge - 'all' (wait for all) or 'any' (first one wins)
- `label` (string): Custom label (default: "Merge Branches")

**Example Configuration:**
```typescript
// Wait for all branches
{
  type: 'control-merge',
  data: {
    mode: 'all',
    label: 'Wait for both paths'
  }
}

// First branch wins
{
  type: 'control-merge',
  data: {
    mode: 'any',
    label: 'Race condition'
  }
}
```

**Use Cases:**
- Parallel processing with synchronization
- Combining results from multiple sources
- Implementing AND/OR logic
- Race conditions (first response wins)

---

## Registration in WorkflowCanvas

Added to node types mapping:
```typescript
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  'control-delay': DelayNode,      // NEW
  'control-loop': LoopNode,        // NEW
  'control-merge': MergeNode,      // NEW
};
```

## Drop Handler Integration

Updated `edit/page.tsx` to properly handle control nodes:
```typescript
if (category === 'control') {
  if (subtype === 'delay') {
    nodeType = 'control-delay';
    nodeData = { duration: 5, unit: 'seconds' };
  } else if (subtype === 'loop') {
    nodeType = 'control-loop';
    nodeData = { items: 'items' };
  } else if (subtype === 'merge') {
    nodeType = 'control-merge';
    nodeData = { mode: 'all' };
  }
}
```

## How to Use

### Adding a Delay Node:
1. Drag "Delay" from Control Flow section in palette
2. Drop on canvas
3. Node shows "Wait 5 seconds" by default
4. Click to edit duration and unit

### Setting Custom Delay:
```typescript
// To set delay via code or editor
node.data = {
  duration: 30,
  unit: 'minutes',
  description: 'Wait for external API'
}
```

### Adding a Loop Node:
1. Drag "Loop" from Control Flow section
2. Drop on canvas
3. Connect the "Each" output (right side) to nodes that should run on each iteration
4. Connect the "Done" output (bottom) to continue after loop completes

### Loop Configuration:
```typescript
// Loop over array
node.data = {
  items: '${workflow.users}',  // Variable reference
  label: 'Process each user'
}

// Fixed count
node.data = {
  count: 10,
  label: 'Retry up to 10 times'
}
```

### Adding a Merge Node:
1. Drag "Merge" from Control Flow section
2. Drop on canvas
3. Connect multiple branches to the two input handles
4. Single output continues workflow

### Merge Modes:
```typescript
// Wait for all branches (AND)
node.data = {
  mode: 'all',
  description: 'Wait for both API calls'
}

// First branch wins (OR/RACE)
node.data = {
  mode: 'any',
  description: 'Use fastest response'
}
```

## Visual Examples

### Delay Node Pattern:
```
[Previous Node]
      ↓
   [Delay]
   Wait 5s
      ↓
  [Next Node]
```

### Loop Node Pattern:
```
    [Start]
       ↓
    [Loop] ──────→ [Process Item]
       ↓                  ↓
    [Done] ←──────────────┘
       ↓
  [Continue]
```

### Merge Node Pattern:
```
   [Branch A] ──→ \
                    [Merge] ──→ [Continue]
   [Branch B] ──→ /
```

## Common Workflows

### Rate-Limited API Calls:
```
Loop (5 times)
  → Call API
  → Delay (1 second)
  → Back to loop
Done
```

### Parallel Processing with Sync:
```
Start
  → Condition
      ├─ True → Process A ──→ \
      │                         Merge (all)
      └─ False → Process B ──→ /
                                 ↓
                            Continue
```

### Retry Logic:
```
Loop (3 times)
  → Try Action
  → Check Success
      ├─ Success → Exit Loop
      └─ Fail → Delay (5s) → Continue Loop
Done → Handle Final Failure
```

## Files Modified

- `frontend/src/components/workflows/WorkflowCanvas.tsx` - Registered new node types
- `frontend/src/app/(dashboard)/dashboard/workflows/[id]/edit/page.tsx` - Updated drop handler

## Files Created

- `frontend/src/components/workflows/nodes/DelayNode.tsx`
- `frontend/src/components/workflows/nodes/LoopNode.tsx`
- `frontend/src/components/workflows/nodes/MergeNode.tsx`

## Testing

### Test Delay Node:
1. Drag "Delay" from palette
2. ✅ Node appears with timer icon
3. ✅ Shows "Wait 5 seconds"
4. ✅ Has trash button when selected
5. ✅ Can be deleted with Delete key

### Test Loop Node:
1. Drag "Loop" from palette
2. ✅ Node appears with repeat icon
3. ✅ Shows "Loop over items"
4. ✅ Has 3 handles (input, each, done)
5. ✅ Labels show "Each" and "Done"

### Test Merge Node:
1. Drag "Merge" from palette
2. ✅ Node appears with merge icon
3. ✅ Shows "Merge Branches"
4. ✅ Has 2 input handles and 1 output
5. ✅ Can connect multiple branches

## Future Enhancements

- [ ] Add visual indicators for active loop iterations
- [ ] Show delay countdown during execution
- [ ] Support dynamic delays based on variables
- [ ] Add loop break/continue conditions
- [ ] Support more than 2 inputs for merge node
- [ ] Add merge timeout option
- [ ] Execution visualization for control flow
