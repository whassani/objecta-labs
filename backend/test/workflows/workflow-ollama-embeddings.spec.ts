import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsModule } from '../../src/modules/workflows/workflows.module';
import { WorkflowExecutorService } from '../../src/modules/workflows/workflow-executor.service';
import { WorkflowsService } from '../../src/modules/workflows/workflows.service';
import { KnowledgeBaseModule } from '../../src/modules/knowledge-base/knowledge-base.module';
import { VectorStoreService } from '../../src/modules/knowledge-base/vector-store.service';
import axios from 'axios';

describe('Workflow Execution with Ollama Embeddings', () => {
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

    // Check Ollama availability
    try {
      await axios.get(`${OLLAMA_URL}/api/tags`);
      ollamaAvailable = true;
    } catch (error) {
      console.warn('Ollama not available, embedding tests will be skipped');
      ollamaAvailable = false;
    }
  });

  describe('Document Embedding Workflow', () => {
    it('should embed documents using Ollama', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Document Embedding Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  documents: [
                    { id: 'doc1', text: 'Artificial intelligence is transforming technology' },
                    { id: 'doc2', text: 'Machine learning algorithms process large datasets' },
                    { id: 'doc3', text: 'Neural networks mimic human brain structure' },
                  ],
                },
              },
            },
            {
              id: 'embed_1',
              type: 'tool',
              data: {
                label: 'Generate Embeddings',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                batchSize: 10,
              },
            },
            {
              id: 'store_1',
              type: 'action',
              data: {
                label: 'Store in Vector DB',
                action: 'store-vectors',
                collection: 'test-documents',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'embed_1' },
            { id: 'edge_2', source: 'embed_1', target: 'store_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      const embedStep = execution.steps.find(s => s.nodeId === 'embed_1');
      expect(embedStep).toBeDefined();
      expect(embedStep.output.embeddings).toBeDefined();
      expect(embedStep.output.embeddings).toHaveLength(3);

      // Verify embedding dimensions
      embedStep.output.embeddings.forEach(embedding => {
        expect(embedding.vector).toBeDefined();
        expect(Array.isArray(embedding.vector)).toBe(true);
        expect(embedding.vector.length).toBeGreaterThan(0);
        expect(embedding.documentId).toBeDefined();
      });

      const storeStep = execution.steps.find(s => s.nodeId === 'store_1');
      expect(storeStep.output.stored).toBe(3);
    }, 60000);

    it('should handle large batch embeddings', async () => {
      if (!ollamaAvailable) return;

      const documents = Array.from({ length: 50 }, (_, i) => ({
        id: `doc_${i}`,
        text: `This is test document number ${i} about various topics in technology and science.`,
      }));

      const workflow = {
        name: 'Batch Embedding Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: { label: 'Start', outputData: { documents } },
            },
            {
              id: 'embed_1',
              type: 'tool',
              data: {
                label: 'Batch Embed',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                batchSize: 10,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'embed_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      const embedStep = execution.steps.find(s => s.nodeId === 'embed_1');
      expect(embedStep.output.embeddings).toHaveLength(50);
      expect(embedStep.variables.batchesProcessed).toBe(5); // 50 docs / 10 batch size
    }, 120000);
  });

  describe('Semantic Search Workflow', () => {
    beforeEach(async () => {
      if (!ollamaAvailable) return;

      // Seed some test documents
      const documents = [
        { id: 'doc1', text: 'Python is a popular programming language for data science and machine learning' },
        { id: 'doc2', text: 'JavaScript is widely used for web development and frontend applications' },
        { id: 'doc3', text: 'Rust provides memory safety without garbage collection' },
        { id: 'doc4', text: 'Deep learning models require significant computational resources' },
        { id: 'doc5', text: 'Cloud computing enables scalable infrastructure for applications' },
      ];

      for (const doc of documents) {
        const embedding = await vectorStoreService.generateEmbedding(doc.text, {
          provider: 'ollama',
          model: 'nomic-embed-text',
        });
        await vectorStoreService.storeVector({
          collection: 'test-search',
          documentId: doc.id,
          vector: embedding,
          metadata: { text: doc.text },
        });
      }
    });

    it('should perform semantic search using embeddings', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Semantic Search Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: { query: 'programming languages' },
              },
            },
            {
              id: 'embed_query',
              type: 'tool',
              data: {
                label: 'Embed Query',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{query}}',
              },
            },
            {
              id: 'search_1',
              type: 'action',
              data: {
                label: 'Vector Search',
                action: 'vector-search',
                collection: 'test-search',
                topK: 3,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'embed_query' },
            { id: 'edge_2', source: 'embed_query', target: 'search_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      const searchStep = execution.steps.find(s => s.nodeId === 'search_1');
      expect(searchStep.output.results).toBeDefined();
      expect(searchStep.output.results).toHaveLength(3);

      // Verify results contain programming-related documents
      const topResult = searchStep.output.results[0];
      expect(topResult.score).toBeGreaterThan(0.5);
      expect(
        topResult.metadata.text.toLowerCase().includes('python') ||
        topResult.metadata.text.toLowerCase().includes('javascript') ||
        topResult.metadata.text.toLowerCase().includes('rust')
      ).toBe(true);
    }, 60000);
  });

  describe('RAG (Retrieval Augmented Generation) Workflow', () => {
    beforeEach(async () => {
      if (!ollamaAvailable) return;

      // Seed knowledge base
      const knowledgeBase = [
        'Workflow automation allows businesses to streamline repetitive tasks and increase efficiency.',
        'Artificial intelligence can analyze patterns in data to make predictions and recommendations.',
        'Cloud computing provides on-demand access to computing resources over the internet.',
        'DevOps practices combine software development and IT operations for faster delivery.',
        'Microservices architecture breaks applications into small, independent services.',
      ];

      for (let i = 0; i < knowledgeBase.length; i++) {
        const embedding = await vectorStoreService.generateEmbedding(knowledgeBase[i], {
          provider: 'ollama',
          model: 'nomic-embed-text',
        });
        await vectorStoreService.storeVector({
          collection: 'rag-knowledge',
          documentId: `kb_${i}`,
          vector: embedding,
          metadata: { text: knowledgeBase[i] },
        });
      }
    });

    it('should perform RAG query with retrieval and generation', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'RAG Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: { question: 'What are the benefits of workflow automation?' },
              },
            },
            {
              id: 'embed_query',
              type: 'tool',
              data: {
                label: 'Embed Question',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{question}}',
              },
            },
            {
              id: 'retrieve_1',
              type: 'action',
              data: {
                label: 'Retrieve Context',
                action: 'vector-search',
                collection: 'rag-knowledge',
                topK: 3,
              },
            },
            {
              id: 'llm_generate',
              type: 'agent',
              data: {
                label: 'Generate Answer',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Based on this context:\n{{context}}\n\nAnswer this question: {{question}}\n\nProvide a clear and concise answer.',
                temperature: 0.3,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'embed_query' },
            { id: 'edge_2', source: 'embed_query', target: 'retrieve_1' },
            { id: 'edge_3', source: 'retrieve_1', target: 'llm_generate' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Verify retrieval step
      const retrieveStep = execution.steps.find(s => s.nodeId === 'retrieve_1');
      expect(retrieveStep.output.results).toBeDefined();
      expect(retrieveStep.output.results.length).toBeGreaterThan(0);

      // Verify generation step
      const llmStep = execution.steps.find(s => s.nodeId === 'llm_generate');
      expect(llmStep.output.text).toBeDefined();
      expect(llmStep.output.text.length).toBeGreaterThan(20);

      // Answer should mention automation or efficiency
      const answer = llmStep.output.text.toLowerCase();
      expect(
        answer.includes('automat') ||
        answer.includes('efficien') ||
        answer.includes('streamline')
      ).toBe(true);

      // Verify context was used
      expect(llmStep.variables.input.context).toBeDefined();
    }, 90000);

    it('should handle multi-turn RAG conversation', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Multi-turn RAG Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  questions: [
                    'What is workflow automation?',
                    'How does it help businesses?',
                    'What technologies enable it?',
                  ],
                },
              },
            },
            {
              id: 'loop_1',
              type: 'loop',
              data: {
                label: 'Process Each Question',
                iterateOver: '{{questions}}',
              },
            },
            {
              id: 'embed_query',
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
              id: 'retrieve_1',
              type: 'action',
              data: {
                label: 'Retrieve Context',
                action: 'vector-search',
                collection: 'rag-knowledge',
                topK: 2,
              },
            },
            {
              id: 'llm_generate',
              type: 'agent',
              data: {
                label: 'Generate Answer',
                agentType: 'ollama',
                model: 'llama2',
                prompt: 'Context: {{context}}\n\nQuestion: {{currentItem}}\n\nAnswer briefly:',
                temperature: 0.3,
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'loop_1' },
            { id: 'edge_2', source: 'loop_1', target: 'embed_query' },
            { id: 'edge_3', source: 'embed_query', target: 'retrieve_1' },
            { id: 'edge_4', source: 'retrieve_1', target: 'llm_generate' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      // Should have processed all 3 questions
      const llmSteps = execution.steps.filter(s => s.nodeId === 'llm_generate');
      expect(llmSteps.length).toBe(3);

      llmSteps.forEach(step => {
        expect(step.output.text).toBeDefined();
        expect(step.output.text.length).toBeGreaterThan(10);
      });
    }, 180000);
  });

  describe('Similarity Comparison Workflow', () => {
    it('should compare document similarity using embeddings', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Similarity Comparison',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: {
                  doc1: 'Machine learning algorithms can detect patterns in data',
                  doc2: 'AI models identify patterns and make predictions from data',
                  doc3: 'Cloud storage provides scalable data solutions',
                },
              },
            },
            {
              id: 'embed_all',
              type: 'tool',
              data: {
                label: 'Embed All Documents',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                inputs: ['{{doc1}}', '{{doc2}}', '{{doc3}}'],
              },
            },
            {
              id: 'compare_1',
              type: 'action',
              data: {
                label: 'Calculate Similarity',
                action: 'cosine-similarity',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'embed_all' },
            { id: 'edge_2', source: 'embed_all', target: 'compare_1' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      const compareStep = execution.steps.find(s => s.nodeId === 'compare_1');
      expect(compareStep.output.similarities).toBeDefined();

      // doc1 and doc2 should be more similar (both about ML/AI and patterns)
      const sim_1_2 = compareStep.output.similarities['0-1'];
      const sim_1_3 = compareStep.output.similarities['0-2'];

      expect(sim_1_2).toBeGreaterThan(sim_1_3);
      expect(sim_1_2).toBeGreaterThan(0.7); // High similarity
    }, 60000);
  });

  describe('Hybrid Search Workflow', () => {
    it('should combine keyword and semantic search', async () => {
      if (!ollamaAvailable) return;

      const workflow = {
        name: 'Hybrid Search Workflow',
        organizationId: 'test-org',
        definition: {
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              data: {
                label: 'Start',
                outputData: { query: 'machine learning Python' },
              },
            },
            {
              id: 'keyword_search',
              type: 'action',
              data: {
                label: 'Keyword Search',
                action: 'text-search',
                collection: 'test-search',
                query: '{{query}}',
                topK: 5,
              },
            },
            {
              id: 'embed_query',
              type: 'tool',
              data: {
                label: 'Embed Query',
                toolType: 'embedding',
                provider: 'ollama',
                model: 'nomic-embed-text',
                input: '{{query}}',
              },
            },
            {
              id: 'vector_search',
              type: 'action',
              data: {
                label: 'Vector Search',
                action: 'vector-search',
                collection: 'test-search',
                topK: 5,
              },
            },
            {
              id: 'merge_results',
              type: 'merge',
              data: {
                label: 'Merge Results',
                strategy: 'reciprocal-rank-fusion',
              },
            },
          ],
          edges: [
            { id: 'edge_1', source: 'trigger_1', target: 'keyword_search' },
            { id: 'edge_2', source: 'trigger_1', target: 'embed_query' },
            { id: 'edge_3', source: 'embed_query', target: 'vector_search' },
            { id: 'edge_4', source: 'keyword_search', target: 'merge_results' },
            { id: 'edge_5', source: 'vector_search', target: 'merge_results' },
          ],
        },
      };

      const createdWorkflow = await workflowsService.create(workflow);
      const execution = await executorService.execute(createdWorkflow.id, {}, {
        captureVariables: true,
      });

      expect(execution.status).toBe('completed');

      const mergeStep = execution.steps.find(s => s.nodeId === 'merge_results');
      expect(mergeStep.output.results).toBeDefined();
      expect(mergeStep.output.results.length).toBeGreaterThan(0);

      // Results should be ranked with combined scores
      mergeStep.output.results.forEach(result => {
        expect(result.combinedScore).toBeDefined();
        expect(result.combinedScore).toBeGreaterThan(0);
      });
    }, 90000);
  });
});
