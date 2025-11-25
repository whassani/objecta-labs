'use client';

import { useEffect, useState, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { 
  Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Loader2,
  StepForward, Bug, History, Eye, Square, SkipForward, GripVertical, Maximize2, Minimize2
} from 'lucide-react';

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export type NodeExecutionState = {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
  output?: any;
  iteration?: number; // For loop nodes
};

export type EdgeExecutionState = {
  edgeId: string;
  active: boolean;
  data?: any;
};

export type ExecutionState = {
  status: ExecutionStatus;
  currentNode?: string;
  nodeStates: Record<string, NodeExecutionState>;
  edgeStates: Record<string, EdgeExecutionState>;
  startTime?: number;
  endTime?: number;
  logs: ExecutionLog[];
};

export type ExecutionLog = {
  timestamp: number;
  nodeId?: string;
  level: 'info' | 'warning' | 'error';
  message: string;
};

export type WorkflowExecutionHistory = {
  id: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: ExecutionStatus;
  nodeStates: Record<string, NodeExecutionState>;
  logs: ExecutionLog[];
  variables?: Record<string, any>;
};

interface ExecutionVisualizerProps {
  nodes: Node[];
  edges: Edge[];
  execution?: ExecutionState;
  breakpoints?: Map<string, any>;
  variables?: Map<string, any>;
  history?: WorkflowExecutionHistory[];
  currentHistoryIndex?: number;
  stepMode?: boolean;
  isNodeEditorOpen?: boolean; // NEW: Track if node editor is open
  
  // Execution controls
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  
  // Step debugging
  onStep?: () => void;
  onToggleStepMode?: () => void;
  
  // Breakpoints
  onToggleBreakpoint?: (nodeId: string) => void;
  onSetBreakpointCondition?: (nodeId: string, condition?: string) => void;
  onClearAllBreakpoints?: () => void;
  
  // History
  onLoadHistory?: (index: number) => void;
}

export default function ExecutionVisualizer({
  nodes,
  edges,
  execution,
  breakpoints = new Map(),
  variables = new Map(),
  history = [],
  currentHistoryIndex = -1,
  stepMode = false,
  isNodeEditorOpen = false,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onStep,
  onToggleStepMode,
  onToggleBreakpoint,
  onSetBreakpointCondition,
  onClearAllBreakpoints,
  onLoadHistory,
}: ExecutionVisualizerProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBreakpoints, setShowBreakpoints] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Drag and resize state
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 400 });
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const getNodeStatus = (nodeId: string): NodeExecutionState['status'] => {
    return execution?.nodeStates[nodeId]?.status || 'pending';
  };

  const getNodeDuration = (nodeId: string): string => {
    const state = execution?.nodeStates[nodeId];
    if (!state?.duration) return '';
    if (state.duration < 1000) return `${state.duration}ms`;
    return `${(state.duration / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (status: NodeExecutionState['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-gray-400" />;
      case 'skipped':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: NodeExecutionState['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 border-blue-500';
      case 'completed':
        return 'bg-green-100 border-green-500';
      case 'failed':
        return 'bg-red-100 border-red-500';
      case 'pending':
        return 'bg-gray-50 border-gray-300';
      case 'skipped':
        return 'bg-gray-100 border-gray-400';
      default:
        return 'bg-white border-gray-300';
    }
  };

  const isExecuting = execution?.status === 'running';
  const isPaused = execution?.status === 'paused';
  const isCompleted = execution?.status === 'completed';
  const isFailed = execution?.status === 'failed';

  const getTotalDuration = () => {
    if (!execution?.startTime) return '';
    const endTime = execution.endTime || Date.now();
    const duration = endTime - execution.startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const completedNodes = Object.values(execution?.nodeStates || {}).filter(
    (s) => s.status === 'completed'
  ).length;
  const failedNodes = Object.values(execution?.nodeStates || {}).filter(
    (s) => s.status === 'failed'
  ).length;

  const isWaitingForStep = execution?.status === 'running' && stepMode;
  const currentNodeId = execution?.currentNode;
  const currentVariables = currentNodeId ? variables.get(currentNodeId) : null;

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
        });
      }
      
      if (isResizing) {
        const rect = panelRef.current?.getBoundingClientRect();
        if (rect) {
          setSize({
            width: Math.max(400, Math.min(window.innerWidth - position.x - 20, e.clientX - rect.left)),
            height: Math.max(300, Math.min(window.innerHeight - position.y - 20, e.clientY - rect.top))
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, size, position]);

  // Handle maximize/restore
  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore to previous size and position
      setPosition({ x: 16, y: window.innerHeight - 400 });
      setSize({ width: 800, height: 400 });
    } else {
      // Maximize (leave some margin)
      const leftMargin = 272; // Node palette width
      const rightMargin = isNodeEditorOpen ? 336 : 16;
      const topMargin = 80; // Header height
      const bottomMargin = 16;
      
      setPosition({ x: leftMargin, y: topMargin });
      setSize({ 
        width: window.innerWidth - leftMargin - rightMargin,
        height: window.innerHeight - topMargin - bottomMargin
      });
    }
    setIsMaximized(!isMaximized);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setIsDragging(true);
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  if (!execution || execution.status === 'idle') {
    return null;
  }
  
  return (
    <div 
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-50 flex flex-col animate-slideUp"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: '95vw',
        maxHeight: '95vh',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header with drag handle */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-grab active:cursor-grabbing drag-handle rounded-t-lg"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-3 drag-handle pointer-events-none">
          <div className={`flex items-center gap-2 ${
            isExecuting ? 'text-blue-600' : 
            isCompleted ? 'text-green-600' : 
            isFailed ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {isExecuting && <Loader2 size={20} className="animate-spin" />}
            {isCompleted && <CheckCircle size={20} />}
            {isFailed && <XCircle size={20} />}
            {isPaused && <Pause size={20} />}
            <span className="font-semibold">
              {isExecuting ? 'Executing...' : 
               isCompleted ? 'Completed' : 
               isFailed ? 'Failed' : 
               'Paused'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{completedNodes} / {nodes.length} nodes</span>
            {failedNodes > 0 && (
              <span className="text-red-600">{failedNodes} failed</span>
            )}
            <span>{getTotalDuration()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Maximize/Restore Button */}
          <button
            onClick={toggleMaximize}
            className="p-2 hover:bg-white/50 rounded transition"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Control Buttons */}
          {!isExecuting && !isPaused && !isCompleted && !isFailed && (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              <Play size={16} />
              Start
            </button>
          )}

          {isExecuting && (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
            >
              <Pause size={16} />
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              <Play size={16} />
              Resume
            </button>
          )}

          {(isExecuting || isPaused) && (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              <XCircle size={16} />
              Stop
            </button>
          )}

          {(isCompleted || isFailed) && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          )}

          {/* Step Mode Controls */}
          {stepMode && isWaitingForStep && (
            <button
              onClick={onStep}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <StepForward size={16} />
              Step
            </button>
          )}

          {/* View Toggles */}
          <button
            onClick={onToggleStepMode}
            className={`px-3 py-1.5 border rounded-lg transition text-sm ${
              stepMode ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Toggle step-by-step mode"
          >
            <StepForward size={16} className="inline" />
          </button>

          <button
            onClick={() => setShowBreakpoints(!showBreakpoints)}
            className={`px-3 py-1.5 border rounded-lg transition text-sm ${
              showBreakpoints ? 'bg-red-100 border-red-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Breakpoints"
          >
            <Bug size={16} className="inline" />
          </button>

          <button
            onClick={() => setShowVariables(!showVariables)}
            className={`px-3 py-1.5 border rounded-lg transition text-sm ${
              showVariables ? 'bg-purple-100 border-purple-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Variables"
          >
            <Eye size={16} className="inline" />
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 border rounded-lg transition text-sm ${
              showHistory ? 'bg-indigo-100 border-indigo-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
            title="Execution history"
          >
            <History size={16} className="inline" />
          </button>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`px-3 py-1.5 border rounded-lg transition text-sm ${
              showLogs ? 'bg-gray-200 border-gray-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Workflow Input/Output Summary */}
      {(isCompleted || isFailed) && execution.result && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="font-semibold text-base mb-3 text-gray-800 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Workflow Result
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workflow Input */}
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                📥 Input
              </div>
              <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200 max-h-32">
                {JSON.stringify(execution.result.input || {}, null, 2)}
              </pre>
            </div>
            
            {/* Workflow Output */}
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                📤 Output
              </div>
              <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200 max-h-32">
                {JSON.stringify(execution.result.output || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Node Execution Status */}
      <div className="px-6 py-4 border-b border-gray-200 overflow-y-auto overflow-x-hidden flex-shrink-0" style={{ maxHeight: isMaximized ? '30vh' : '250px' }}>
        <h3 className="font-semibold text-sm mb-3 text-gray-700">Node Execution Status (Click to see I/O)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {nodes.map((node) => {
            const status = getNodeStatus(node.id);
            const state = execution.nodeStates[node.id];
            const hasBreakpoint = breakpoints.get(node.id)?.enabled;
            const isCurrent = currentNodeId === node.id;
            
            return (
              <div
                key={node.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md ${getStatusColor(status)} ${
                  isCurrent ? 'ring-2 ring-blue-500 animate-pulse' : ''
                }`}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {hasBreakpoint && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Breakpoint" />
                  )}
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium truncate">
                    {node.data.label || node.id}
                  </span>
                </div>
                {state?.duration && (
                  <span className="text-xs text-gray-500 ml-2">
                    {getNodeDuration(node.id)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Panels Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Breakpoints Panel */}
        {showBreakpoints && (
          <div className="border-b border-gray-200 px-6 py-4 bg-red-50 overflow-y-auto overflow-x-hidden animate-slideDown" style={{ maxHeight: '300px' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Bug size={16} className="text-red-600" />
                Breakpoints ({Array.from(breakpoints.values()).filter(b => b.enabled).length})
              </h3>
              <button
                onClick={onClearAllBreakpoints}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {Array.from(breakpoints.entries()).map(([nodeId, bp]) => {
                const node = nodes.find(n => n.id === nodeId);
                if (!node || !bp.enabled) return null;
                
                return (
                  <div key={nodeId} className="bg-white rounded p-2 border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{node.data.label || nodeId}</span>
                      <button
                        onClick={() => onToggleBreakpoint?.(nodeId)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    {bp.condition && (
                      <div className="text-xs text-gray-600 mt-1 font-mono">
                        Condition: {bp.condition}
                      </div>
                    )}
                  </div>
                );
              })}
              {Array.from(breakpoints.values()).filter(b => b.enabled).length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No breakpoints set. Click on nodes to add breakpoints.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Node I/O Panel */}
        {selectedNode && variables.get(selectedNode) && (
          <div className="border-b border-gray-200 px-6 py-4 bg-blue-50 overflow-y-auto overflow-x-hidden animate-slideDown" style={{ maxHeight: '400px' }}>
            <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
              <Eye size={18} className="text-blue-600" />
              {nodes.find(n => n.id === selectedNode)?.data.label || selectedNode} - Input/Output
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Node Input */}
              {variables.get(selectedNode)?.inputData && (
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="text-sm font-semibold text-blue-700 mb-2">📥 Input:</div>
                  <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {JSON.stringify(variables.get(selectedNode)?.inputData, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Node Output */}
              {variables.get(selectedNode)?.outputData && (
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="text-sm font-semibold text-blue-700 mb-2">📤 Output:</div>
                  <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {JSON.stringify(variables.get(selectedNode)?.outputData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variables Panel (Context Variables) */}
        {showVariables && currentVariables && (
          <div className="border-b border-gray-200 px-6 py-4 bg-purple-50 overflow-y-auto overflow-x-hidden animate-slideDown" style={{ maxHeight: '350px' }}>
            <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
              <Eye size={18} className="text-purple-600" />
              Context Variables at {nodes.find(n => n.id === currentNodeId)?.data.label || currentNodeId}
            </h3>
            <div className="space-y-3">
              {/* Input Data */}
              {currentVariables.inputData && (
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Input Data:</div>
                  <pre className="text-sm font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {JSON.stringify(currentVariables.inputData, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Output Data */}
              {currentVariables.outputData && (
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Output Data:</div>
                  <pre className="text-sm font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {JSON.stringify(currentVariables.outputData, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Context Variables */}
              {Object.keys(currentVariables.variables).length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Context Variables:</div>
                  <pre className="text-sm font-mono text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border border-gray-200">
                    {JSON.stringify(currentVariables.variables, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="border-b border-gray-200 px-6 py-4 bg-indigo-50 overflow-y-auto overflow-x-hidden animate-slideDown" style={{ maxHeight: '300px' }}>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <History size={16} className="text-indigo-600" />
              Execution History ({history.length})
            </h3>
            <div className="space-y-1">
              {history.map((entry, index) => {
                const duration = entry.endTime ? entry.endTime - entry.startTime : 0;
                const isActive = index === currentHistoryIndex;
                
                return (
                  <div
                    key={entry.id}
                    className={`bg-white rounded p-2 border cursor-pointer hover:bg-indigo-50 ${
                      isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-indigo-200'
                    }`}
                    onClick={() => onLoadHistory?.(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {entry.status === 'completed' && <CheckCircle size={14} className="text-green-500" />}
                        {entry.status === 'failed' && <XCircle size={14} className="text-red-500" />}
                        <span className="text-xs font-medium">
                          {new Date(entry.startTime).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {showLogs && execution.logs && execution.logs.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 overflow-y-auto overflow-x-hidden animate-slideDown" style={{ maxHeight: '350px' }}>
            <h3 className="font-semibold text-base mb-3 text-gray-700">Execution Logs</h3>
            <div className="space-y-2">
              {execution.logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono p-2 rounded border ${
                    log.level === 'error' ? 'text-red-700 bg-red-50 border-red-200' :
                    log.level === 'warning' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                    'text-gray-700 bg-white border-gray-200'
                  }`}
                >
                  <span className="text-gray-500 font-semibold">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  {log.nodeId && (
                    <span className="text-blue-600 ml-2 font-semibold">[{log.nodeId}]</span>
                  )}
                  <span className="ml-2">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <div className="absolute bottom-1 right-1 w-4 h-4 border-r-2 border-b-2 border-gray-400 group-hover:border-blue-500 transition" />
      </div>
    </div>
  );
}
