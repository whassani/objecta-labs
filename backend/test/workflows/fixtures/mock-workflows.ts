/**
 * Mock Workflow Definitions for Testing
 * Provides pre-built workflow structures for various test scenarios
 */

export const mockWorkflows = {
  /**
   * Simple linear workflow with 3 nodes
   */
  simpleLinear: {
    name: 'Simple Linear Workflow',
    organizationId: 'test-org-123',
    description: 'A basic workflow with sequential execution',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            triggerType: 'manual',
          },
          position: { x: 0, y: 100 },
        },
        {
          id: 'action_1',
          type: 'action',
          data: {
            label: 'Process Data',
            action: 'log',
            message: 'Processing data...',
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'action_2',
          type: 'action',
          data: {
            label: 'Complete',
            action: 'log',
            message: 'Workflow completed',
          },
          position: { x: 400, y: 100 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
        { id: 'edge_2', source: 'action_1', target: 'action_2' },
      ],
    },
  },

  /**
   * Workflow with conditional branching
   */
  conditionalBranch: {
    name: 'Conditional Branching Workflow',
    organizationId: 'test-org-123',
    description: 'Workflow with if/else logic',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            outputData: { score: 85 },
          },
          position: { x: 0, y: 150 },
        },
        {
          id: 'condition_1',
          type: 'condition',
          data: {
            label: 'Check Score',
            condition: 'input.score >= 70',
          },
          position: { x: 200, y: 150 },
        },
        {
          id: 'action_pass',
          type: 'action',
          data: {
            label: 'Pass',
            action: 'log',
            message: 'Score is passing',
          },
          position: { x: 400, y: 100 },
        },
        {
          id: 'action_fail',
          type: 'action',
          data: {
            label: 'Fail',
            action: 'log',
            message: 'Score is failing',
          },
          position: { x: 400, y: 200 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'condition_1' },
        { id: 'edge_2', source: 'condition_1', target: 'action_pass', sourceHandle: 'true' },
        { id: 'edge_3', source: 'condition_1', target: 'action_fail', sourceHandle: 'false' },
      ],
    },
  },

  /**
   * Workflow with loop execution
   */
  loopExecution: {
    name: 'Loop Execution Workflow',
    organizationId: 'test-org-123',
    description: 'Workflow that iterates over items',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            outputData: {
              items: ['item1', 'item2', 'item3'],
            },
          },
          position: { x: 0, y: 100 },
        },
        {
          id: 'loop_1',
          type: 'loop',
          data: {
            label: 'Process Items',
            iterateOver: '{{items}}',
            maxIterations: 10,
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'action_1',
          type: 'action',
          data: {
            label: 'Process Item',
            action: 'log',
            message: 'Processing: {{currentItem}}',
          },
          position: { x: 400, y: 100 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'loop_1' },
        { id: 'edge_2', source: 'loop_1', target: 'action_1' },
        { id: 'edge_3', source: 'action_1', target: 'loop_1', type: 'loop-back' },
      ],
    },
  },

  /**
   * Workflow with LLM node
   */
  llmGeneration: {
    name: 'LLM Text Generation',
    organizationId: 'test-org-123',
    description: 'Workflow using Ollama for text generation',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            outputData: {
              topic: 'artificial intelligence',
            },
          },
          position: { x: 0, y: 100 },
        },
        {
          id: 'llm_1',
          type: 'agent',
          data: {
            label: 'Generate Content',
            agentType: 'ollama',
            model: 'llama2',
            prompt: 'Write a short paragraph about {{topic}}',
            temperature: 0.7,
            maxTokens: 150,
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'action_1',
          type: 'action',
          data: {
            label: 'Log Result',
            action: 'log',
          },
          position: { x: 400, y: 100 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
        { id: 'edge_2', source: 'llm_1', target: 'action_1' },
      ],
    },
  },

  /**
   * Workflow with embedding generation
   */
  embeddingGeneration: {
    name: 'Document Embedding',
    organizationId: 'test-org-123',
    description: 'Generate embeddings for documents',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            outputData: {
              documents: [
                { id: 'doc1', text: 'Machine learning is a subset of artificial intelligence' },
                { id: 'doc2', text: 'Deep learning uses neural networks with multiple layers' },
                { id: 'doc3', text: 'Natural language processing enables computers to understand text' },
              ],
            },
          },
          position: { x: 0, y: 100 },
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
          position: { x: 200, y: 100 },
        },
        {
          id: 'store_1',
          type: 'action',
          data: {
            label: 'Store Vectors',
            action: 'store-vectors',
            collection: 'test-docs',
          },
          position: { x: 400, y: 100 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'embed_1' },
        { id: 'edge_2', source: 'embed_1', target: 'store_1' },
      ],
    },
  },

  /**
   * RAG workflow with retrieval and generation
   */
  ragWorkflow: {
    name: 'RAG Question Answering',
    organizationId: 'test-org-123',
    description: 'Retrieval Augmented Generation workflow',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'User Question',
            outputData: {
              question: 'What is machine learning?',
            },
          },
          position: { x: 0, y: 150 },
        },
        {
          id: 'embed_query',
          type: 'tool',
          data: {
            label: 'Embed Query',
            toolType: 'embedding',
            provider: 'ollama',
            model: 'nomic-embed-text',
            input: '{{question}}',
          },
          position: { x: 200, y: 150 },
        },
        {
          id: 'search_1',
          type: 'action',
          data: {
            label: 'Search Knowledge Base',
            action: 'vector-search',
            collection: 'knowledge-base',
            topK: 3,
          },
          position: { x: 400, y: 150 },
        },
        {
          id: 'llm_generate',
          type: 'agent',
          data: {
            label: 'Generate Answer',
            agentType: 'ollama',
            model: 'llama2',
            prompt: 'Based on this context:\n{{context}}\n\nAnswer the question: {{question}}\n\nProvide a clear and accurate answer.',
            temperature: 0.3,
          },
          position: { x: 600, y: 150 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'embed_query' },
        { id: 'edge_2', source: 'embed_query', target: 'search_1' },
        { id: 'edge_3', source: 'search_1', target: 'llm_generate' },
      ],
    },
  },

  /**
   * Workflow with breakpoint for debugging
   */
  withBreakpoint: {
    name: 'Workflow with Breakpoint',
    organizationId: 'test-org-123',
    description: 'Test breakpoint functionality',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: { label: 'Start' },
          position: { x: 0, y: 100 },
        },
        {
          id: 'action_1',
          type: 'action',
          data: {
            label: 'Before Breakpoint',
            action: 'log',
            message: 'Before breakpoint',
          },
          position: { x: 200, y: 100 },
        },
        {
          id: 'action_2',
          type: 'action',
          data: {
            label: 'At Breakpoint',
            action: 'log',
            message: 'At breakpoint',
            breakpoint: true,
          },
          position: { x: 400, y: 100 },
        },
        {
          id: 'action_3',
          type: 'action',
          data: {
            label: 'After Breakpoint',
            action: 'log',
            message: 'After breakpoint',
          },
          position: { x: 600, y: 100 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
        { id: 'edge_2', source: 'action_1', target: 'action_2' },
        { id: 'edge_3', source: 'action_2', target: 'action_3' },
      ],
    },
  },

  /**
   * Complex multi-agent workflow
   */
  multiAgent: {
    name: 'Multi-Agent Collaboration',
    organizationId: 'test-org-123',
    description: 'Multiple AI agents working together',
    definition: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          data: {
            label: 'Start',
            outputData: {
              task: 'Design a mobile app for fitness tracking',
            },
          },
          position: { x: 0, y: 200 },
        },
        {
          id: 'agent_planner',
          type: 'agent',
          data: {
            label: 'Planner Agent',
            agentType: 'ollama',
            model: 'llama2',
            prompt: 'You are a strategic planner. Create a brief plan with 3 main steps for: {{task}}',
            temperature: 0.7,
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'agent_designer',
          type: 'agent',
          data: {
            label: 'Designer Agent',
            agentType: 'ollama',
            model: 'llama2',
            prompt: 'You are a UX designer. Based on this plan:\n{{plan}}\n\nSuggest 3 key UI features.',
            temperature: 0.8,
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'agent_developer',
          type: 'agent',
          data: {
            label: 'Developer Agent',
            agentType: 'ollama',
            model: 'llama2',
            prompt: 'You are a developer. Review these features:\n{{features}}\n\nEstimate complexity (Low/Medium/High) for each.',
            temperature: 0.3,
          },
          position: { x: 600, y: 200 },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'trigger_1', target: 'agent_planner' },
        { id: 'edge_2', source: 'agent_planner', target: 'agent_designer' },
        { id: 'edge_3', source: 'agent_designer', target: 'agent_developer' },
      ],
    },
  },
};
