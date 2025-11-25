import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import { KnowledgeBaseModule } from '../../src/modules/knowledge-base/knowledge-base.module';
import { VectorStoreService } from '../../src/modules/knowledge-base/vector-store.service';
import axios from 'axios';

describe('End-to-End Workflow Scenarios', () => {
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;
  let vectorStoreService: VectorStoreService;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  let ollamaAvailable = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule, KnowledgeBaseModule],
    }).compile();

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);
    vectorStoreService = moduleFixture.get<VectorStoreService>(VectorStoreService);

    try {
      await axios.get(`${OLLAMA_URL}/api/tags`);
      ollamaAvailable = true;
    } catch (error) {
      console.warn('Ollama not available');
      ollamaAvailable = false;
    }
  });

  describe('Scenario 1: Customer Support Ticket Analysis', () => {
    it('should analyze support ticket with sentiment, categorization, and response', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Support Ticket Analysis',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Incoming Ticket',
                outputData: {
                  ticketId: 'TICKET-12345',
                  customer: 'John Doe',
                  subject: 'Login issues',
                  message: 'I cannot login to my account. I keep getting error messages. This is very frustrating!',
                },
              },
            },
            // Sentiment Analysis
            {
              id: 'llm_sentiment',
              type: 'agent',
              data: {
                label: 'Analyze Sentiment',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Analyze the sentiment of this customer message and respond with only one word: positive, negative, or neutral.\n\nMessage: {{message}}',
                temperature: 0.1,
              },
            },
            // Categorization
            {
              id: 'llm_category',
              type: 'agent',
              data: {
                label: 'Categorize Issue',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Categorize this support ticket into one of: Technical, Billing, Account, or General.\n\nSubject: {{subject}}\nMessage: {{message}}',
                temperature: 0.1,
              },
            },
            // Priority Check
            {
              id: 'condition_priority',
              type: 'condition',
              data: {
                label: 'Check Priority',
                condition: 'sentiment.toLowerCase().includes("negative")',
              },
            },
            // High Priority Path
            {
              id: 'action_high_priority',
              type: 'action',
              data: {
                label: 'Mark High Priority',
                action: 'set-variable',
                variableName: 'priority',
                variableValue: 'high',
              },
            },
            // Normal Priority Path
            {
              id: 'action_normal_priority',
              type: 'action',
              data: {
                label: 'Mark Normal Priority',
                action: 'set-variable',
                variableName: 'priority',
                variableValue: 'normal',
              },
            },
            // Merge paths
            {
              id: 'merge_1',
              type: 'merge',
              data: { label: 'Merge Priority Paths' },
            },
            // Search Knowledge Base
            {
              id: 'embed_query',
              type: 'tool',
              data: {
                label: 'Embed Query',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{subject}} {{message}}',
              },
            },
            {
              id: 'search_kb',
              type: 'action',
              data: {
                label: 'Search KB',
                action: 'vector-search',
                collection: 'support-kb',
                topK: 3,
              },
            },
            // Generate Response
            {
              id: 'llm_response',
              type: 'agent',
              data: {
                label: 'Generate Response',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'You are a helpful customer support agent. Based on this knowledge base context:\n{{kbContext}}\n\nGenerate a professional response to this customer:\nSubject: {{subject}}\nMessage: {{message}}\n\nPriority: {{priority}}\nCategory: {{category}}\n\nProvide a helpful, empathetic response.',
                temperature: 0.7,
              },
            },
            // Log Result
            {
              id: 'action_log',
              type: 'action',
              data: {
                label: 'Log Analysis',
                action: 'log',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_sentiment' },
            { id: 'edge_2', source: 'trigger_1', target: 'llm_category' },
            { id: 'edge_3', source: 'llm_sentiment', target: 'condition_priority' },
            { id: 'edge_4', source: 'condition_priority', target: 'action_high_priority', sourceHandle: 'true' },
            { id: 'edge_5', source: 'condition_priority', target: 'action_normal_priority', sourceHandle: 'false' },
            { id: 'edge_6', source: 'action_high_priority', target: 'merge_1' },
            { id: 'edge_7', source: 'action_normal_priority', target: 'merge_1' },
            { id: 'edge_8', source: 'merge_1', target: 'embed_query' },
            { id: 'edge_9', source: 'embed_query', target: 'search_kb' },
            { id: 'edge_10', source: 'search_kb', target: 'llm_response' },
            { id: 'edge_11', source: 'llm_response', target: 'action_log' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
        mode: 'debug',
      });

      expect(execution.status).toBe('completed');

      // Verify sentiment analysis
      const sentimentStep = execution.steps.find(s => s.nodeId === 'llm_sentiment');
      expect(sentimentStep.output.text.toLowerCase()).toContain('negative');

      // Verify categorization
      const categoryStep = execution.steps.find(s => s.nodeId === 'llm_category');
      expect(categoryStep.output.text.toLowerCase()).toMatch(/technical|account/);

      // Verify high priority path was taken
      const highPriorityStep = execution.steps.find(s => s.nodeId === 'action_high_priority');
      expect(highPriorityStep).toBeDefined();

      // Verify response generation
      const responseStep = execution.steps.find(s => s.nodeId === 'llm_response');
      expect(responseStep.output.text).toBeDefined();
      expect(responseStep.output.text.length).toBeGreaterThan(50);
    }, 180000);
  });

  describe('Scenario 2: Content Generation Pipeline', () => {
    it('should generate, review, and optimize content', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Content Generation Pipeline',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  topic: 'Benefits of workflow automation',
                  targetAudience: 'business managers',
                  tone: 'professional',
                },
              },
            },
            // Generate outline
            {
              id: 'llm_outline',
              type: 'agent',
              data: {
                label: 'Generate Outline',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Create a brief outline for an article about: {{topic}}\nTarget audience: {{targetAudience}}\nTone: {{tone}}\n\nProvide 3-4 main points.',
                temperature: 0.8,
              },
            },
            // Generate full content
            {
              id: 'llm_content',
              type: 'agent',
              data: {
                label: 'Generate Content',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Based on this outline:\n{{outline}}\n\nWrite a short article (100-150 words) about {{topic}} for {{targetAudience}} in a {{tone}} tone.',
                temperature: 0.7,
              },
            },
            // Quality check
            {
              id: 'llm_review',
              type: 'agent',
              data: {
                label: 'Review Content',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Review this content and rate it from 1-10 for quality, relevance, and tone. Respond with just the number.\n\nContent: {{content}}',
                temperature: 0.1,
              },
            },
            // Check if revision needed
            {
              id: 'condition_quality',
              type: 'condition',
              data: {
                label: 'Quality Check',
                condition: 'parseInt(review) >= 7',
              },
            },
            // Approved path
            {
              id: 'action_approved',
              type: 'action',
              data: {
                label: 'Mark Approved',
                action: 'set-variable',
                variableName: 'status',
                variableValue: 'approved',
              },
            },
            // Revision path
            {
              id: 'llm_revise',
              type: 'agent',
              data: {
                label: 'Revise Content',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Improve this content to make it more engaging and professional:\n\n{{content}}\n\nProvide the revised version.',
                temperature: 0.7,
              },
            },
            // Generate SEO keywords
            {
              id: 'llm_seo',
              type: 'agent',
              data: {
                label: 'Generate SEO Keywords',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Generate 5 SEO keywords for this content:\n{{finalContent}}\n\nList them separated by commas.',
                temperature: 0.5,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_outline' },
            { id: 'edge_2', source: 'llm_outline', target: 'llm_content' },
            { id: 'edge_3', source: 'llm_content', target: 'llm_review' },
            { id: 'edge_4', source: 'llm_review', target: 'condition_quality' },
            { id: 'edge_5', source: 'condition_quality', target: 'action_approved', sourceHandle: 'true' },
            { id: 'edge_6', source: 'condition_quality', target: 'llm_revise', sourceHandle: 'false' },
            { id: 'edge_7', source: 'action_approved', target: 'llm_seo' },
            { id: 'edge_8', source: 'llm_revise', target: 'llm_seo' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Verify outline generated
      const outlineStep = execution.steps.find(s => s.nodeId === 'llm_outline');
      expect(outlineStep.output.text).toBeDefined();
      expect(outlineStep.output.text.length).toBeGreaterThan(50);

      // Verify content generated
      const contentStep = execution.steps.find(s => s.nodeId === 'llm_content');
      expect(contentStep.output.text).toBeDefined();
      expect(contentStep.output.text.length).toBeGreaterThan(100);

      // Verify quality review
      const reviewStep = execution.steps.find(s => s.nodeId === 'llm_review');
      expect(reviewStep.output.text).toMatch(/\d+/);

      // Verify SEO keywords generated
      const seoStep = execution.steps.find(s => s.nodeId === 'llm_seo');
      expect(seoStep.output.text).toBeDefined();
      expect(seoStep.output.text).toMatch(/,/); // Should have comma-separated keywords
    }, 240000);
  });

  describe('Scenario 3: Data Processing with Loop and Aggregation', () => {
    it('should process multiple items with AI analysis and aggregate results', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Batch Data Processing',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  reviews: [
                    'This product is amazing! Best purchase ever.',
                    'Terrible quality. Would not recommend.',
                    'Pretty good but could be better.',
                    'Exceeded my expectations. Very satisfied!',
                    'Not worth the price. Disappointed.',
                  ],
                },
              },
            },
            // Initialize aggregation
            {
              id: 'action_init',
              type: 'action',
              data: {
                label: 'Initialize Results',
                action: 'set-variable',
                variableName: 'results',
                variableValue: [],
              },
            },
            // Loop through reviews
            {
              id: 'loop_1',
              type: 'loop',
              data: {
                label: 'Process Each Review',
                iterateOver: '{{reviews}}',
              },
            },
            // Analyze sentiment
            {
              id: 'llm_sentiment',
              type: 'agent',
              data: {
                label: 'Analyze Sentiment',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Analyze the sentiment of this review and respond with only: positive, negative, or neutral.\n\nReview: {{currentItem}}',
                temperature: 0.1,
              },
            },
            // Extract rating
            {
              id: 'llm_rating',
              type: 'agent',
              data: {
                label: 'Predict Rating',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Based on this review, predict a rating from 1-5 (just the number):\n\n{{currentItem}}',
                temperature: 0.1,
              },
            },
            // Store result
            {
              id: 'action_store',
              type: 'action',
              data: {
                label: 'Store Result',
                action: 'append-to-array',
                arrayName: 'results',
                value: {
                  review: '{{currentItem}}',
                  sentiment: '{{sentiment}}',
                  rating: '{{rating}}',
                },
              },
            },
            // Aggregate results
            {
              id: 'action_aggregate',
              type: 'action',
              data: {
                label: 'Calculate Statistics',
                action: 'aggregate',
                operations: [
                  'count',
                  'averageRating',
                  'sentimentBreakdown',
                ],
              },
            },
            // Generate summary
            {
              id: 'llm_summary',
              type: 'agent',
              data: {
                label: 'Generate Summary',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Summarize these review analytics in 2-3 sentences:\n\nTotal Reviews: {{totalCount}}\nAverage Rating: {{averageRating}}\nPositive: {{positiveCount}}\nNegative: {{negativeCount}}\nNeutral: {{neutralCount}}',
                temperature: 0.7,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'action_init' },
            { id: 'edge_2', source: 'action_init', target: 'loop_1' },
            { id: 'edge_3', source: 'loop_1', target: 'llm_sentiment' },
            { id: 'edge_4', source: 'llm_sentiment', target: 'llm_rating' },
            { id: 'edge_5', source: 'llm_rating', target: 'action_store' },
            { id: 'edge_6', source: 'action_store', target: 'loop_1', type: 'loop-back' },
            { id: 'edge_7', source: 'loop_1', target: 'action_aggregate', type: 'loop-exit' },
            { id: 'edge_8', source: 'action_aggregate', target: 'llm_summary' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Verify loop executed 5 times
      const sentimentSteps = execution.steps.filter(s => s.nodeId === 'llm_sentiment');
      expect(sentimentSteps.length).toBe(5);

      // Verify aggregation
      const aggregateStep = execution.steps.find(s => s.nodeId === 'action_aggregate');
      expect(aggregateStep.output.totalCount).toBe(5);
      expect(aggregateStep.output.averageRating).toBeDefined();
      expect(aggregateStep.output.positiveCount).toBeGreaterThan(0);
      expect(aggregateStep.output.negativeCount).toBeGreaterThan(0);

      // Verify summary
      const summaryStep = execution.steps.find(s => s.nodeId === 'llm_summary');
      expect(summaryStep.output.text).toBeDefined();
      expect(summaryStep.output.text.length).toBeGreaterThan(30);
    }, 300000);
  });

  describe('Scenario 4: Document Intelligence with RAG', () => {
    it('should process document, extract info, embed, and answer questions', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Document Intelligence',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'New Document',
                outputData: {
                  document: `
                    Product Launch Report - Q4 2024
                    
                    Our new AI-powered workflow automation platform launched successfully in October 2024.
                    Key metrics:
                    - 500+ beta users signed up in first month
                    - 85% user satisfaction rating
                    - Average time saved per user: 4 hours/week
                    - Revenue: $50,000 in first month
                    
                    Top features used:
                    1. Visual workflow builder
                    2. AI agent integration
                    3. Real-time collaboration
                    
                    Customer feedback highlights automation potential and ease of use.
                  `,
                },
              },
            },
            // Extract key information
            {
              id: 'llm_extract',
              type: 'agent',
              data: {
                label: 'Extract Key Info',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Extract key information from this document in structured format:\n\n{{document}}\n\nProvide: Product name, Launch date, Key metrics, Top features',
                temperature: 0.1,
              },
            },
            // Generate embedding
            {
              id: 'embed_doc',
              type: 'tool',
              data: {
                label: 'Embed Document',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{document}}',
              },
            },
            // Store in vector DB
            {
              id: 'action_store',
              type: 'action',
              data: {
                label: 'Store in Vector DB',
                action: 'store-vector',
                collection: 'documents',
                metadata: {
                  type: 'product-report',
                  extractedInfo: '{{extractedInfo}}',
                },
              },
            },
            // Simulate user questions
            {
              id: 'action_questions',
              type: 'action',
              data: {
                label: 'Prepare Questions',
                action: 'set-variable',
                variableName: 'questions',
                variableValue: [
                  'What was the user satisfaction rating?',
                  'How much revenue was generated?',
                  'What are the top features?',
                ],
              },
            },
            // Loop through questions
            {
              id: 'loop_questions',
              type: 'loop',
              data: {
                label: 'Answer Questions',
                iterateOver: '{{questions}}',
              },
            },
            // RAG query
            {
              id: 'embed_question',
              type: 'tool',
              data: {
                label: 'Embed Question',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{currentItem}}',
              },
            },
            {
              id: 'search_doc',
              type: 'action',
              data: {
                label: 'Search Document',
                action: 'vector-search',
                collection: 'documents',
                topK: 1,
              },
            },
            {
              id: 'llm_answer',
              type: 'agent',
              data: {
                label: 'Generate Answer',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Based on this context:\n{{context}}\n\nAnswer this question concisely: {{currentItem}}',
                temperature: 0.3,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'llm_extract' },
            { id: 'edge_2', source: 'trigger_1', target: 'embed_doc' },
            { id: 'edge_3', source: 'embed_doc', target: 'action_store' },
            { id: 'edge_4', source: 'action_store', target: 'action_questions' },
            { id: 'edge_5', source: 'action_questions', target: 'loop_questions' },
            { id: 'edge_6', source: 'loop_questions', target: 'embed_question' },
            { id: 'edge_7', source: 'embed_question', target: 'search_doc' },
            { id: 'edge_8', source: 'search_doc', target: 'llm_answer' },
            { id: 'edge_9', source: 'llm_answer', target: 'loop_questions', type: 'loop-back' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Verify extraction
      const extractStep = execution.steps.find(s => s.nodeId === 'llm_extract');
      expect(extractStep.output.text).toBeDefined();
      expect(extractStep.output.text.toLowerCase()).toContain('85%');

      // Verify embedding stored
      const storeStep = execution.steps.find(s => s.nodeId === 'action_store');
      expect(storeStep.output.stored).toBe(true);

      // Verify all questions answered
      const answerSteps = execution.steps.filter(s => s.nodeId === 'llm_answer');
      expect(answerSteps.length).toBe(3);

      answerSteps.forEach(step => {
        expect(step.output.text).toBeDefined();
        expect(step.output.text.length).toBeGreaterThan(5);
      });
    }, 300000);
  });

  describe('Scenario 5: Multi-Agent Collaboration', () => {
    it('should coordinate multiple AI agents for complex task', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Multi-Agent Task',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  task: 'Create a marketing campaign for our new product',
                },
              },
            },
            // Planner agent
            {
              id: 'agent_planner',
              type: 'agent',
              data: {
                label: 'Planner Agent',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'You are a strategic planner. Create a brief plan for this task: {{task}}\n\nProvide 3 main steps.',
                temperature: 0.7,
              },
            },
            // Creative agent
            {
              id: 'agent_creative',
              type: 'agent',
              data: {
                label: 'Creative Agent',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'You are a creative marketer. Based on this plan:\n{{plan}}\n\nGenerate 3 creative campaign ideas in one short paragraph.',
                temperature: 0.9,
              },
            },
            // Analyst agent
            {
              id: 'agent_analyst',
              type: 'agent',
              data: {
                label: 'Analyst Agent',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'You are a business analyst. Review these campaign ideas:\n{{ideas}}\n\nRate each idea 1-10 for feasibility (just provide the ratings).',
                temperature: 0.1,
              },
            },
            // Synthesizer agent
            {
              id: 'agent_synthesizer',
              type: 'agent',
              data: {
                label: 'Synthesizer Agent',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Synthesize the work from multiple agents:\n\nPlan: {{plan}}\nIdeas: {{ideas}}\nAnalysis: {{analysis}}\n\nProvide a final recommendation in 2-3 sentences.',
                temperature: 0.5,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'agent_planner' },
            { id: 'edge_2', source: 'agent_planner', target: 'agent_creative' },
            { id: 'edge_3', source: 'agent_creative', target: 'agent_analyst' },
            { id: 'edge_4', source: 'agent_analyst', target: 'agent_synthesizer' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Verify all agents executed
      const plannerStep = execution.steps.find(s => s.nodeId === 'agent_planner');
      const creativeStep = execution.steps.find(s => s.nodeId === 'agent_creative');
      const analystStep = execution.steps.find(s => s.nodeId === 'agent_analyst');
      const synthesizerStep = execution.steps.find(s => s.nodeId === 'agent_synthesizer');

      expect(plannerStep.output.text).toBeDefined();
      expect(creativeStep.output.text).toBeDefined();
      expect(analystStep.output.text).toBeDefined();
      expect(synthesizerStep.output.text).toBeDefined();

      // Verify context passed between agents
      expect(creativeStep.variables.input.plan).toBe(plannerStep.output.text);
      expect(analystStep.variables.input.ideas).toBe(creativeStep.output.text);
      expect(synthesizerStep.variables.input.analysis).toBe(analystStep.output.text);
    }, 180000);
  });
});
