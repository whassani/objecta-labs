'use client';

import { useCallback, useState } from 'react';
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
  readOnly?: boolean;
}

export default function WorkflowCanvas({
  initialDefinition,
  onChange,
  onInit,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (readOnly) return;
      
      if (onChange) {
        onChange({
          nodes: nodes.filter((n) => !deleted.find((d) => d.id === n.id)) as any,
          edges: edges as any,
        });
      }
    },
    [nodes, edges, onChange, readOnly]
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (readOnly) return;
      
      if (onChange) {
        onChange({
          nodes: nodes as any,
          edges: edges.filter((e) => !deleted.find((d) => d.id === e.id)) as any,
        });
      }
    },
    [nodes, edges, onChange, readOnly]
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
        onNodeClick={onNodeClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={readOnly ? null : 'Delete'}
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
