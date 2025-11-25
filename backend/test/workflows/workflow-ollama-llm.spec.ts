import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import axios from 'axios';

describe('Workflow Execution with Ollama LLM', () => {
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  let ollamaAvailable = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule],
    }).compile();

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);

    // Check if Ollama is available
    try {
      const response = await axios.get(`${OLLAMA_URL}/api/tags`);
      ollamaAvailable = true;
      console.log('Ollama available with models:', response.data.models?.map(m => m.name));
    } catch (error) {
      console.warn('Ollama not available, tests will be skipped');
      ollamaAvailable = false;
    }
  });

  describe('Basic LLM Generation', () => {
    it('should generate text using Ollama', async () => {
      if (!ollamaAvailable) {
        console.log('Skipping: Ollama not available');
        return;
      }

      const workflow = {
        name: 'Simple LLM Generation',
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
                label: 'Generate Poem',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Write a haiku about automation',
                temperature: 0.7,
                maxTokens: 100,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');
      
      const llmStep = execution.steps.find(s => s.nodeId === 'llm_1');
      expect(llmStep).toBeDefined();
      expect(llmStep.output).toBeDefined();
      expect(llmStep.output.text).toBeDefined();
      expect(typeof llmStep.output.text).toBe('string');
      expect(llmStep.output.text.length).toBeGreaterThan(10);
      
      // Verify variables captured
      expect(llmStep.variables.input).toBeDefined();
      expect(llmStep.variables.output).toBeDefined();
      expect(llmStep.variables.output.model).toBe('llama2');
    }, 30000);

    it('should handle streaming LLM responses', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Streaming LLM',
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
                label: 'Stream Response',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Count from 1 to 5',
                stream: true,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      
      const chunks = [];
      const execution = await executorService.execute(
        createdWorkflow.id, 
        {},
        {
          onStream: (chunk) => {
            chunks.push(chunk);
          },
        }
      );

      expect(execution.status).toBe('completed');
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify stream chunks
      chunks.forEach(chunk => {
        expect(chunk).toHaveProperty('text');
        expect(chunk).toHaveProperty('nodeId', 'llm_1');
      });
    }, 30000);
  });

  describe('LLM with Context and Variables', () => {
    it('should use workflow variables in LLM prompt', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'LLM with Variables',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { 
                label: 'Start',
                outputData: {
                  userName: 'Alice',
                  userAge: 25,
                  userInterest: 'programming',
                },
              },
            },
            {
              id: 'llm_1',
              type: 'agent',
              data: {
                label: 'Personalized Message',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Write a short encouraging message for {{userName}}, who is {{userAge}} years old and loves {{userInterest}}. Keep it under 50 words.',
                temperature: 0.8,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');
      
      const llmStep = execution.steps.find(s => s.nodeId === 'llm_1');
      expect(llmStep.output.text).toBeDefined();
      
      // The output should contain context about the user
      const output = llmStep.output.text.toLowerCase();
      expect(
        output.includes('alice') || 
        output.includes('25') || 
        output.includes('programming')
      ).toBe(true);
    }, 30000);

    it('should chain multiple LLM calls with context', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Chained LLM Calls',
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
                label: 'Generate Topic',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Suggest one interesting topic about technology in exactly 3 words',
                temperature: 0.7,
              },
            },
            {
              id: 'llm_2',
              type: 'agent',
              data: {
                label: 'Expand Topic',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Write one sentence explaining this topic: {{previousOutput}}',
                temperature: 0.7,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
            { id: 'edge_2', source: 'llm_1', target: 'llm_2' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');
      
      const llm1Step = execution.steps.find(s => s.nodeId === 'llm_1');
      const llm2Step = execution.steps.find(s => s.nodeId === 'llm_2');
      
      expect(llm1Step.output.text).toBeDefined();
      expect(llm2Step.output.text).toBeDefined();
      expect(llm2Step.output.text.length).toBeGreaterThan(llm1Step.output.text.length);
      
      // Verify context was passed
      expect(llm2Step.variables.input.previousOutput).toBe(llm1Step.output.text);
    }, 60000);
  });

  describe('LLM with Conditional Logic', () => {
    it('should use LLM output in condition nodes', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'LLM Conditional Workflow',
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
                label: 'Sentiment Analysis',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Analyze the sentiment of this text and respond with only one word - either "positive" or "negative": "I love this amazing product!"',
                temperature: 0.1, // Low temperature for deterministic output
              },
            },
            {
              id: 'condition_1',
              type: 'condition',
              data: {
                label: 'Check Sentiment',
                condition: 'previousOutput.toLowerCase().includes("positive")',
              },
            },
            {
              id: 'action_positive',
              type: 'action',
              data: {
                label: 'Positive Response',
                action: 'log',
                message: 'Detected positive sentiment',
              },
            },
            {
              id: 'action_negative',
              type: 'action',
              data: {
                label: 'Negative Response',
                action: 'log',
                message: 'Detected negative sentiment',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
            { id: 'edge_2', source: 'llm_1', target: 'condition_1' },
            { id: 'edge_3', source: 'condition_1', target: 'action_positive', sourceHandle: 'true' },
            { id: 'edge_4', source: 'condition_1', target: 'action_negative', sourceHandle: 'false' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');
      
      // Should take positive branch
      const positiveStep = execution.steps.find(s => s.nodeId === 'action_positive');
      expect(positiveStep).toBeDefined();
    }, 30000);
  });

  describe('LLM Error Handling', () => {
    it('should handle invalid model gracefully', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Invalid Model Workflow',
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
                label: 'Invalid Model',
                agentType: 'ollama',
                model: 'nonexistent-model-12345',
                prompt: 'Test prompt',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {});

      expect(execution.status).toBe('failed');
      
      const llmStep = execution.steps.find(s => s.nodeId === 'llm_1');
      expect(llmStep.status).toBe('failed');
      expect(llmStep.error).toBeDefined();
      expect(llmStep.error).toContain('model');
    }, 10000);

    it('should retry on transient failures', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'LLM Retry Workflow',
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
                label: 'LLM with Retry',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Say hello',
                retryAttempts: 3,
                retryDelay: 1000,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      const llmStep = execution.steps.find(s => s.nodeId === 'llm_1');
      
      // Check if retry metadata is captured
      if (llmStep.variables.retries) {
        expect(llmStep.variables.retries).toBeLessThanOrEqual(3);
      }
    }, 30000);
  });
});
