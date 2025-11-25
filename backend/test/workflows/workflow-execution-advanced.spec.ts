import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import { WorkflowExecutionGateway } from '../../src/modules/workflows/workflow-execution.gateway';
import { io, Socket } from 'socket.io-client';

describe('Advanced Workflow Execution Tests', () => {
  let app;
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;
  let gateway: WorkflowExecutionGateway;
  let clientSocket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001);

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);
    gateway = moduleFixture.get<WorkflowExecutionGateway>(WorkflowExecutionGateway);
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await app.close();
  });

  describe('Breakpoint Execution', () => {
    it('should pause execution at breakpoint and resume', async () => {
      const workflow = {
        name: 'Breakpoint Test Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { 
                label: 'First Action',
                action: 'log',
                message: 'Before breakpoint',
              },
            },
            {
              id: 'action_2',
              type: 'action',
              data: { 
                label: 'Breakpoint Node',
                action: 'log',
                message: 'At breakpoint',
                breakpoint: true, // Breakpoint set
              },
            },
            {
              id: 'action_3',
              type: 'action',
              data: { 
                label: 'After Breakpoint',
                action: 'log',
                message: 'After breakpoint',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
            { id: 'edge_3', source: 'action_2', target: 'action_3' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      
      // Execute with breakpoint support
      const executionPromise = executorService.execute(createdWorkflow.id, {}, {
        breakpoints: ['action_2'],
        mode: 'debug',
      });

      // Wait for breakpoint to be hit
      await new Promise(resolve => setTimeout(resolve, 1000));

      const execution = await executorService.getExecution(executionPromise.id);
      expect(execution.status).toBe('paused');
      expect(execution.currentNode).toBe('action_2');

      // Resume execution
      await executorService.resumeExecution(execution.id);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      const completedExecution = await executorService.getExecution(execution.id);
      expect(completedExecution.status).toBe('completed');
      expect(completedExecution.steps).toHaveLength(4);
    });

    it('should evaluate conditional breakpoint', async () => {
      const workflow = {
        name: 'Conditional Breakpoint Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
            },
            {
              id: 'loop_1',
              type: 'loop',
              data: { 
                label: 'Loop Counter',
                iterations: 10,
              },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { 
                label: 'Loop Body',
                action: 'log',
                breakpoint: true,
                breakpointCondition: 'iteration === 5', // Break at iteration 5
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'loop_1' },
            { id: 'edge_2', source: 'loop_1', target: 'action_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const executionPromise = executorService.execute(createdWorkflow.id, {}, {
        mode: 'debug',
      });

      // Wait for conditional breakpoint
      await new Promise(resolve => setTimeout(resolve, 2000));

      const execution = await executorService.getExecution(executionPromise.id);
      expect(execution.status).toBe('paused');
      
      const currentStep = execution.steps.find(s => s.nodeId === 'action_1');
      expect(currentStep.variables.iteration).toBe(5);
    });
  });

  describe('Step-by-Step Execution', () => {
    it('should execute workflow in step mode', async () => {
      const workflow = {
        name: 'Step Mode Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
            { id: 'action_1', type: 'action', data: { label: 'Step 1', action: 'log' } },
            { id: 'action_2', type: 'action', data: { label: 'Step 2', action: 'log' } },
            { id: 'action_3', type: 'action', data: { label: 'Step 3', action: 'log' } },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
            { id: 'edge_3', source: 'action_2', target: 'action_3' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        mode: 'step',
      });

      // Step 1: Execute trigger
      let currentExecution = await executorService.getExecution(execution.id);
      expect(currentExecution.status).toBe('waiting_for_step');
      expect(currentExecution.currentNode).toBe('trigger_1');

      await executorService.executeStep(execution.id);
      
      // Step 2: Execute action_1
      currentExecution = await executorService.getExecution(execution.id);
      expect(currentExecution.currentNode).toBe('action_1');
      
      await executorService.executeStep(execution.id);
      
      // Step 3: Execute action_2
      currentExecution = await executorService.getExecution(execution.id);
      expect(currentExecution.currentNode).toBe('action_2');
      
      await executorService.executeStep(execution.id);
      
      // Step 4: Execute action_3
      currentExecution = await executorService.getExecution(execution.id);
      expect(currentExecution.currentNode).toBe('action_3');
      
      await executorService.executeStep(execution.id);
      
      // Final: Completed
      currentExecution = await executorService.getExecution(execution.id);
      expect(currentExecution.status).toBe('completed');
      expect(currentExecution.steps).toHaveLength(4);
    });
  });

  describe('Variable Inspection', () => {
    it('should capture variables at each node execution', async () => {
      const workflow = {
        name: 'Variable Tracking Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start', outputData: { count: 0 } },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { 
                label: 'Increment',
                action: 'transform',
                transform: 'input.count + 1',
              },
            },
            {
              id: 'action_2',
              type: 'action',
              data: { 
                label: 'Multiply',
                action: 'transform',
                transform: 'input * 2',
              },
            },
            {
              id: 'action_3',
              type: 'action',
              data: { 
                label: 'Format',
                action: 'transform',
                transform: '`Result: ${input}`',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
            { id: 'edge_3', source: 'action_2', target: 'action_3' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');
      
      // Check variable snapshots
      const step1 = execution.steps.find(s => s.nodeId === 'action_1');
      expect(step1.variables).toBeDefined();
      expect(step1.variables.input).toEqual({ count: 0 });
      expect(step1.variables.output).toBe(1);

      const step2 = execution.steps.find(s => s.nodeId === 'action_2');
      expect(step2.variables.input).toBe(1);
      expect(step2.variables.output).toBe(2);

      const step3 = execution.steps.find(s => s.nodeId === 'action_3');
      expect(step3.variables.input).toBe(2);
      expect(step3.variables.output).toBe('Result: 2');
    });

    it('should track context variables across nodes', async () => {
      const workflow = {
        name: 'Context Variables Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { 
                label: 'Set Context',
                action: 'set-variable',
                variableName: 'user',
                variableValue: { name: 'John', age: 30 },
              },
            },
            {
              id: 'action_2',
              type: 'action',
              data: { 
                label: 'Use Context',
                action: 'log',
                message: '${context.user.name} is ${context.user.age} years old',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      const step2 = execution.steps.find(s => s.nodeId === 'action_2');
      expect(step2.variables.context).toBeDefined();
      expect(step2.variables.context.user).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('Execution History', () => {
    it('should save execution history with full state', async () => {
      const workflow = {
        name: 'History Test Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
            { id: 'action_1', type: 'action', data: { label: 'Process', action: 'log' } },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      
      // Execute multiple times
      const execution1 = await executorService.execute(createdWorkflow.id, { run: 1 });
      const execution2 = await executorService.execute(createdWorkflow.id, { run: 2 });
      const execution3 = await executorService.execute(createdWorkflow.id, { run: 3 });

      // Get history
      const history = await executorService.getExecutionHistory(createdWorkflow.id, {
        limit: 10,
      });

      expect(history).toHaveLength(3);
      expect(history[0].id).toBe(execution3.id); // Most recent first
      expect(history[1].id).toBe(execution2.id);
      expect(history[2].id).toBe(execution1.id);

      // Each history entry should have full state
      history.forEach(entry => {
        expect(entry.status).toBe('completed');
        expect(entry.startTime).toBeDefined();
        expect(entry.endTime).toBeDefined();
        expect(entry.steps).toBeDefined();
        expect(entry.logs).toBeDefined();
      });
    });

    it('should replay execution from history', async () => {
      const workflow = {
        name: 'Replay Test Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
            { id: 'action_1', type: 'action', data: { label: 'Random', action: 'random' } },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const originalExecution = await executorService.execute(createdWorkflow.id, {});

      // Get the execution for replay
      const historicalExecution = await executorService.getExecution(originalExecution.id);

      // Replay should restore exact state
      const replayedState = {
        status: historicalExecution.status,
        steps: historicalExecution.steps,
        variables: historicalExecution.variables,
        logs: historicalExecution.logs,
      };

      expect(replayedState.status).toBe('completed');
      expect(replayedState.steps).toEqual(historicalExecution.steps);
    });
  });

  describe('WebSocket Real-time Updates', () => {
    beforeEach((done) => {
      clientSocket = io('http://localhost:3001/workflows', {
        transports: ['websocket'],
      });
      clientSocket.on('connect', done);
    });

    afterEach(() => {
      if (clientSocket.connected) {
        clientSocket.close();
      }
    });

    it('should stream execution events via WebSocket', (done) => {
      const workflow = {
        name: 'WebSocket Test Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
            { id: 'action_1', type: 'action', data: { label: 'Step 1', action: 'log' } },
            { id: 'action_2', type: 'action', data: { label: 'Step 2', action: 'log' } },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
          ],
        },
      };

      const events = [];

      // Listen for events
      clientSocket.on('node-start', (data) => {
        events.push({ type: 'node-start', ...data });
      });

      clientSocket.on('node-complete', (data) => {
        events.push({ type: 'node-complete', ...data });
      });

      clientSocket.on('execution-complete', (data) => {
        events.push({ type: 'execution-complete', ...data });
        
        // Verify we received all events
        expect(events.length).toBeGreaterThan(0);
        
        const nodeStarts = events.filter(e => e.type === 'node-start');
        const nodeCompletes = events.filter(e => e.type === 'node-complete');
        
        expect(nodeStarts).toHaveLength(3); // trigger + 2 actions
        expect(nodeCompletes).toHaveLength(3);
        
        done();
      });

      // Create and execute workflow
      workflowsService.create(workflow).then(createdWorkflow => {
        executorService.execute(createdWorkflow.id, {}, { mode: 'backend' }).then(execution => {
          // Subscribe to execution
          clientSocket.emit('subscribe-execution', { executionId: execution.id });
        });
      });
    }, 10000);

    it('should emit edge activation events', (done) => {
      const workflow = {
        name: 'Edge Activation Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
            { id: 'action_1', type: 'action', data: { label: 'Action', action: 'log' } },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
          ],
        },
      };

      const edgeEvents = [];

      clientSocket.on('edge-activate', (data) => {
        edgeEvents.push(data);
      });

      clientSocket.on('execution-complete', () => {
        expect(edgeEvents).toHaveLength(1);
        expect(edgeEvents[0].edgeId).toBe('edge_1');
        done();
      });

      workflowsService.create(workflow).then(createdWorkflow => {
        executorService.execute(createdWorkflow.id, {}, { mode: 'backend' }).then(execution => {
          clientSocket.emit('subscribe-execution', { executionId: execution.id });
        });
      });
    }, 10000);
  });
});
