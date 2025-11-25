'use client';

import { useCallback, useState, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import { WorkflowDefinition } from '@/types/workflow';

// Define custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

interface WorkflowCanvasProps {
  initialDefinition?: WorkflowDefinition;
  onChange?: (definition: WorkflowDefinition) => void;
  onInit?: (instance: any) => void;
  onNodeClick?: (node: any) => void;
  readOnly?: boolean;
}

export default function WorkflowCanvas({
  initialDefinition,
  onChange,
  onInit,
  onNodeClick,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update nodes and edges when initialDefinition changes
  useEffect(() => {
    if (!initialDefinition) return;

    const currentNodeCount = nodes.length;
    const newNodeCount = initialDefinition.nodes?.length || 0;
    const currentEdgeCount = edges.length;
    const newEdgeCount = initialDefinition.edges?.length || 0;

    // If count changed (add/remove), update everything
    if (currentNodeCount !== newNodeCount || currentEdgeCount !== newEdgeCount) {
      if (initialDefinition.nodes) {
        setNodes(initialDefinition.nodes as any);
      }
      if (initialDefinition.edges) {
        setEdges(initialDefinition.edges as any);
      }
      return;
    }

    // If count is the same, only update node data (not positions)
    // This allows property changes to be reflected without fighting drag operations
    if (initialDefinition.nodes && nodes.length === newNodeCount) {
      setNodes((currentNodes) =>
        currentNodes.map((currentNode) => {
          const updatedNode = initialDefinition.nodes.find((n) => n.id === currentNode.id);
          if (updatedNode) {
            // Keep current position and other ReactFlow properties, only update data
            return {
              ...currentNode,
              data: updatedNode.data,
              type: updatedNode.type, // Ensure type is preserved
            };
          }
          return currentNode;
        })
      );
    }

    // Also update edges if they changed
    if (initialDefinition.edges && edges.length === newEdgeCount) {
      setEdges(initialDefinition.edges as any);
    }
  }, [initialDefinition]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return;
      
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
      console.log('handleNodesDelete called with:', deleted);
      console.log('readOnly:', readOnly);
      
      if (readOnly) return;
      
      const deletedIds = deleted.map((n) => n.id);
      console.log('Deleting node IDs:', deletedIds);
      console.log('Current nodes:', nodes);
      
      const remainingNodes = nodes.filter((n) => !deletedIds.includes(n.id));
      const remainingEdges = edges.filter(
        (e) => !deletedIds.includes(e.source) && !deletedIds.includes(e.target)
      );
      
      console.log('Remaining nodes:', remainingNodes);
      console.log('Remaining edges:', remainingEdges);
      
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
      
      if (onChange && !readOnly) {
        // Debounce or call after state update
        setTimeout(() => {
          onChange({
            nodes: nodes as any,
            edges: edges as any,
          });
        }, 0);
      }
    },
    [onNodesChange, nodes, edges, onChange, readOnly]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      
      if (onChange && !readOnly) {
        setTimeout(() => {
          onChange({
            nodes: nodes as any,
            edges: edges as any,
          });
        }, 0);
      }
    },
    [onEdgesChange, nodes, edges, onChange, readOnly]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
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
