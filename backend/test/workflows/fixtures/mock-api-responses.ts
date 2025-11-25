/**
 * Mock API Responses
 * Predefined API responses for testing HTTP interactions
 */

export const mockApiResponses = {
  /**
   * Ollama API responses
   */
  ollama: {
    tags: {
      models: [
        {
          name: 'llama2',
          modified_at: '2024-01-01T00:00:00Z',
          size: 3825819519,
          digest: 'abc123',
        },
        {
          name: 'nomic-embed-text',
          modified_at: '2024-01-01T00:00:00Z',
          size: 274301440,
          digest: 'def456',
        },
      ],
    },

    generate: {
      success: {
        model: 'llama2',
        created_at: '2024-01-15T10:00:00Z',
        response: 'Workflow automation streamlines repetitive tasks, allowing teams to focus on strategic work and innovation.',
        done: true,
        context: [1, 2, 3],
        total_duration: 2500000000,
        load_duration: 500000000,
        prompt_eval_duration: 1000000000,
        eval_duration: 1000000000,
      },

      streaming: [
        { model: 'llama2', created_at: '2024-01-15T10:00:00Z', response: 'Work', done: false },
        { model: 'llama2', created_at: '2024-01-15T10:00:01Z', response: 'flow', done: false },
        { model: 'llama2', created_at: '2024-01-15T10:00:02Z', response: ' automation', done: false },
        { model: 'llama2', created_at: '2024-01-15T10:00:03Z', response: ' is great!', done: true },
      ],

      error: {
        error: 'model not found',
      },
    },

    embeddings: {
      success: {
        embedding: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
      },

      batch: {
        embeddings: [
          Array.from({ length: 384 }, () => Math.random() * 2 - 1),
          Array.from({ length: 384 }, () => Math.random() * 2 - 1),
          Array.from({ length: 384 }, () => Math.random() * 2 - 1),
        ],
      },
    },
  },

  /**
   * Workflow API responses
   */
  workflows: {
    list: {
      data: [
        {
          id: 'wf-1',
          name: 'Test Workflow',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          executionCount: 42,
        },
        {
          id: 'wf-2',
          name: 'Another Workflow',
          status: 'active',
          createdAt: '2024-01-02T00:00:00Z',
          executionCount: 18,
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    },

    create: {
      id: 'wf-new-123',
      name: 'New Workflow',
      organizationId: 'org-123',
      status: 'active',
      version: 1,
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'user-1',
    },

    get: {
      id: 'wf-1',
      name: 'Test Workflow',
      organizationId: 'org-123',
      definition: {
        nodes: [
          { id: 'trigger_1', type: 'trigger', data: { label: 'Start' } },
          { id: 'action_1', type: 'action', data: { label: 'Process' } },
        ],
        edges: [
          { id: 'edge_1', source: 'trigger_1', target: 'action_1' },
        ],
      },
      status: 'active',
      version: 1,
      createdAt: '2024-01-01T00:00:00Z',
      executionCount: 42,
    },

    execute: {
      success: {
        id: 'exec-123',
        workflowId: 'wf-1',
        status: 'running',
        startTime: '2024-01-15T10:00:00Z',
        message: 'Workflow execution started',
      },

      completed: {
        id: 'exec-123',
        workflowId: 'wf-1',
        status: 'completed',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:00:05Z',
        duration: 5000,
        steps: [
          {
            nodeId: 'trigger_1',
            status: 'completed',
            duration: 100,
          },
          {
            nodeId: 'action_1',
            status: 'completed',
            duration: 4900,
          },
        ],
      },

      failed: {
        id: 'exec-124',
        workflowId: 'wf-1',
        status: 'failed',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:00:03Z',
        duration: 3000,
        error: 'Node execution failed: Connection timeout',
        steps: [
          {
            nodeId: 'trigger_1',
            status: 'completed',
            duration: 100,
          },
          {
            nodeId: 'action_1',
            status: 'failed',
            duration: 2900,
            error: 'Connection timeout',
          },
        ],
      },
    },

    history: {
      data: [
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          status: 'completed',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T09:00:05Z',
          duration: 5000,
        },
        {
          id: 'exec-2',
          workflowId: 'wf-1',
          status: 'completed',
          startTime: '2024-01-15T08:00:00Z',
          endTime: '2024-01-15T08:00:04Z',
          duration: 4000,
        },
        {
          id: 'exec-3',
          workflowId: 'wf-1',
          status: 'failed',
          startTime: '2024-01-15T07:00:00Z',
          endTime: '2024-01-15T07:00:03Z',
          duration: 3000,
          error: 'Execution failed',
        },
      ],
      total: 3,
      page: 1,
      pageSize: 10,
    },
  },

  /**
   * Vector store API responses
   */
  vectorStore: {
    store: {
      success: {
        id: 'vec-123',
        documentId: 'doc-1',
        collectionId: 'default',
        stored: true,
        message: 'Vector stored successfully',
      },
    },

    search: {
      results: [
        {
          id: 'vec-1',
          documentId: 'doc-1',
          score: 0.92,
          metadata: {
            title: 'Workflow Automation Guide',
            content: 'Workflow automation allows businesses to streamline...',
          },
        },
        {
          id: 'vec-2',
          documentId: 'doc-2',
          score: 0.87,
          metadata: {
            title: 'AI and Machine Learning',
            content: 'Artificial intelligence can analyze patterns...',
          },
        },
        {
          id: 'vec-3',
          documentId: 'doc-3',
          score: 0.81,
          metadata: {
            title: 'Cloud Computing Benefits',
            content: 'Cloud computing provides on-demand access...',
          },
        },
      ],
    },
  },

  /**
   * WebSocket event messages
   */
  websocket: {
    nodeStart: {
      type: 'node-start',
      executionId: 'exec-123',
      nodeId: 'action_1',
      timestamp: Date.now(),
    },

    nodeComplete: {
      type: 'node-complete',
      executionId: 'exec-123',
      nodeId: 'action_1',
      timestamp: Date.now(),
      duration: 2500,
      output: { result: 'success' },
      variables: { count: 1 },
    },

    nodeError: {
      type: 'node-error',
      executionId: 'exec-123',
      nodeId: 'action_1',
      timestamp: Date.now(),
      error: 'Connection timeout',
    },

    edgeActivate: {
      type: 'edge-activate',
      executionId: 'exec-123',
      edgeId: 'edge_1',
      timestamp: Date.now(),
    },

    executionComplete: {
      type: 'execution-complete',
      executionId: 'exec-123',
      timestamp: Date.now(),
      duration: 5000,
    },

    executionFailed: {
      type: 'execution-failed',
      executionId: 'exec-123',
      timestamp: Date.now(),
      error: 'Workflow execution failed',
    },
  },

  /**
   * Error responses
   */
  errors: {
    unauthorized: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Authentication required',
    },

    forbidden: {
      statusCode: 403,
      message: 'Forbidden',
      error: 'Insufficient permissions',
    },

    notFound: {
      statusCode: 404,
      message: 'Not Found',
      error: 'Resource not found',
    },

    badRequest: {
      statusCode: 400,
      message: 'Bad Request',
      error: 'Invalid request parameters',
      details: [
        { field: 'name', message: 'Name is required' },
      ],
    },

    serverError: {
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'An unexpected error occurred',
    },

    timeout: {
      statusCode: 504,
      message: 'Gateway Timeout',
      error: 'Request timeout',
    },
  },
};

/**
 * Mock response generators
 */
export const mockResponseGenerators = {
  /**
   * Generate mock Ollama generate response
   */
  ollamaGenerate: (prompt: string, model = 'llama2') => ({
    model,
    created_at: new Date().toISOString(),
    response: `Generated response for: ${prompt.substring(0, 50)}...`,
    done: true,
    total_duration: Math.floor(Math.random() * 5000000000),
  }),

  /**
   * Generate mock embedding
   */
  ollamaEmbedding: (dimensions = 384) => ({
    embedding: Array.from({ length: dimensions }, () => Math.random() * 2 - 1),
  }),

  /**
   * Generate mock workflow execution
   */
  workflowExecution: (workflowId: string, status: 'running' | 'completed' | 'failed') => {
    const startTime = new Date();
    const endTime = status !== 'running' ? new Date(Date.now() + 5000) : null;
    
    return {
      id: `exec-${Date.now()}`,
      workflowId,
      status,
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString() || null,
      duration: endTime ? 5000 : null,
      error: status === 'failed' ? 'Execution failed' : null,
      steps: [],
      logs: [
        {
          timestamp: Date.now(),
          level: 'info',
          message: `Workflow execution ${status}`,
        },
      ],
    };
  },

  /**
   * Generate mock vector search results
   */
  vectorSearchResults: (query: string, count = 3) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push({
        id: `vec-${i + 1}`,
        documentId: `doc-${i + 1}`,
        score: 0.95 - (i * 0.05),
        metadata: {
          title: `Document ${i + 1}`,
          content: `Content related to: ${query}`,
        },
      });
    }
    return { results };
  },

  /**
   * Generate mock execution history
   */
  executionHistory: (workflowId: string, count = 10) => {
    const history = [];
    for (let i = 0; i < count; i++) {
      const startTime = new Date(Date.now() - (i * 3600000));
      history.push({
        id: `exec-${i + 1}`,
        workflowId,
        status: Math.random() > 0.8 ? 'failed' : 'completed',
        startTime: startTime.toISOString(),
        endTime: new Date(startTime.getTime() + 5000).toISOString(),
        duration: 5000,
      });
    }
    return { data: history, total: count };
  },
};

/**
 * HTTP status codes
 */
export const httpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};
