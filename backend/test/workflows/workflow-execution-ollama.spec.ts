import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import axios from 'axios';

describe('Workflow Execution with Ollama Integration', () => {
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule],
    }).compile();

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);

    // Verify Ollama is running
    try {
      await axios.get(`${OLLAMA_URL}/api/tags`);
    } catch (error) {
      console.warn('Ollama not available, some tests may be skipped');
    }
  });

  describe('LLM-Powered Workflows', () => {
    it('should execute workflow with Ollama LLM node', async () => {
      const workflow = {
        name: 'LLM Text Generation Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start' },
            },
            {
              id: 'llm_1',
              type: 'agent',
              data: {
                label: 'Generate Text',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Write a short poem about workflow automation',
                temperature: 0.7,
              },
            },
            {
              id: 'action_1',
              type: 'action',
              data: { label: 'Log Result', action: 'log' },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
            { id: 'edge_2', source: 'llm_1', target: 'action_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {});

      expect(execution.status).toBe('completed');
      const llmStep = execution.steps.find(s => s.nodeId === 'llm_1');
      expect(llmStep).toBeDefined();
      expect(llmStep.output).toBeDefined();
      expect(typeof llmStep.output.text).toBe('string');
      expect(llmStep.output.text.length).toBeGreaterThan(0);
    });
  });
});
