'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
  MiniMap,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom styles for edges and execution visualization
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
  .react-flow__edge.executing .react-flow__edge-path {
    stroke: #3b82f6 !important;
    stroke-width: 3 !important;
    stroke-dasharray: 10 !important;
    animation: flow 1s linear infinite;
  }
  
  .react-flow__edge.completed .react-flow__edge-path {
    stroke: #10b981 !important;
    stroke-width: 2.5 !important;
  }
  @keyframes dash {
    to {
      stroke-dashoffset: -1000;
    }
  }
  @keyframes flow {
    0% {
      stroke-dasharray: 5, 5;
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 10;
    }
  }
  
  /* Node execution states */
  .react-flow__node.running {
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 0 3px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5) !important;
    border: 2px solid #3b82f6 !important;
  }
  
  .react-flow__node.completed {
    box-shadow: 0 0 0 2px #10b981 !important;
    border: 2px solid #10b981 !important;
    background: linear-gradient(135deg, #ffffff 0%, #d1fae5 100%) !important;
  }
  
  .react-flow__node.error,
  .react-flow__node.failed {
    box-shadow: 0 0 0 2px #ef4444 !important;
    border: 2px solid #ef4444 !important;
    background: linear-gradient(135deg, #ffffff 0%, #fee2e2 100%) !important;
  }
  
  .react-flow__node.pending {
    opacity: 0.5;
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import DelayNode from './nodes/DelayNode';
import LoopNode from './nodes/LoopNode';
import MergeNode from './nodes/MergeNode';
import DeletableEdge from './edges/DeletableEdge';
import { WorkflowDefinition } from '@/types/workflow';

// Define custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  'control-delay': DelayNode,
  'control-loop': LoopNode,
  'control-merge': MergeNode,
};

// Define custom edge types
const edgeTypes = {
  default: DeletableEdge,
  smoothstep: DeletableEdge,
  step: DeletableEdge,
  straight: DeletableEdge,
};

interface WorkflowCanvasProps {
  initialDefinition?: WorkflowDefinition;
  onChange?: (definition: WorkflowDefinition) => void;
  onInit?: (instance: any) => void;
  onNodeClick?: (node: any) => void;
  readOnly?: boolean;
  onUndoRedo?: (canUndo: boolean, canRedo: boolean) => void;
  executionState?: {
    nodeStates: Record<string, { status: string }>;
    edgeStates: Record<string, { active: boolean }>;
  };
}

export default function WorkflowCanvas({
  initialDefinition,
  onChange,
  onInit,
  onNodeClick,
  readOnly = false,
  onUndoRedo,
  executionState,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track history state changes
  const historyStateRef = useRef({ nodes, edges });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Track last internal change timestamp to prevent re-syncing
  const lastInternalChangeRef = useRef(0);

  // Sync with external definition changes (e.g., from NodeEditor)
  useEffect(() => {
    if (!initialDefinition || !initialDefinition.nodes) return;
    
    // Don't sync if the change came from within the canvas (recent internal change)
    const timeSinceLastChange = Date.now() - lastInternalChangeRef.current;
    if (timeSinceLastChange < 200) {
      return; // Skip sync for recent internal changes (increased to 200ms for debounce)
    }

    // Check if external definition is actually different
    const isNodesDifferent = JSON.stringify(initialDefinition.nodes) !== JSON.stringify(nodes);
    const isEdgesDifferent = JSON.stringify(initialDefinition.edges) !== JSON.stringify(edges);

    if (isNodesDifferent || isEdgesDifferent) {
      console.log('Syncing external definition changes to canvas');
      // External change detected (e.g., from NodeEditor), sync it
      setNodes(initialDefinition.nodes || []);
      setEdges(initialDefinition.edges || []);
    }
  }, [initialDefinition]);

  // Apply execution state classes to nodes and edges
  useEffect(() => {
    if (!executionState) return;

    setNodes((nds) =>
      nds.map((node) => {
        const state = executionState.nodeStates[node.id];
        const className = state?.status ? `${node.className || ''} ${state.status}`.trim() : node.className;
        return { ...node, className };
      })
    );

    setEdges((eds) =>
      eds.map((edge) => {
        const state = executionState.edgeStates[edge.id];
        const className = state?.active ? `${edge.className || ''} executing`.trim() : edge.className;
        return { ...edge, className, animated: state?.active || false };
      })
    );
  }, [executionState, setNodes, setEdges]);

  // Listen for custom delete events from nodes
  useEffect(() => {
    const handleCustomDelete = (event: any) => {
      const nodeId = event.detail?.nodeId;
      
      if (nodeId && !readOnly) {
        // Mark as internal change immediately
        lastInternalChangeRef.current = Date.now();
        
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ));
      }
    };

    window.addEventListener('deleteNode', handleCustomDelete);
    return () => window.removeEventListener('deleteNode', handleCustomDelete);
  }, [readOnly, setNodes, setEdges]);

  // Listen for custom delete events from edges
  useEffect(() => {
    const handleCustomEdgeDelete = (event: any) => {
      const edgeId = event.detail?.edgeId;
      
      if (edgeId && !readOnly) {
        // Mark as internal change immediately
        lastInternalChangeRef.current = Date.now();
        
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      }
    };

    window.addEventListener('deleteEdge', handleCustomEdgeDelete);
    return () => window.removeEventListener('deleteEdge', handleCustomEdgeDelete);
  }, [readOnly, setEdges]);

  // Track history for undo/redo
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef(0);
  const isRestoringHistoryRef = useRef(false);

  // Initialize history
  useEffect(() => {
    if (historyRef.current.length === 0 && nodes.length > 0) {
      historyRef.current = [{ nodes, edges }];
      historyIndexRef.current = 0;
    }
  }, [nodes, edges]);

  // Save state to history
  const saveToHistory = useCallback(() => {
    if (isRestoringHistoryRef.current) return;

    const currentState = { nodes, edges };
    const lastState = historyRef.current[historyIndexRef.current];

    // Check if state actually changed
    if (
      lastState &&
      JSON.stringify(lastState.nodes) === JSON.stringify(nodes) &&
      JSON.stringify(lastState.edges) === JSON.stringify(edges)
    ) {
      return; // No change
    }

    // Remove any future states (if we're not at the end)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(currentState);
    
    // Limit history to last 50 states
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
      historyIndexRef.current = 49;
    } else {
      historyIndexRef.current = historyRef.current.length - 1;
    }

    // Update undo/redo availability
    const newCanUndo = historyIndexRef.current > 0;
    const newCanRedo = false; // Just added new state, no redo available
    setCanUndo(newCanUndo);
    setCanRedo(newCanRedo);
    
    if (onUndoRedo) {
      onUndoRedo(newCanUndo, newCanRedo);
    }
  }, [nodes, edges, onUndoRedo]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isRestoringHistoryRef.current = true;
      historyIndexRef.current -= 1;
      
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);

      const newCanUndo = historyIndexRef.current > 0;
      const newCanRedo = historyIndexRef.current < historyRef.current.length - 1;
      setCanUndo(newCanUndo);
      setCanRedo(newCanRedo);
      
      if (onUndoRedo) {
        onUndoRedo(newCanUndo, newCanRedo);
      }

      setTimeout(() => {
        isRestoringHistoryRef.current = false;
      }, 100);
    }
  }, [setNodes, setEdges, onUndoRedo]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isRestoringHistoryRef.current = true;
      historyIndexRef.current += 1;
      
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);

      const newCanUndo = historyIndexRef.current > 0;
      const newCanRedo = historyIndexRef.current < historyRef.current.length - 1;
      setCanUndo(newCanUndo);
      setCanRedo(newCanRedo);
      
      if (onUndoRedo) {
        onUndoRedo(newCanUndo, newCanRedo);
      }

      setTimeout(() => {
        isRestoringHistoryRef.current = false;
      }, 100);
    }
  }, [setNodes, setEdges, onUndoRedo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Listen for undo/redo button clicks from parent
  useEffect(() => {
    const handleUndoEvent = () => handleUndo();
    const handleRedoEvent = () => handleRedo();

    window.addEventListener('workflowUndo', handleUndoEvent);
    window.addEventListener('workflowRedo', handleRedoEvent);
    
    return () => {
      window.removeEventListener('workflowUndo', handleUndoEvent);
      window.removeEventListener('workflowRedo', handleRedoEvent);
    };
  }, [handleUndo, handleRedo]);
  
  useEffect(() => {
    if (!initialDefinition) return;
    
    const now = Date.now();
    const timeSinceLastChange = now - lastInternalChangeRef.current;
    
    // Skip syncing if we just made an internal change (within 200ms)
    if (timeSinceLastChange < 200) {
      return;
    }
    
    const newNodeCount = initialDefinition.nodes?.length || 0;
    const newEdgeCount = initialDefinition.edges?.length || 0;
    
    // Only sync if nodes/edges were added externally (count increased from current state)
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
  }, [initialDefinition, nodes.length, edges.length, setNodes, setEdges]);

  // Call onChange when nodes or edges change, but debounced to avoid excessive calls
  useEffect(() => {
    if (!onChange || readOnly || !isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      // Don't save to history or call onChange if we're restoring from history
      if (isRestoringHistoryRef.current) {
        return;
      }

      // Save to history
      saveToHistory();

      // Mark that we're making an internal update
      lastInternalChangeRef.current = Date.now();
      
      onChange({
        nodes: nodes as any,
        edges: edges as any,
      });
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, onChange, readOnly, isInitialized, saveToHistory]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
      // Mark as internal change
      lastInternalChangeRef.current = Date.now();
      
      const newEdges = addEdge(connection, edges);
      setEdges(newEdges);
      
      if (onChange) {
        onChange({
          nodes: nodes as any,
          edges: newEdges as any,
        });
      }
    },
    [edges, nodes, onChange, readOnly, setEdges]
  );

  // Handle node selection
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // Handle node deletion
  const handleNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (readOnly) return;
      
      // Mark as internal change immediately
      lastInternalChangeRef.current = Date.now();
      
      const deletedIds = deleted.map((n) => n.id);
      const remainingNodes = nodes.filter((n) => !deletedIds.includes(n.id));
      const remainingEdges = edges.filter(
        (e) => !deletedIds.includes(e.source) && !deletedIds.includes(e.target)
      );
      
      setNodes(remainingNodes);
      setEdges(remainingEdges);
      
      if (onChange) {
        onChange({
          nodes: remainingNodes as any,
          edges: remainingEdges as any,
        });
      }
    },
    [nodes, edges, onChange, readOnly, setNodes, setEdges]
  );

  // Handle edge deletion
  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (readOnly) return;
      
      // Mark as internal change immediately
      lastInternalChangeRef.current = Date.now();
      
      const deletedIds = deleted.map((e) => e.id);
      const remainingEdges = edges.filter((e) => !deletedIds.includes(e.id));
      
      setEdges(remainingEdges);
      
      if (onChange) {
        onChange({
          nodes: nodes as any,
          edges: remainingEdges as any,
        });
      }
    },
    [nodes, edges, onChange, readOnly, setEdges]
  );

  // Update definition when nodes/edges change
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleInit = useCallback(
    (instance: any) => {
      setIsInitialized(true);
      if (onInit) {
        onInit(instance);
      }
    },
    [onInit]
  );

  return (
    <div className="h-full w-full">
      <style>{edgeStyles}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Delete", "Backspace"]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
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
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'trigger') return '#10b981';
            if (n.type === 'action') return '#6366f1';
            if (n.type === 'condition') return '#f59e0b';
            return '#ccc';
          }}
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#d1fae5';
            if (n.type === 'action') return '#e0e7ff';
            if (n.type === 'condition') return '#fef3c7';
            return '#f5f5f5';
          }}
          nodeBorderRadius={8}
        />
      </ReactFlow>
    </div>
  );
}
