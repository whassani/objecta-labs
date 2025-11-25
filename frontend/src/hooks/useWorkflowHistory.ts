import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface UseWorkflowHistoryReturn {
  state: HistoryState;
  setState: (nodes: Node[], edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useWorkflowHistory(
  initialNodes: Node[] = [],
  initialEdges: Edge[] = []
): UseWorkflowHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUpdatingRef = useRef(false);

  // Get current state
  const state = history[currentIndex] || { nodes: [], edges: [] };

  // Update state and add to history
  const setState = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (isUpdatingRef.current) return;

      // Check if state actually changed
      const currentState = history[currentIndex];
      if (
        JSON.stringify(currentState.nodes) === JSON.stringify(nodes) &&
        JSON.stringify(currentState.edges) === JSON.stringify(edges)
      ) {
        return; // No change, don't add to history
      }

      isUpdatingRef.current = true;

      setHistory((prev) => {
        // Remove any future states (if we're not at the end)
        const newHistory = prev.slice(0, currentIndex + 1);
        // Add new state
        newHistory.push({ nodes, edges });
        // Limit history to last 50 states
        return newHistory.slice(-50);
      });

      setCurrentIndex((prev) => Math.min(prev + 1, 49));

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    },
    [currentIndex, history]
  );

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUpdatingRef.current = true;
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [currentIndex]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUpdatingRef.current = true;
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [currentIndex, history.length]);

  // Check if undo/redo is available
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([{ nodes: [], edges: [] }]);
    setCurrentIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
