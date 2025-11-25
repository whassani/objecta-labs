import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { ExecutionState, NodeExecutionState, ExecutionLog, WorkflowExecutionHistory } from '@/components/workflows/ExecutionVisualizer';
import { api } from '@/lib/api';

export type ExecutionMode = 'normal' | 'step-by-step' | 'backend';

export interface BreakpointConfig {
  nodeId: string;
  enabled: boolean;
  condition?: string; // Optional condition expression
}

export interface VariableSnapshot {
  nodeId: string;
  timestamp: number;
  variables: Record<string, any>;
  inputData?: any;
  outputData?: any;
}

export function useWorkflowExecution(
  nodes: Node[], 
  edges: Edge[], 
  workflowId?: string,
  mode: ExecutionMode = 'normal'
) {
  const [execution, setExecution] = useState<ExecutionState>({
    status: 'idle',
    nodeStates: {},
    edgeStates: {},
    logs: [],
  });

  const [breakpoints, setBreakpoints] = useState<Map<string, BreakpointConfig>>(new Map());
  const [variables, setVariables] = useState<Map<string, VariableSnapshot>>(new Map());
  const [history, setHistory] = useState<WorkflowExecutionHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  const executionRef = useRef<{
    isPaused: boolean;
    isStopped: boolean;
    stepMode: boolean;
    waitingForStep: boolean;
    backendExecutionId?: string;
    websocket?: WebSocket;
    pollInterval?: NodeJS.Timeout;
  }>({ 
    isPaused: false, 
    isStopped: false,
    stepMode: mode === 'step-by-step',
    waitingForStep: false,
  });

  const addLog = useCallback((message: string, nodeId?: string, level: 'info' | 'warning' | 'error' = 'info') => {
    setExecution((prev) => ({
      ...prev,
      logs: [...prev.logs, { timestamp: Date.now(), message, nodeId, level }],
    }));
  }, []);

  // Breakpoint management
  const toggleBreakpoint = useCallback((nodeId: string, enabled?: boolean) => {
    setBreakpoints((prev) => {
      const newBreakpoints = new Map(prev);
      const existing = newBreakpoints.get(nodeId);
      if (existing) {
        newBreakpoints.set(nodeId, { ...existing, enabled: enabled ?? !existing.enabled });
      } else {
        newBreakpoints.set(nodeId, { nodeId, enabled: enabled ?? true });
      }
      return newBreakpoints;
    });
  }, []);

  const setBreakpointCondition = useCallback((nodeId: string, condition?: string) => {
    setBreakpoints((prev) => {
      const newBreakpoints = new Map(prev);
      const existing = newBreakpoints.get(nodeId);
      if (existing) {
        newBreakpoints.set(nodeId, { ...existing, condition });
      }
      return newBreakpoints;
    });
  }, []);

  const clearAllBreakpoints = useCallback(() => {
    setBreakpoints(new Map());
  }, []);

  // Variable inspection
  const captureVariables = useCallback((nodeId: string, inputData?: any, outputData?: any, contextVars?: Record<string, any>) => {
    const snapshot: VariableSnapshot = {
      nodeId,
      timestamp: Date.now(),
      variables: contextVars || {},
      inputData,
      outputData,
    };
    setVariables((prev) => {
      const newVars = new Map(prev);
      newVars.set(nodeId, snapshot);
      return newVars;
    });
  }, []);

  // Step execution control
  const executeStep = useCallback(() => {
    executionRef.current.waitingForStep = false;
  }, []);

  // History management
  const saveExecutionToHistory = useCallback((executionState: ExecutionState) => {
    const historyEntry: WorkflowExecutionHistory = {
      id: `exec-${Date.now()}`,
      workflowId: workflowId || 'unknown',
      startTime: executionState.startTime || Date.now(),
      endTime: executionState.endTime,
      status: executionState.status,
      nodeStates: executionState.nodeStates,
      logs: executionState.logs,
      variables: Object.fromEntries(variables),
    };
    
    setHistory((prev) => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50
    setCurrentHistoryIndex(0);
  }, [workflowId, variables]);

  const loadHistoryEntry = useCallback((index: number) => {
    const entry = history[index];
    if (!entry) return;

    setCurrentHistoryIndex(index);
    setExecution({
      status: entry.status,
      nodeStates: entry.nodeStates,
      edgeStates: {},
      logs: entry.logs,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });

    if (entry.variables) {
      setVariables(new Map(Object.entries(entry.variables)));
    }
  }, [history]);

  const updateNodeState = useCallback((nodeId: string, updates: Partial<NodeExecutionState>) => {
    setExecution((prev) => ({
      ...prev,
      nodeStates: {
        ...prev.nodeStates,
        [nodeId]: {
          ...prev.nodeStates[nodeId],
          nodeId,
          ...updates,
        } as NodeExecutionState,
      },
    }));
  }, []);

  const activateEdge = useCallback((edgeId: string, active: boolean) => {
    setExecution((prev) => ({
      ...prev,
      edgeStates: {
        ...prev.edgeStates,
        [edgeId]: { edgeId, active },
      },
    }));
  }, []);

  // WebSocket connection for real-time backend updates
  const connectWebSocket = useCallback((executionId: string) => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/workflows/executions/${executionId}/stream`);

    ws.onopen = () => {
      addLog('Connected to execution stream', undefined, 'info');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'node-start') {
          updateNodeState(data.nodeId, { status: 'running', startTime: data.timestamp });
          addLog(`Node started: ${data.nodeId}`, data.nodeId);
        } else if (data.type === 'node-complete') {
          updateNodeState(data.nodeId, { 
            status: 'completed', 
            endTime: data.timestamp,
            duration: data.duration,
            output: data.output,
          });
          captureVariables(data.nodeId, data.input, data.output, data.variables);
          addLog(`Node completed: ${data.nodeId}`, data.nodeId);
        } else if (data.type === 'node-error') {
          updateNodeState(data.nodeId, { 
            status: 'failed', 
            endTime: data.timestamp,
            error: data.error,
          });
          addLog(`Node failed: ${data.error}`, data.nodeId, 'error');
        } else if (data.type === 'edge-activate') {
          activateEdge(data.edgeId, true);
        } else if (data.type === 'execution-complete') {
          setExecution((prev) => ({ 
            ...prev, 
            status: 'completed',
            endTime: data.timestamp,
          }));
          addLog('Workflow completed successfully');
        } else if (data.type === 'execution-failed') {
          setExecution((prev) => ({ 
            ...prev, 
            status: 'failed',
            endTime: data.timestamp,
          }));
          addLog('Workflow execution failed', undefined, 'error');
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      addLog('WebSocket error', undefined, 'error');
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      addLog('Execution stream closed', undefined, 'info');
    };

    executionRef.current.websocket = ws;
    return ws;
  }, [addLog, updateNodeState, activateEdge, captureVariables]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const executeNode = async (node: Node, contextVars: Record<string, any> = {}): Promise<boolean> => {
    // Check for breakpoint
    const breakpoint = breakpoints.get(node.id);
    if (breakpoint?.enabled) {
      let shouldBreak = true;
      
      // Evaluate condition if present
      if (breakpoint.condition) {
        try {
          // Simple condition evaluation (in production, use a safe evaluator)
          shouldBreak = eval(breakpoint.condition);
        } catch (error) {
          addLog(`Breakpoint condition error: ${error}`, node.id, 'warning');
        }
      }

      if (shouldBreak) {
        addLog(`Breakpoint hit at node: ${node.data.label || node.id}`, node.id, 'warning');
        executionRef.current.isPaused = true;
        setExecution((prev) => ({ ...prev, status: 'paused', currentNode: node.id }));
        
        // Wait for user to resume
        while (executionRef.current.isPaused && !executionRef.current.isStopped) {
          await sleep(100);
        }
      }
    }

    // Step-by-step mode: wait for user action
    if (executionRef.current.stepMode) {
      executionRef.current.waitingForStep = true;
      setExecution((prev) => ({ ...prev, currentNode: node.id }));
      addLog(`Waiting for step: ${node.data.label || node.id}`, node.id, 'info');
      
      while (executionRef.current.waitingForStep && !executionRef.current.isStopped) {
        await sleep(100);
      }
    }

    // Check if paused or stopped
    while (executionRef.current.isPaused && !executionRef.current.isStopped) {
      await sleep(100);
    }

    if (executionRef.current.isStopped) {
      return false;
    }

    const startTime = Date.now();
    updateNodeState(node.id, { status: 'running', startTime });
    addLog(`Executing node: ${node.data.label || node.id}`, node.id);

    // Capture input variables
    captureVariables(node.id, node.data, undefined, contextVars);

    try {
      // Simulate execution based on node type
      let duration = 1000; // Default 1 second

      if (node.type === 'control-delay') {
        // Delay node - use configured duration
        const delayDuration = node.data.duration || 5;
        const unit = node.data.unit || 'seconds';
        const multipliers: Record<string, number> = {
          seconds: 1000,
          minutes: 60000,
          hours: 3600000,
          days: 86400000,
        };
        const multiplier = multipliers[unit] || 1000;
        
        duration = delayDuration * multiplier;
        addLog(`Delaying for ${delayDuration} ${unit}`, node.id);
      } else if (node.type === 'control-loop') {
        // Loop node - simulate iterations
        const items = node.data.items;
        const count = node.data.count || 3;
        addLog(`Starting loop (${count} iterations)`, node.id);
        duration = 500 * count; // 500ms per iteration
      } else if (node.type === 'trigger') {
        duration = 500; // Triggers are fast
      } else if (node.type === 'action') {
        duration = 1500; // Actions take longer
      } else if (node.type === 'condition') {
        duration = 300; // Conditions are quick
      }

      // Simulate work
      await sleep(duration);

      // Check if stopped during execution
      if (executionRef.current.isStopped) {
        updateNodeState(node.id, { 
          status: 'failed', 
          endTime: Date.now(), 
          duration: Date.now() - startTime,
          error: 'Execution stopped by user'
        });
        return false;
      }

      const endTime = Date.now();
      const output = { success: true, data: node.data }; // Simulated output
      
      updateNodeState(node.id, { 
        status: 'completed', 
        endTime, 
        duration: endTime - startTime,
        output,
      });
      
      // Capture output variables
      captureVariables(node.id, node.data, output, { ...contextVars, lastNodeOutput: output });
      
      addLog(`Completed: ${node.data.label || node.id} (${endTime - startTime}ms)`, node.id);
      
      return true;
    } catch (error) {
      const endTime = Date.now();
      updateNodeState(node.id, { 
        status: 'failed', 
        endTime, 
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      addLog(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, node.id, 'error');
      return false;
    }
  };

  const findNextNodes = useCallback((currentNodeId: string): Node[] => {
    // Find all edges coming out of current node
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId);
    
    // Find connected nodes
    const nextNodes: Node[] = [];
    outgoingEdges.forEach((edge) => {
      const nextNode = nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        nextNodes.push(nextNode);
        // Activate edge animation
        activateEdge(edge.id, true);
      }
    });

    return nextNodes;
  }, [nodes, edges, activateEdge]);

  const executeWorkflow = async () => {
    executionRef.current = { 
      isPaused: false, 
      isStopped: false,
      stepMode: mode === 'step-by-step',
      waitingForStep: false,
    };
    
    const startTime = Date.now();
    setExecution({
      status: 'running',
      currentNode: undefined,
      nodeStates: {},
      edgeStates: {},
      startTime,
      logs: [],
    });

    // Clear previous variable snapshots
    setVariables(new Map());

    addLog('Starting workflow execution');

    // Backend mode: delegate to backend
    if (mode === 'backend' && workflowId) {
      try {
        const response = await api.post(`/workflows/${workflowId}/execute`, {
          triggerData: {},
          context: {},
        });
        
        const executionId = response.data.id; // Backend returns { id, status, ... }
        executionRef.current.backendExecutionId = executionId;
        
        addLog(`Backend execution started: ${executionId}`);
        
        // Connect WebSocket for real-time updates
        connectWebSocket(executionId);
        
        // Fallback: Poll for execution status since WebSocket might not be fully implemented
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/workflows/executions/${executionId}`);
            const executionData = statusResponse.data;
            
            addLog(`Execution status: ${executionData.status}`);
            
            if (executionData.status === 'completed' || executionData.status === 'failed') {
              clearInterval(pollInterval);
              
              setExecution((prev) => ({
                ...prev,
                status: executionData.status,
                endTime: Date.now(),
              }));
              
              addLog(`Workflow ${executionData.status}`, undefined, executionData.status === 'completed' ? 'info' : 'error');
            }
          } catch (error) {
            console.error('Failed to poll execution status:', error);
          }
        }, 2000); // Poll every 2 seconds
        
        // Store interval ID for cleanup
        executionRef.current.pollInterval = pollInterval;
        
        return;
      } catch (error) {
        addLog(`Backend execution failed: ${error}`, undefined, 'error');
        setExecution((prev) => ({ 
          ...prev, 
          status: 'failed', 
          endTime: Date.now() 
        }));
        return;
      }
    }

    // Find trigger nodes (entry points)
    const triggerNodes = nodes.filter((n) => n.type === 'trigger');
    
    if (triggerNodes.length === 0) {
      addLog('No trigger nodes found', undefined, 'error');
      setExecution((prev) => ({ 
        ...prev, 
        status: 'failed', 
        endTime: Date.now() 
      }));
      return;
    }

    // Execute workflow starting from trigger nodes
    const queue: Node[] = [...triggerNodes];
    const executed = new Set<string>();

    while (queue.length > 0 && !executionRef.current.isStopped) {
      const currentNode = queue.shift()!;
      
      // Skip if already executed
      if (executed.has(currentNode.id)) {
        continue;
      }

      setExecution((prev) => ({ ...prev, currentNode: currentNode.id }));

      // Execute current node
      const success = await executeNode(currentNode);
      executed.add(currentNode.id);

      if (!success) {
        // Node failed, stop execution
        addLog('Workflow execution failed', currentNode.id, 'error');
        setExecution((prev) => ({ 
          ...prev, 
          status: 'failed', 
          endTime: Date.now() 
        }));
        return;
      }

      // Find and queue next nodes
      const nextNodes = findNextNodes(currentNode.id);
      
      // Handle special control flow nodes
      if (currentNode.type === 'condition') {
        // Condition node - simulate branching
        // In real implementation, evaluate condition and take one path
        const takeTrue = Math.random() > 0.5; // Random for simulation
        const branch = takeTrue ? 'true' : 'false';
        addLog(`Condition evaluated to: ${branch}`, currentNode.id);
        
        // Only add nodes from the taken branch
        const branchNodes = nextNodes.filter((node) => {
          const edge = edges.find((e) => e.source === currentNode.id && e.target === node.id);
          return edge?.sourceHandle === branch;
        });
        queue.push(...branchNodes);
      } else if (currentNode.type === 'control-loop') {
        // Loop node - execute loop body multiple times
        const count = currentNode.data.count || 3;
        const loopBodyEdge = edges.find((e) => e.source === currentNode.id && e.sourceHandle === 'loop-body');
        
        if (loopBodyEdge) {
          const loopBodyNode = nodes.find((n) => n.id === loopBodyEdge.target);
          if (loopBodyNode) {
            for (let i = 0; i < count; i++) {
              if (executionRef.current.isStopped) break;
              
              addLog(`Loop iteration ${i + 1} of ${count}`, currentNode.id);
              updateNodeState(currentNode.id, { iteration: i + 1 });
              
              // Execute loop body
              await executeNode(loopBodyNode);
              
              // Small delay between iterations
              await sleep(200);
            }
          }
        }
        
        // After loop completes, continue with 'complete' edge
        const completeEdge = edges.find((e) => e.source === currentNode.id && e.sourceHandle === 'complete');
        if (completeEdge) {
          const nextNode = nodes.find((n) => n.id === completeEdge.target);
          if (nextNode) {
            queue.push(nextNode);
          }
        }
      } else if (currentNode.type === 'control-merge') {
        // Merge node - wait for all inputs (simplified for demo)
        queue.push(...nextNodes);
      } else {
        // Regular node - continue to all next nodes
        queue.push(...nextNodes);
      }

      // Small delay between nodes for visualization
      await sleep(300);
    }

    const endTime = Date.now();
    
    if (executionRef.current.isStopped) {
      addLog('Workflow execution stopped by user', undefined, 'warning');
      const finalState = { 
        ...execution, 
        status: 'failed' as const, 
        endTime 
      };
      setExecution((prev) => ({ 
        ...prev, 
        status: 'failed', 
        endTime 
      }));
      saveExecutionToHistory(finalState);
    } else {
      addLog(`Workflow completed successfully in ${endTime - startTime}ms`);
      const finalState = {
        ...execution,
        status: 'completed' as const,
        endTime,
        currentNode: undefined,
      };
      setExecution((prev) => ({ 
        ...prev, 
        status: 'completed', 
        endTime,
        currentNode: undefined,
      }));
      saveExecutionToHistory(finalState);
    }
  };

  const start = useCallback(() => {
    executeWorkflow();
  }, [nodes, edges]);

  const pause = useCallback(() => {
    executionRef.current.isPaused = true;
    setExecution((prev) => ({ ...prev, status: 'paused' }));
    addLog('Execution paused');
  }, []);

  const resume = useCallback(() => {
    executionRef.current.isPaused = false;
    setExecution((prev) => ({ ...prev, status: 'running' }));
    addLog('Execution resumed');
  }, []);

  const stop = useCallback(() => {
    executionRef.current.isStopped = true;
    executionRef.current.isPaused = false;
    executionRef.current.waitingForStep = false;
    
    // Close WebSocket if connected
    if (executionRef.current.websocket) {
      executionRef.current.websocket.close();
      executionRef.current.websocket = undefined;
    }

    // Stop backend execution if running
    if (mode === 'backend' && executionRef.current.backendExecutionId) {
      api.post(`/workflows/executions/${executionRef.current.backendExecutionId}/stop`)
        .catch((error) => console.error('Failed to stop backend execution:', error));
    }

    setExecution((prev) => ({ 
      ...prev, 
      status: 'failed',
      endTime: Date.now(),
    }));
    addLog('Execution stopped', undefined, 'warning');
  }, [mode]);

  const reset = useCallback(() => {
    executionRef.current = { 
      isPaused: false, 
      isStopped: false,
      stepMode: mode === 'step-by-step',
      waitingForStep: false,
    };
    
    // Close WebSocket if connected
    if (executionRef.current.websocket) {
      executionRef.current.websocket.close();
      executionRef.current.websocket = undefined;
    }
    
    // Clear polling interval
    if (executionRef.current.pollInterval) {
      clearInterval(executionRef.current.pollInterval);
      executionRef.current.pollInterval = undefined;
    }

    setExecution({
      status: 'idle',
      nodeStates: {},
      edgeStates: {},
      logs: [],
    });
    setVariables(new Map());
    setCurrentHistoryIndex(-1);
  }, [mode]);

  const toggleStepMode = useCallback(() => {
    executionRef.current.stepMode = !executionRef.current.stepMode;
    addLog(`Step mode ${executionRef.current.stepMode ? 'enabled' : 'disabled'}`);
  }, [addLog]);

  return {
    execution,
    breakpoints,
    variables,
    history,
    currentHistoryIndex,
    
    // Execution controls
    start,
    pause,
    resume,
    stop,
    reset,
    
    // Step debugging
    executeStep,
    toggleStepMode,
    
    // Breakpoints
    toggleBreakpoint,
    setBreakpointCondition,
    clearAllBreakpoints,
    
    // History
    loadHistoryEntry,
  };
}
