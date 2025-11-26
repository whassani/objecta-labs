'use client';

import { useState, useCallback, useRef, DragEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Play, Eye, Settings, Loader2, Undo, Redo } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import NodePalette from '@/components/workflows/NodePalette';
import NodeEditor from '@/components/workflows/NodeEditor';
import ExecutionVisualizer from '@/components/workflows/ExecutionVisualizer';
import TestWorkflowModal from '@/components/workflows/TestWorkflowModal';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { WorkflowDefinition, Workflow } from '@/types/workflow';

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
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Execution mode state - Use backend mode for real LLM execution
  const [executionMode, setExecutionMode] = useState<'normal' | 'step-by-step' | 'backend'>('backend');

  // Workflow execution with all advanced features
  const { 
    execution, 
    breakpoints,
    variables,
    history,
    currentHistoryIndex,
    start, 
    pause, 
    resume, 
    stop, 
    reset,
    executeStep,
    toggleStepMode,
    toggleBreakpoint,
    setBreakpointCondition,
    clearAllBreakpoints,
    loadHistoryEntry,
  } = useWorkflowExecution(
    definition.nodes,
    definition.edges,
    workflowId,
    executionMode
  );

  // Generate unique node IDs based on existing nodes
  const getNodeId = useCallback(() => {
    // Find the highest existing node ID number
    const existingIds = definition.nodes.map(n => {
      const match = n.id.match(/^node_(\d+)$/);
      return match ? parseInt(match[1], 10) : -1;
    });
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : -1;
    return `node_${maxId + 1}`;
  }, [definition.nodes]);

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

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
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
        // Handle different control node types
        if (subtype === 'condition') {
          nodeType = 'condition';
          nodeData = {
            label: 'If/Else',
            condition: '',
          };
        } else if (subtype === 'delay') {
          nodeType = 'control-delay';
          nodeData = {
            label: 'Delay',
            duration: 5,
            unit: 'seconds',
          };
        } else if (subtype === 'loop') {
          nodeType = 'control-loop';
          nodeData = {
            label: 'Loop',
            items: 'items',
          };
        } else if (subtype === 'merge') {
          nodeType = 'control-merge';
          nodeData = {
            label: 'Merge Branches',
            mode: 'all', // 'all' or 'any'
          };
        } else {
          // Default condition node for other control types
          nodeType = 'condition';
          nodeData = {
            label: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`,
            controlType: subtype,
          };
        }
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
    [reactFlowInstance, getNodeId]
  );

  const handleDefinitionChange = useCallback((newDefinition: WorkflowDefinition) => {
    setDefinition(newDefinition);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  }, []);

  const handleUndoRedoChange = useCallback((canUndoValue: boolean, canRedoValue: boolean) => {
    setCanUndo(canUndoValue);
    setCanRedo(canRedoValue);
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
    // Use visualized execution instead of backend call
    start();
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
            <div className="flex items-center gap-2 border-r border-gray-300 pr-3 mr-3">
              <button
                onClick={() => {
                  // Trigger undo via custom event
                  window.dispatchEvent(new CustomEvent('workflowUndo'));
                }}
                disabled={!canUndo}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={18} />
              </button>
              <button
                onClick={() => {
                  // Trigger redo via custom event
                  window.dispatchEvent(new CustomEvent('workflowRedo'));
                }}
                disabled={!canRedo}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={18} />
              </button>
            </div>
            <button
              onClick={() => setShowNodeEditor(!showNodeEditor)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showPreview 
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Play size={18} />
              Test Workflow
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
            className="flex-1 bg-gray-50 relative"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <WorkflowCanvas
              initialDefinition={definition}
              onChange={handleDefinitionChange}
              onInit={setReactFlowInstance}
              onNodeClick={handleNodeClick}
              onUndoRedo={handleUndoRedoChange}
              readOnly={showPreview}
              executionState={execution.status !== 'idle' ? {
                nodeStates: execution.nodeStates,
                edgeStates: execution.edgeStates,
              } : undefined}
            />
            
            {/* Preview Mode Indicator */}
            {showPreview && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <Eye size={20} />
                <span className="font-medium">Preview Mode - Read Only</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="ml-2 px-3 py-1 bg-white text-indigo-600 rounded hover:bg-indigo-50 transition text-sm font-medium"
                >
                  Exit Preview
                </button>
              </div>
            )}
            
            {/* Execution Visualizer */}
            <ExecutionVisualizer
              nodes={definition.nodes}
              edges={definition.edges}
              execution={execution}
              breakpoints={breakpoints}
              variables={variables}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              stepMode={executionMode === 'step-by-step'}
              isNodeEditorOpen={showNodeEditor}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onReset={reset}
              onStep={executeStep}
              onToggleStepMode={toggleStepMode}
              onToggleBreakpoint={toggleBreakpoint}
              onSetBreakpointCondition={setBreakpointCondition}
              onClearAllBreakpoints={clearAllBreakpoints}
              onLoadHistory={loadHistoryEntry}
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
                // Also update selectedNode so editor shows latest data
                setSelectedNode(updatedNode);
              }}
            />
          )}
        </div>

        {/* Test Workflow Modal */}
        {showTestModal && (
          <TestWorkflowModal
            workflowId={workflowId}
            workflowName={workflow?.name || 'Workflow'}
            triggerType={workflow?.triggerType || 'manual'}
            onClose={() => setShowTestModal(false)}
            onTest={(testData) => {
              setShowTestModal(false);
              start(testData);
            }}
          />
        )}

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
