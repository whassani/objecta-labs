import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import { WorkflowExecutionGateway } from '../../src/modules/workflows/workflow-execution.gateway';

describe('Workflow Execution Integration Tests', () => {
  let app: INestApplication;
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;
  let gateway: WorkflowExecutionGateway;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);
    gateway = moduleFixture.get<WorkflowExecutionGateway>(WorkflowExecutionGateway);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic Workflow Execution', () => {
    it('should execute a simple linear workflow', async () => {
      const workflow = {
        name: 'Simple Linear Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
              position: { x: 0, y: 0 },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { label: 'Process Data', action: 'http', url: 'https://api.example.com/data' },
              position: { x: 200, y: 0 },
            },
            {
              id: 'action_2',
              type: 'action',
              data: { label: 'Complete', action: 'log', message: 'Done' },
              position: { x: 400, y: 0 },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
            { id: 'edge_2', source: 'action_1', target: 'action_2' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {});

      expect(execution).toBeDefined();
      expect(execution.status).toBe('completed');
      expect(execution.steps).toHaveLength(3);
    });

    it('should execute a workflow with branching conditions', async () => {
      const workflow = {
        name: 'Branching Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
              position: { x: 0, y: 0 },
            },
            {
              id: 'condition_1',
              type: 'condition',
              data: { 
                label: 'Check Value',
                condition: 'input.value > 100',
              },
              position: { x: 200, y: 0 },
            },
            {
              id: 'action_true',
              type: 'action',
              data: { label: 'High Value', action: 'log' },
              position: { x: 400, y: -50 },
            },
            {
              id: 'action_false',
              type: 'action',
              data: { label: 'Low Value', action: 'log' },
              position: { x: 400, y: 50 },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'condition_1' },
            { id: 'edge_2', source: 'condition_1', target: 'action_true', sourceHandle: 'true' },
            { id: 'edge_3', source: 'condition_1', target: 'action_false', sourceHandle: 'false' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, { value: 150 });

      expect(execution.status).toBe('completed');
      expect(execution.steps.find(s => s.nodeId === 'action_true')).toBeDefined();
      expect(execution.steps.find(s => s.nodeId === 'action_false')).toBeUndefined();
    });
  });
});
