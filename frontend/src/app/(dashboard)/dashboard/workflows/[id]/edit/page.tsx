'use client';

import { useState, useCallback, useRef, DragEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Eye, Settings, Loader2 } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import NodePalette from '@/components/workflows/NodePalette';
import NodeEditor from '@/components/workflows/NodeEditor';
import { WorkflowDefinition, Workflow } from '@/types/workflow';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export default function EditWorkflowPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const workflowId = params.id as string;
  const isNewWorkflow = workflowId === 'new-workflow';

  // Fetch workflow from backend
  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (isNewWorkflow) {
        return {
          id: workflowId,
          name: 'New Workflow',
          description: '',
          triggerType: 'manual' as const,
          status: 'draft' as const,
          definition: { nodes: [], edges: [] },
          version: 1,
          tags: [],
          executionCount: 0,
        };
      }
      const response = await workflowsApi.getOne(workflowId);
      return response.data;
    },
    enabled: !!workflowId,
  });

  const [definition, setDefinition] = useState<WorkflowDefinition>(
    workflow?.definition || { nodes: [], edges: [] }
  );

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update definition when workflow loads
  useEffect(() => {
    if (workflow?.definition) {
      setDefinition(workflow.definition);
    }
  }, [workflow]);

  // Save workflow mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Workflow>) => {
      if (isNewWorkflow) {
        const response = await workflowsApi.create(data);
        return response.data;
      } else {
        const response = await workflowsApi.update(workflowId, data);
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // If it was a new workflow, redirect to the actual ID
      if (isNewWorkflow && data.id) {
        router.push(`/dashboard/workflows/${data.id}/edit`);
      }
    },
    onError: (error) => {
      console.error('Error saving workflow:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      const response = await workflowsApi.execute(workflowId, {
        triggerData: {},
      });
      return response.data;
    },
    onSuccess: (data) => {
      alert(`Workflow execution started! Execution ID: ${data.id}`);
    },
    onError: (error) => {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow');
    },
  });

  // Handle drag over for drop zone
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to add new node
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      console.log('Drop event triggered');
      console.log('reactFlowWrapper:', reactFlowWrapper.current);
      console.log('reactFlowInstance:', reactFlowInstance);

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.warn('Missing reactFlowWrapper or reactFlowInstance');
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      console.log('Dropped node type:', type);
      
      if (!type) {
        console.warn('No type data in dataTransfer');
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      console.log('Drop position:', position);

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

      console.log('Creating new node:', newNode);

      setDefinition((prev) => {
        const newDef = {
          ...prev,
          nodes: [...prev.nodes, newNode],
        };
        console.log('New definition:', newDef);
        return newDef;
      });
    },
    [reactFlowInstance]
  );

  const handleDefinitionChange = useCallback((newDefinition: WorkflowDefinition) => {
    setDefinition(newDefinition);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  }, []);

  const handleSave = async () => {
    if (!workflow) return;
    
    setSaveStatus('saving');
    saveMutation.mutate({
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      definition,
    });
  };

  const handleExecute = async () => {
    if (isNewWorkflow) {
      alert('Please save the workflow before executing');
      return;
    }
    executeMutation.mutate();
  };

  const handleBack = () => {
    router.push('/dashboard/workflows');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading workflow</p>
          <button
            onClick={() => router.push('/dashboard/workflows')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

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
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Save size={18} />
                  Saved!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <Save size={18} />
                  Error
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
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
              onInit={setReactFlowInstance}
              onNodeClick={handleNodeClick}
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
