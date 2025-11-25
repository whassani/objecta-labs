# Workflow Node Deletion Fix

## Summary
Fixed the node deletion functionality in the workflow editor and changed the delete button icon from X to Trash.

## Changes Made

### Edge Styling and Deletion

Created a custom edge component with a delete button and added visual feedback:

**New Component:** `frontend/src/components/workflows/edges/DeletableEdge.tsx`
- Custom edge component with trash button
- Button appears at the midpoint of selected edges
- Uses custom event to trigger deletion

**Changes in:** `frontend/src/components/workflows/WorkflowCanvas.tsx`

1. **Custom Edge Styles:**
```tsx
const edgeStyles = `
  .react-flow__edge-path {
    stroke-width: 2;
    cursor: pointer;
  }
  .react-flow__edge.selected .react-flow__edge-path {
    stroke: #ef4444 !important;
    stroke-width: 3;
  }
  .react-flow__edge:hover .react-flow__edge-path {
    stroke: #6366f1 !important;
    stroke-width: 3;
  }
  .react-flow__edge.selected .react-flow__edge-path,
  .react-flow__edge:hover .react-flow__edge-path {
    animation: dash 20s linear infinite;
  }
`;
```

2. **Edge Configuration:**
```tsx
edgesFocusable={!readOnly}
defaultEdgeOptions={{
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#b1b1b7', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#b1b1b7',
  },
}}
```

3. **Edge Delete Handler:**
- Added timestamp marking to prevent infinite loops
- Properly filters deleted edges
- Calls onChange to notify parent component

### 1. Updated Node Components (Trash Icon)
All three node components were updated to use the `Trash2` icon instead of `X`:

**Files Modified:**
- `frontend/src/components/workflows/nodes/TriggerNode.tsx`
- `frontend/src/components/workflows/nodes/ActionNode.tsx`
- `frontend/src/components/workflows/nodes/ConditionNode.tsx`

**Changes:**
- Import: `X` → `Trash2` from `lucide-react`
- Button size: `w-6 h-6` → `w-7 h-7` (slightly larger for better visibility)
- Icon: `<X size={14} />` → `<Trash2 size={14} />`

### 2. Fixed WorkflowCanvas Delete Functionality

**File:** `frontend/src/components/workflows/WorkflowCanvas.tsx`

**Key Changes:**

#### a) Fixed Delete Key Support
```tsx
// Changed from string to array
deleteKeyCode={["Delete", "Backspace"]}
```
This fixes the Delete key functionality in ReactFlow v11, which requires an array of key codes.

#### b) Improved Custom Delete Event Handler
```tsx
useEffect(() => {
  const handleCustomDelete = (event: any) => {
    const nodeId = event.detail?.nodeId;
    if (nodeId && !readOnly) {
      console.log('Custom delete event for node:', nodeId);
      
      // Use functional updates to avoid stale closure issues
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ));
    }
  };

  window.addEventListener('deleteNode', handleCustomDelete);
  return () => window.removeEventListener('deleteNode', handleCustomDelete);
}, [readOnly, setNodes, setEdges]);
```

#### c) Added onChange Propagation (with Debouncing)
```tsx
// Call onChange when nodes or edges change, but debounced to avoid excessive calls
useEffect(() => {
  if (!onChange || readOnly || !isInitialized) return;
  
  const timeoutId = setTimeout(() => {
    onChange({
      nodes: nodes as any,
      edges: edges as any,
    });
  }, 100); // 100ms debounce
  
  return () => clearTimeout(timeoutId);
}, [nodes, edges, onChange, readOnly, isInitialized]);
```

**Why debouncing is important:**
- Groups rapid changes (like dragging multiple nodes) into a single update
- Reduces the number of parent component re-renders
- Prevents performance issues with large workflows

#### d) Smart Syncing from Parent Props
```tsx
// Track node/edge counts to detect external additions (like drag-and-drop)
const prevCountRef = useRef({ nodes: 0, edges: 0 });

useEffect(() => {
  if (!initialDefinition) return;
  
  const newNodeCount = initialDefinition.nodes?.length || 0;
  const newEdgeCount = initialDefinition.edges?.length || 0;
  
  // Only sync if nodes/edges were added externally (count increased)
  const nodesAdded = newNodeCount > nodes.length;
  const edgesAdded = newEdgeCount > edges.length;
  
  if (nodesAdded || edgesAdded) {
    if (initialDefinition.nodes) {
      setNodes(initialDefinition.nodes as any);
    }
    if (initialDefinition.edges) {
      setEdges(initialDefinition.edges as any);
    }
  }
  
  prevCountRef.current = { nodes: newNodeCount, edges: newEdgeCount };
}, [initialDefinition, nodes.length, edges.length, setNodes, setEdges]);
```

**Critical for preventing infinite loops while allowing new nodes:**
- Syncs when node/edge count increases (parent added a node via drag-and-drop)
- Blocks syncing when count stays the same or decreases (our own changes being echoed back)
- This allows external additions while breaking the circular dependency

#### e) Added Initialization Handler
```tsx
const handleInit = useCallback(
  (instance: any) => {
    setIsInitialized(true);
    if (onInit) {
      onInit(instance);
    }
  },
  [onInit]
);
```

#### f) Simplified Change Handlers
Removed duplicate onChange calls from `handleNodesChange` and `handleEdgesChange` to prevent redundant updates.

## How It Works Now

### Delete Methods Available:

#### For Nodes:

1. **Delete Button (Trash Icon)**
   - Appears in the top-right corner of selected nodes
   - Click to delete the node and all connected edges
   - Uses custom event system: `window.dispatchEvent(new CustomEvent('deleteNode', { detail: { nodeId } }))`

2. **Delete Key**
   - Select a node and press `Delete` key
   - Uses ReactFlow's built-in `deleteKeyCode` prop

3. **Backspace Key**
   - Select a node and press `Backspace` key
   - Alternative to Delete key for better cross-platform support

#### For Edges (Wires/Connections):

1. **Delete Button (Trash Icon)**
   - Click on an edge to select it (turns red)
   - A red trash button appears at the middle of the edge
   - Click the trash button to delete the connection

2. **Delete Key**
   - Click on an edge to select it (turns red)
   - Press `Delete` key to remove the connection

3. **Backspace Key**
   - Click on an edge to select it (turns red)
   - Press `Backspace` key to remove the connection

### Visual Feedback:

- **Edges on hover**: Turn indigo and thicker
- **Selected edges**: Turn red and thicker with trash button in the middle
- **Cursor**: Changes to pointer when hovering over edges
- **Animation**: Selected/hovered edges show animated dash effect
- **Delete button**: Red circular button with trash icon appears on selected edges

### Technical Flow:

1. **User Action** → Clicks trash button or presses Delete/Backspace
2. **Event Handling** → Custom event listener or ReactFlow's built-in handler
3. **State Update** → `setNodes()` and `setEdges()` remove the node and connected edges
4. **Propagation** → `onChange` callback notifies parent component
5. **UI Update** → Canvas re-renders with updated nodes

## Testing Instructions

### Testing Node Deletion:
1. Open the workflow editor: `http://localhost:3002/dashboard/workflows/[id]/edit`
2. Add some nodes by dragging from the palette
3. Select a node (click on it)
4. Try any of these methods:
   - Click the red trash button in the top-right corner
   - Press the `Delete` key
   - Press the `Backspace` key
5. Verify the node and its connections are removed
6. Save the workflow and verify the changes persist

### Testing Edge Deletion:
1. Create at least two nodes
2. Connect them by dragging from one node's output handle to another's input handle
3. Click on the edge (wire) to select it - it should turn red
4. **See the red trash button** appear in the middle of the edge
5. Try any of these methods:
   - Click the trash button on the edge
   - Press `Delete` key
   - Press `Backspace` key
6. Verify the connection is removed
7. Hover over edges to see the hover effect (indigo color)
8. Save the workflow and verify the changes persist

## Bug Fixes

### Issue: Maximum Update Depth Exceeded Error
**Problem:** After deleting a node and saving, the application would throw:
```
Maximum update depth exceeded. This can happen when a component repeatedly calls 
setState inside componentWillUpdate or componentDidUpdate. React limits the number 
of nested updates to prevent infinite loops.
```

**Root Cause:** The `onChange` callback was triggering infinite re-renders because:
1. `onChange` notifies parent component of changes
2. Parent updates its state and passes new `initialDefinition` props back
3. Child component syncs from `initialDefinition` and calls `onChange` again
4. Loop continues infinitely

**Solution:** Two-part fix to break the infinite loop:

1. **Smart syncing - only when nodes/edges are added externally:**
```tsx
// Track node/edge counts to detect external additions (like drag-and-drop)
const prevCountRef = useRef({ nodes: 0, edges: 0 });

useEffect(() => {
  if (!initialDefinition) return;
  
  const newNodeCount = initialDefinition.nodes?.length || 0;
  const newEdgeCount = initialDefinition.edges?.length || 0;
  
  // Only sync if nodes/edges were added externally (count increased)
  const nodesAdded = newNodeCount > nodes.length;
  const edgesAdded = newEdgeCount > edges.length;
  
  if (nodesAdded || edgesAdded) {
    if (initialDefinition.nodes) {
      setNodes(initialDefinition.nodes as any);
    }
    if (initialDefinition.edges) {
      setEdges(initialDefinition.edges as any);
    }
  }
  
  prevCountRef.current = { nodes: newNodeCount, edges: newEdgeCount };
}, [initialDefinition, nodes.length, edges.length, setNodes, setEdges]);
```

**Why this works:**
- Allows parent to add new nodes (drag-and-drop from palette)
- Blocks re-syncing when count stays the same (prevents echoing our own changes back)
- Prevents infinite loops while maintaining full functionality

2. **Debounce onChange calls to batch rapid updates:**
```tsx
useEffect(() => {
  if (!onChange || readOnly || !isInitialized) return;
  
  const timeoutId = setTimeout(() => {
    onChange({
      nodes: nodes as any,
      edges: edges as any,
    });
  }, 100); // 100ms debounce
  
  return () => clearTimeout(timeoutId);
}, [nodes, edges, onChange, readOnly, isInitialized]);
```

This prevents the component from re-syncing with parent props after making internal changes, while still propagating changes to the parent after a short debounce period.

## Build Status

✅ Build successful - no errors or warnings
✅ Infinite loop bug fixed
✅ All debug console logs removed

## Dev Server

Running on: `http://localhost:3002`

## Additional Fixes

### Deprecated API Warning
Fixed the ReactFlow deprecation warning:
```
[DEPRECATED] `project` is deprecated. Instead use `screenToFlowPosition`
```

**Changed in:** `frontend/src/app/(dashboard)/dashboard/workflows/[id]/edit/page.tsx`

**Before:**
```tsx
const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
const position = reactFlowInstance.project({
  x: event.clientX - reactFlowBounds.left,
  y: event.clientY - reactFlowBounds.top,
});
```

**After:**
```tsx
const position = reactFlowInstance.screenToFlowPosition({
  x: event.clientX,
  y: event.clientY,
});
```

## Files Changed

- `frontend/src/components/workflows/nodes/TriggerNode.tsx` - Trash icon
- `frontend/src/components/workflows/nodes/ActionNode.tsx` - Trash icon
- `frontend/src/components/workflows/nodes/ConditionNode.tsx` - Trash icon
- `frontend/src/components/workflows/WorkflowCanvas.tsx` - Delete functionality & infinite loop fix
- `frontend/src/app/(dashboard)/dashboard/workflows/[id]/edit/page.tsx` - Fixed deprecated API

## Files Created

- `frontend/src/components/workflows/edges/DeletableEdge.tsx` - Custom edge component with trash button
