'use client';

import { useState, useCallback, useRef, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Eye, Settings } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import NodePalette from '@/components/workflows/NodePalette';
import NodeEditor from '@/components/workflows/NodeEditor';
import { WorkflowDefinition } from '@/types/workflow';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export default function EditWorkflowPage() {
  const router = useRouter();
  const params = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const [workflow, setWorkflow] = useState({
    name: 'Customer Support Automation',
    description: 'Automatically respond to common customer queries',
    triggerType: 'manual',
  });

  const [definition, setDefinition] = useState<WorkflowDefinition>({
    nodes: [],
    edges: [],
  });

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);

  // Handle drag over for drop zone
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to add new node
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Determine node category and data based on type
      const [category, subtype] = type.split('-');
      
      let nodeType = 'action'; // default
      let nodeData: any = { label: type };

      if (category === 'trigger') {
        nodeType = 'trigger';
        nodeData = {
          label: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} Trigger`,
          triggerType: subtype,
        };
      } else if (category === 'action') {
        nodeType = 'action';
        nodeData = {
          label: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} Action`,
          actionType: subtype,
        };
      } else if (category === 'control') {
        nodeType = 'condition';
        nodeData = {
          label: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`,
          controlType: subtype,
        };
      }

      const newNode = {
        id: getNodeId(),
        type: nodeType,
        position,
        data: nodeData,
      };

      setDefinition((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));
    },
    [reactFlowInstance]
  );

  const handleDefinitionChange = useCallback((newDefinition: WorkflowDefinition) => {
    setDefinition(newDefinition);
  }, []);

  const handleSave = async () => {
    // TODO: Implement save to backend
    console.log('Saving workflow:', {
      ...workflow,
      definition,
    });
    alert('Workflow saved! (Backend integration pending)');
  };

  const handleExecute = async () => {
    // TODO: Implement execution
    console.log('Executing workflow:', workflow);
    alert('Workflow execution started! (Backend integration pending)');
  };

  const handleBack = () => {
    router.push('/dashboard/workflows');
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{workflow.name}</h1>
              <p className="text-sm text-gray-600">{workflow.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNodeEditor(!showNodeEditor)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Play size={18} />
              Test Run
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <NodePalette />

          {/* Canvas */}
          <div
            ref={reactFlowWrapper}
            className="flex-1 bg-gray-50"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <WorkflowCanvas
              initialDefinition={definition}
              onChange={handleDefinitionChange}
            />
          </div>

          {/* Node Editor (Sidebar) */}
          {showNodeEditor && selectedNode && (
            <NodeEditor
              node={selectedNode}
              onClose={() => setShowNodeEditor(false)}
              onChange={(updatedNode) => {
                setDefinition((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((n) =>
                    n.id === updatedNode.id ? updatedNode : n
                  ),
                }));
              }}
            />
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              <strong>{definition.nodes.length}</strong> nodes
            </span>
            <span>
              <strong>{definition.edges.length}</strong> connections
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-green-600 font-medium">Draft</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Last saved: Never</span>
            <span className="text-gray-400">•</span>
            <span>Version 1</span>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
