import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import { WorkflowExecution } from '../../src/modules/workflows/entities/workflow-execution.entity';
import { WorkflowExecutionStep } from '../../src/modules/workflows/entities/workflow-execution-step.entity';
import { Workflow } from '../../src/modules/workflows/entities/workflow.entity';
import { TriggerNodeExecutor } from '../../src/modules/workflows/executors/trigger-node.executor';
import { HttpNodeExecutor } from '../../src/modules/workflows/executors/http-node.executor';
import { ConditionNodeExecutor } from '../../src/modules/workflows/executors/condition-node.executor';
import { DelayNodeExecutor } from '../../src/modules/workflows/executors/delay-node.executor';
import { AgentNodeExecutor } from '../../src/modules/workflows/executors/agent-node.executor';
import { ToolNodeExecutor } from '../../src/modules/workflows/executors/tool-node.executor';
import { EmailNodeExecutor } from '../../src/modules/workflows/executors/email-node.executor';
import { LoopNodeExecutor } from '../../src/modules/workflows/executors/loop-node.executor';
import { MergeNodeExecutor } from '../../src/modules/workflows/executors/merge-node.executor';

describe('WorkflowExecutorService - Parallel Execution', () => {
  let service: WorkflowExecutorService;
  let executionRepository: Repository<WorkflowExecution>;
  let stepRepository: Repository<WorkflowExecutionStep>;
  let workflowsService: WorkflowsService;
  let httpNodeExecutor: HttpNodeExecutor;

  const mockWorkflowsService = {
    findOne: jest.fn(),
    updateExecutionStats: jest.fn(),
  };

  const mockExecutionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockStepRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockHttpNodeExecutor = {
    execute: jest.fn(),
  };

  const mockTriggerNodeExecutor = {
    execute: jest.fn(),
  };

  const mockConditionNodeExecutor = {
    execute: jest.fn(),
  };

  const mockDelayNodeExecutor = {
    execute: jest.fn(),
  };

  const mockAgentNodeExecutor = {
    execute: jest.fn(),
  };

  const mockToolNodeExecutor = {
    execute: jest.fn(),
  };

  const mockEmailNodeExecutor = {
    execute: jest.fn(),
  };

  const mockLoopNodeExecutor = {
    execute: jest.fn(),
  };

  const mockMergeNodeExecutor = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutorService,
        {
          provide: getRepositoryToken(WorkflowExecution),
          useValue: mockExecutionRepository,
        },
        {
          provide: getRepositoryToken(WorkflowExecutionStep),
          useValue: mockStepRepository,
        },
        {
          provide: WorkflowsService,
          useValue: mockWorkflowsService,
        },
        {
          provide: TriggerNodeExecutor,
          useValue: mockTriggerNodeExecutor,
        },
        {
          provide: HttpNodeExecutor,
          useValue: mockHttpNodeExecutor,
        },
        {
          provide: ConditionNodeExecutor,
          useValue: mockConditionNodeExecutor,
        },
        {
          provide: DelayNodeExecutor,
          useValue: mockDelayNodeExecutor,
        },
        {
          provide: AgentNodeExecutor,
          useValue: mockAgentNodeExecutor,
        },
        {
          provide: ToolNodeExecutor,
          useValue: mockToolNodeExecutor,
        },
        {
          provide: EmailNodeExecutor,
          useValue: mockEmailNodeExecutor,
        },
        {
          provide: LoopNodeExecutor,
          useValue: mockLoopNodeExecutor,
        },
        {
          provide: MergeNodeExecutor,
          useValue: mockMergeNodeExecutor,
        },
      ],
    }).compile();

    service = module.get<WorkflowExecutorService>(WorkflowExecutorService);
    executionRepository = module.get(getRepositoryToken(WorkflowExecution));
    stepRepository = module.get(getRepositoryToken(WorkflowExecutionStep));
    workflowsService = module.get<WorkflowsService>(WorkflowsService);
    httpNodeExecutor = module.get<HttpNodeExecutor>(HttpNodeExecutor);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Parallel Branch Execution', () => {
    it('should execute parallel branches concurrently', async () => {
      const workflowId = 'test-workflow-id';
      const organizationId = 'test-org-id';
      const executionId = 'test-execution-id';

      // Create a workflow with parallel branches
      const workflow: Partial<Workflow> = {
        id: workflowId,
        organizationId,
        version: 1,
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger-manual',
              data: { label: 'Manual Trigger' },
              position: { x: 0, y: 0 },
            },
            {
              id: 'http-1',
              type: 'action',
              data: { label: 'HTTP Call 1', actionType: 'http' },
              position: { x: 200, y: 0 },
            },
            {
              id: 'http-2',
              type: 'action',
              data: { label: 'HTTP Call 2', actionType: 'http' },
              position: { x: 200, y: 100 },
            },
            {
              id: 'http-3',
              type: 'action',
              data: { label: 'HTTP Call 3', actionType: 'http' },
              position: { x: 200, y: 200 },
            },
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'http-1' },
            { id: 'e2', source: 'trigger-1', target: 'http-2' },
            { id: 'e3', source: 'trigger-1', target: 'http-3' },
          ],
        },
      };

      // Mock repository responses
      mockWorkflowsService.findOne.mockResolvedValue({
        id: workflowId,
        name: 'Test Workflow',
        version: 1,
      });

      mockExecutionRepository.manager.findOne.mockResolvedValue(workflow);

      mockExecutionRepository.create.mockReturnValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      mockExecutionRepository.save.mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      let stepIdCounter = 1;
      mockStepRepository.create.mockImplementation((data) => ({
        id: `step-${stepIdCounter++}`,
        ...data,
      }));

      mockStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      mockStepRepository.update.mockResolvedValue({ affected: 1 });
      mockExecutionRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkflowsService.updateExecutionStats.mockResolvedValue(undefined);

      // Track execution times for each HTTP node
      const executionTimes: Record<string, { start: number; end: number }> = {};

      mockTriggerNodeExecutor.execute.mockResolvedValue({
        success: true,
        data: { triggered: true },
      });

      // Mock HTTP executor with delays to simulate real work
      mockHttpNodeExecutor.execute.mockImplementation(async (node) => {
        executionTimes[node.id] = { start: Date.now(), end: 0 };
        
        // Simulate 100ms delay for each HTTP call
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        executionTimes[node.id].end = Date.now();
        
        return {
          success: true,
          data: { response: `Response from ${node.id}` },
        };
      });

      // Execute workflow
      await service.executeWorkflow(workflowId, organizationId, {
        triggerData: {},
        context: {},
      });

      // Wait for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify all HTTP nodes were executed
      expect(mockHttpNodeExecutor.execute).toHaveBeenCalledTimes(3);

      // Check that nodes were called with correct data
      const httpCalls = mockHttpNodeExecutor.execute.mock.calls;
      expect(httpCalls[0][0].id).toBe('http-1');
      expect(httpCalls[1][0].id).toBe('http-2');
      expect(httpCalls[2][0].id).toBe('http-3');

      // Verify parallel execution: all should start roughly at the same time
      const startTimes = Object.values(executionTimes).map((t) => t.start);
      const maxStartTimeDiff = Math.max(...startTimes) - Math.min(...startTimes);
      
      // All should start within 50ms of each other (parallel execution)
      expect(maxStartTimeDiff).toBeLessThan(50);

      // Verify execution completed
      expect(mockExecutionRepository.update).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          status: 'completed',
        }),
      );
    });

    it('should demonstrate performance benefit of parallel execution', async () => {
      const workflowId = 'test-workflow-id';
      const organizationId = 'test-org-id';
      const executionId = 'test-execution-id';

      // Create a workflow with 5 parallel branches, each taking 200ms
      const workflow: Partial<Workflow> = {
        id: workflowId,
        organizationId,
        version: 1,
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger-manual',
              data: { label: 'Manual Trigger' },
              position: { x: 0, y: 0 },
            },
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `http-${i + 1}`,
              type: 'action',
              data: { label: `HTTP Call ${i + 1}`, actionType: 'http' },
              position: { x: 200, y: i * 100 },
            })),
          ],
          edges: Array.from({ length: 5 }, (_, i) => ({
            id: `e${i + 1}`,
            source: 'trigger-1',
            target: `http-${i + 1}`,
          })),
        },
      };

      // Mock setup
      mockWorkflowsService.findOne.mockResolvedValue({
        id: workflowId,
        name: 'Test Workflow',
        version: 1,
      });

      mockExecutionRepository.manager.findOne.mockResolvedValue(workflow);
      mockExecutionRepository.create.mockReturnValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      mockExecutionRepository.save.mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      let stepIdCounter = 1;
      mockStepRepository.create.mockImplementation((data) => ({
        id: `step-${stepIdCounter++}`,
        ...data,
      }));

      mockStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      mockStepRepository.update.mockResolvedValue({ affected: 1 });
      mockExecutionRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkflowsService.updateExecutionStats.mockResolvedValue(undefined);

      mockTriggerNodeExecutor.execute.mockResolvedValue({
        success: true,
        data: { triggered: true },
      });

      // Each HTTP call takes 200ms
      mockHttpNodeExecutor.execute.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          success: true,
          data: { response: 'OK' },
        };
      });

      const startTime = Date.now();

      // Execute workflow
      await service.executeWorkflow(workflowId, organizationId, {
        triggerData: {},
        context: {},
      });

      // Wait for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 600));

      const totalDuration = Date.now() - startTime;

      // With parallel execution:
      // - Sequential would take: 5 * 200ms = 1000ms
      // - Parallel should take: ~200ms (all run concurrently)
      // Allow some overhead for setup and teardown
      expect(totalDuration).toBeLessThan(800); // Should be much less than 1000ms

      expect(mockHttpNodeExecutor.execute).toHaveBeenCalledTimes(5);
    });

    it('should handle errors in parallel branches without blocking other branches', async () => {
      const workflowId = 'test-workflow-id';
      const organizationId = 'test-org-id';
      const executionId = 'test-execution-id';

      const workflow: Partial<Workflow> = {
        id: workflowId,
        organizationId,
        version: 1,
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger-manual',
              data: { label: 'Manual Trigger' },
              position: { x: 0, y: 0 },
            },
            {
              id: 'http-1',
              type: 'action',
              data: { label: 'HTTP Call 1', actionType: 'http' },
              position: { x: 200, y: 0 },
            },
            {
              id: 'http-2',
              type: 'action',
              data: { label: 'HTTP Call 2 (Will Fail)', actionType: 'http' },
              position: { x: 200, y: 100 },
            },
            {
              id: 'http-3',
              type: 'action',
              data: { label: 'HTTP Call 3', actionType: 'http' },
              position: { x: 200, y: 200 },
            },
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'http-1' },
            { id: 'e2', source: 'trigger-1', target: 'http-2' },
            { id: 'e3', source: 'trigger-1', target: 'http-3' },
          ],
        },
      };

      // Mock setup
      mockWorkflowsService.findOne.mockResolvedValue({
        id: workflowId,
        name: 'Test Workflow',
        version: 1,
      });

      mockExecutionRepository.manager.findOne.mockResolvedValue(workflow);
      mockExecutionRepository.create.mockReturnValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      mockExecutionRepository.save.mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      let stepIdCounter = 1;
      mockStepRepository.create.mockImplementation((data) => ({
        id: `step-${stepIdCounter++}`,
        ...data,
      }));

      mockStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      mockStepRepository.update.mockResolvedValue({ affected: 1 });
      mockExecutionRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkflowsService.updateExecutionStats.mockResolvedValue(undefined);

      mockTriggerNodeExecutor.execute.mockResolvedValue({
        success: true,
        data: { triggered: true },
      });

      const executedNodes: string[] = [];

      // http-2 will fail, others will succeed
      mockHttpNodeExecutor.execute.mockImplementation(async (node) => {
        executedNodes.push(node.id);
        
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        if (node.id === 'http-2') {
          throw new Error('HTTP request failed');
        }
        
        return {
          success: true,
          data: { response: `Response from ${node.id}` },
        };
      });

      // Execute workflow
      await service.executeWorkflow(workflowId, organizationId, {
        triggerData: {},
        context: {},
      });

      // Wait for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify all nodes were attempted (parallel execution doesn't stop on first error)
      expect(mockHttpNodeExecutor.execute).toHaveBeenCalledTimes(3);
      expect(executedNodes).toContain('http-1');
      expect(executedNodes).toContain('http-2');
      expect(executedNodes).toContain('http-3');

      // Workflow should fail due to the error in one branch
      expect(mockExecutionRepository.update).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });

    it('should handle condition nodes with parallel branches', async () => {
      const workflowId = 'test-workflow-id';
      const organizationId = 'test-org-id';
      const executionId = 'test-execution-id';

      // Workflow: trigger -> condition -> (true branch: 2 parallel nodes) / (false branch: 1 node)
      const workflow: Partial<Workflow> = {
        id: workflowId,
        organizationId,
        version: 1,
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger-manual',
              data: { label: 'Manual Trigger' },
              position: { x: 0, y: 0 },
            },
            {
              id: 'condition-1',
              type: 'condition',
              data: { label: 'Check Condition', controlType: 'condition' },
              position: { x: 200, y: 0 },
            },
            {
              id: 'http-1',
              type: 'action',
              data: { label: 'True Branch 1', actionType: 'http' },
              position: { x: 400, y: 0 },
            },
            {
              id: 'http-2',
              type: 'action',
              data: { label: 'True Branch 2', actionType: 'http' },
              position: { x: 400, y: 100 },
            },
            {
              id: 'http-3',
              type: 'action',
              data: { label: 'False Branch', actionType: 'http' },
              position: { x: 400, y: 200 },
            },
          ],
          edges: [
            { id: 'e1', source: 'trigger-1', target: 'condition-1' },
            { id: 'e2', source: 'condition-1', target: 'http-1', sourceHandle: 'true' },
            { id: 'e3', source: 'condition-1', target: 'http-2', sourceHandle: 'true' },
            { id: 'e4', source: 'condition-1', target: 'http-3', sourceHandle: 'false' },
          ],
        },
      };

      // Mock setup
      mockWorkflowsService.findOne.mockResolvedValue({
        id: workflowId,
        name: 'Test Workflow',
        version: 1,
      });

      mockExecutionRepository.manager.findOne.mockResolvedValue(workflow);
      mockExecutionRepository.create.mockReturnValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      mockExecutionRepository.save.mockResolvedValue({
        id: executionId,
        workflowId,
        status: 'running',
      });

      let stepIdCounter = 1;
      mockStepRepository.create.mockImplementation((data) => ({
        id: `step-${stepIdCounter++}`,
        ...data,
      }));

      mockStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      mockStepRepository.update.mockResolvedValue({ affected: 1 });
      mockExecutionRepository.update.mockResolvedValue({ affected: 1 });
      mockWorkflowsService.updateExecutionStats.mockResolvedValue(undefined);

      mockTriggerNodeExecutor.execute.mockResolvedValue({
        success: true,
        data: { triggered: true },
      });

      // Condition evaluates to true
      mockConditionNodeExecutor.execute.mockResolvedValue({
        success: true,
        result: true,
        nextNodeId: 'true',
      });

      const executedNodes: string[] = [];
      const executionTimes: Record<string, { start: number; end: number }> = {};

      mockHttpNodeExecutor.execute.mockImplementation(async (node) => {
        executedNodes.push(node.id);
        executionTimes[node.id] = { start: Date.now(), end: 0 };
        
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        executionTimes[node.id].end = Date.now();
        
        return {
          success: true,
          data: { response: `Response from ${node.id}` },
        };
      });

      // Execute workflow
      await service.executeWorkflow(workflowId, organizationId, {
        triggerData: {},
        context: {},
      });

      // Wait for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Only true branch nodes should execute (http-1 and http-2)
      expect(mockHttpNodeExecutor.execute).toHaveBeenCalledTimes(2);
      expect(executedNodes).toContain('http-1');
      expect(executedNodes).toContain('http-2');
      expect(executedNodes).not.toContain('http-3');

      // Both true branch nodes should execute in parallel
      const startTimes = [
        executionTimes['http-1'].start,
        executionTimes['http-2'].start,
      ];
      const maxStartTimeDiff = Math.max(...startTimes) - Math.min(...startTimes);
      
      expect(maxStartTimeDiff).toBeLessThan(50);
    });
  });
});
