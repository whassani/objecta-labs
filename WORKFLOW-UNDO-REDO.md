# Workflow Undo/Redo Feature

## Summary
Implemented full undo/redo functionality for the workflow editor, allowing users to revert and replay changes with keyboard shortcuts and UI buttons.

## Features

### Undo/Redo Methods:

#### 1. **Keyboard Shortcuts**
- **Ctrl+Z** (Windows/Linux) or **Cmd+Z** (Mac): Undo last change
- **Ctrl+Y** (Windows/Linux) or **Cmd+Shift+Z** (Mac): Redo last undone change
- Works globally in the workflow editor (except when typing in inputs)

#### 2. **UI Buttons**
- **Undo button**: Left arrow icon in the top toolbar
- **Redo button**: Right arrow icon in the top toolbar
- Buttons are disabled (grayed out) when undo/redo is not available
- Shows tooltips with keyboard shortcuts

### What Can Be Undone/Redone:

✅ **Node Operations:**
- Adding nodes
- Deleting nodes (via trash button or Delete key)
- Moving nodes
- Editing node properties

✅ **Edge Operations:**
- Creating connections
- Deleting connections (via trash button or Delete key)

✅ **Multiple Changes:**
- Complex operations (e.g., deleting a node with multiple connections)
- Batch operations

### History Management:

- **History Limit**: Last 50 states
- **Smart Tracking**: Only saves state when actual changes occur
- **Debouncing**: Groups rapid changes (100ms window) to avoid cluttering history
- **Reset on New Changes**: Making a new change after undo clears the "future" states

## Implementation Details

### Components Modified:

#### 1. **WorkflowCanvas.tsx**
Added history tracking system:
```tsx
// Track history for undo/redo
const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
const historyIndexRef = useRef(0);
const isRestoringHistoryRef = useRef(false);

// Save state to history
const saveToHistory = useCallback(() => {
  if (isRestoringHistoryRef.current) return;

  const currentState = { nodes, edges };
  const lastState = historyRef.current[historyIndexRef.current];

  // Check if state actually changed
  if (/* state unchanged */) return;

  // Add new state and limit to 50 entries
  historyRef.current.push(currentState);
  if (historyRef.current.length > 50) {
    historyRef.current = historyRef.current.slice(-50);
  }
}, [nodes, edges]);
```

#### 2. **Keyboard Shortcuts**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger if user is typing
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    
    // Ctrl+Y or Cmd+Shift+Z for redo
    if (/* redo keys */) {
      e.preventDefault();
      handleRedo();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleUndo, handleRedo]);
```

#### 3. **UI Integration**
Parent page (`edit/page.tsx`) receives undo/redo state:
```tsx
const handleUndoRedoChange = useCallback((canUndoValue: boolean, canRedoValue: boolean) => {
  setCanUndo(canUndoValue);
  setCanRedo(canRedoValue);
}, []);

// Pass to WorkflowCanvas
<WorkflowCanvas
  onUndoRedo={handleUndoRedoChange}
  // ... other props
/>
```

#### 4. **Button Events**
Buttons dispatch custom events to trigger undo/redo:
```tsx
<button
  onClick={() => window.dispatchEvent(new CustomEvent('workflowUndo'))}
  disabled={!canUndo}
>
  <Undo size={18} />
</button>
```

### Key Technical Decisions:

1. **Refs Instead of State**: Used `useRef` for history to avoid re-renders
2. **JSON Comparison**: Compares stringified state to detect actual changes
3. **Restoration Flag**: Prevents saving during undo/redo operations
4. **Debounced Saving**: Only saves after 100ms of no changes
5. **Custom Events**: Buttons trigger undo/redo via window events

## Visual Design

### Undo/Redo Buttons:
- Located in top toolbar, before Settings button
- Separated by a vertical divider
- Icons: Lucide-react's `Undo` and `Redo`
- Disabled state: 40% opacity, grayed out, no hover effect
- Active state: Border, hover effect
- Tooltips show keyboard shortcuts

### Button States:
```
Enabled:  border-gray-300, hover:bg-gray-50
Disabled: opacity-40, cursor-not-allowed, no hover
```

## Testing Instructions

### Test Undo:
1. Open workflow editor
2. Add 2-3 nodes
3. Connect them with edges
4. Press **Ctrl+Z** or click **Undo button**
5. ✅ Last action should be reversed
6. Press **Ctrl+Z** multiple times
7. ✅ Should undo multiple actions in reverse order

### Test Redo:
1. After undoing some actions
2. Press **Ctrl+Y** or click **Redo button**
3. ✅ Last undone action should be replayed
4. Press **Ctrl+Y** multiple times
5. ✅ Should redo multiple actions

### Test Button States:
1. Open empty workflow
2. ✅ Both buttons should be disabled
3. Add a node
4. ✅ Undo button enabled, Redo disabled
5. Press Undo
6. ✅ Undo disabled, Redo enabled
7. Press Redo
8. ✅ Undo enabled, Redo disabled

### Test Complex Scenarios:
1. Add 5 nodes
2. Undo 3 times
3. Add a new node
4. ✅ Redo button should become disabled (future cleared)
5. Delete a node with connections
6. Undo
7. ✅ Node and all connections should be restored

### Test Keyboard Shortcuts:
1. Add nodes
2. Click in a text input
3. Press Ctrl+Z
4. ✅ Should NOT undo (respects input focus)
5. Click outside input
6. Press Ctrl+Z
7. ✅ Should undo

## Files Changed

- `frontend/src/components/workflows/WorkflowCanvas.tsx` - History tracking & undo/redo logic
- `frontend/src/app/(dashboard)/dashboard/workflows/[id]/edit/page.tsx` - UI buttons & state management

## Files Created

- `frontend/src/hooks/useWorkflowHistory.ts` - Custom hook (not used in final implementation, using refs instead)

## Known Limitations

1. **History Limit**: Only last 50 states are kept
2. **No Persistence**: History is cleared on page refresh
3. **No Deep Undo**: Can't undo property changes while editing a node in the sidebar
4. **Debounce Window**: Very rapid changes (< 100ms) might be grouped together

## Future Enhancements

- [ ] Persist history to localStorage
- [ ] Show undo/redo history in a dropdown
- [ ] Add visual indication of current position in history
- [ ] Support for branching history (tree view)
- [ ] Configurable history limit
- [ ] Undo/redo for node property edits in sidebar

## Performance Considerations

- Uses JSON.stringify for state comparison (fast for small workflows)
- Limits history to 50 states to prevent memory issues
- Debouncing prevents excessive history saves
- Refs instead of state to avoid unnecessary re-renders
