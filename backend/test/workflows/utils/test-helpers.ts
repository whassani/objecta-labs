import axios from 'axios';

export class TestHelpers {
  static OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  /**
   * Check if Ollama is available and running
   */
  static async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.OLLAMA_URL}/api/tags`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of available Ollama models
   */
  static async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.OLLAMA_URL}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Pull a model if not available
   */
  static async ensureModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      if (models.includes(modelName)) {
        return true;
      }

      console.log(`Pulling model: ${modelName}...`);
      const response = await axios.post(
        `${this.OLLAMA_URL}/api/pull`,
        { name: modelName },
        { timeout: 300000 } // 5 minutes
      );
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error.message);
      return false;
    }
  }

  /**
   * Create a simple test workflow
   */
  static createSimpleWorkflow(options: {
    name: string;
    organizationId: string;
    nodeCount?: number;
  }) {
    const { name, organizationId, nodeCount = 3 } = options;
    
    const nodes = [];
    const edges = [];

    // Create trigger node
    nodes.push({
      id: 'trigger_1',
      type: 'trigger',
      data: { label: 'Start' },
      position: { x: 0, y: 0 },
    });

    // Create action nodes
    for (let i = 1; i < nodeCount; i++) {
      nodes.push({
        id: `action_${i}`,
        type: 'action',
        data: { label: `Action ${i}`, action: 'log' },
        position: { x: i * 200, y: 0 },
      });

      edges.push({
        id: `edge_${i}`,
        source: i === 1 ? 'trigger_1' : `action_${i - 1}`,
        target: `action_${i}`,
      });
    }

    return {
      name,
      organizationId,
      definition: { nodes, edges },
    };
  }

  /**
   * Create workflow with LLM node
   */
  static createLLMWorkflow(options: {
    name: string;
    organizationId: string;
    model?: string;
    prompt: string;
  }) {
    const { name, organizationId, model = 'llama2', prompt } = options;

    return {
      name,
      organizationId,
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
              label: 'LLM Node',
              agentType: 'ollama',
              model,
              prompt,
              temperature: 0.7,
            },
          },
        ],
        edges: [
          { id: 'edge_1', source: 'trigger_1', target: 'llm_1' },
        ],
      },
    };
  }

  /**
   * Create workflow with embeddings
   */
  static createEmbeddingWorkflow(options: {
    name: string;
    organizationId: string;
    documents: Array<{ id: string; text: string }>;
  }) {
    const { name, organizationId, documents } = options;

    return {
      name,
      organizationId,
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
              label: 'Generate Embeddings',
              toolType: 'embedding',
              provider: 'ollama',
              model: 'nomic-embed-text',
            },
          },
        ],
        edges: [
          { id: 'edge_1', source: 'trigger_1', target: 'embed_1' },
        ],
      },
    };
  }

  /**
   * Create RAG workflow
   */
  static createRAGWorkflow(options: {
    name: string;
    organizationId: string;
    question: string;
    collection: string;
  }) {
    const { name, organizationId, question, collection } = options;

    return {
      name,
      organizationId,
      definition: {
        nodes: [
          {
            id: 'trigger_1',
            type: 'trigger',
            data: { label: 'Start', outputData: { question } },
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
          },
          {
            id: 'search_1',
            type: 'action',
            data: {
              label: 'Vector Search',
              action: 'vector-search',
              collection,
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
              prompt: 'Context: {{context}}\n\nQuestion: {{question}}\n\nAnswer:',
              temperature: 0.3,
            },
          },
        ],
        edges: [
          { id: 'edge_1', source: 'trigger_1', target: 'embed_query' },
          { id: 'edge_2', source: 'embed_query', target: 'search_1' },
          { id: 'edge_3', source: 'search_1', target: 'llm_generate' },
        ],
      },
    };
  }

  /**
   * Wait for condition with timeout
   */
  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<boolean> {
    const { timeout = 10000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.sleep(interval);
    }

    return false;
  }

  /**
   * Sleep utility
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  static generateTestData(type: 'text' | 'number' | 'array', count = 1) {
    switch (type) {
      case 'text':
        return Array.from({ length: count }, (_, i) => 
          `Test text ${i + 1}: ${Math.random().toString(36).substring(7)}`
        );
      case 'number':
        return Array.from({ length: count }, () => 
          Math.floor(Math.random() * 1000)
        );
      case 'array':
        return Array.from({ length: count }, (_, i) => ({
          id: `item_${i + 1}`,
          value: Math.random(),
          text: `Item ${i + 1}`,
        }));
      default:
        return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Verify execution completed successfully
   */
  static verifyExecutionSuccess(execution: any) {
    expect(execution).toBeDefined();
    expect(execution.status).toBe('completed');
    expect(execution.startTime).toBeDefined();
    expect(execution.endTime).toBeDefined();
    expect(execution.steps).toBeDefined();
    expect(Array.isArray(execution.steps)).toBe(true);
  }

  /**
   * Verify LLM output quality
   */
  static verifyLLMOutput(output: any, options: {
    minLength?: number;
    maxLength?: number;
    contains?: string[];
    notContains?: string[];
  } = {}) {
    const { minLength = 1, maxLength = 100000, contains = [], notContains = [] } = options;

    expect(output).toBeDefined();
    expect(output.text).toBeDefined();
    expect(typeof output.text).toBe('string');
    expect(output.text.length).toBeGreaterThanOrEqual(minLength);
    expect(output.text.length).toBeLessThanOrEqual(maxLength);

    const lowerText = output.text.toLowerCase();
    contains.forEach(keyword => {
      expect(lowerText).toContain(keyword.toLowerCase());
    });

    notContains.forEach(keyword => {
      expect(lowerText).not.toContain(keyword.toLowerCase());
    });
  }

  /**
   * Verify embedding output
   */
  static verifyEmbedding(embedding: any, options: {
    expectedDimensions?: number;
    minDimensions?: number;
    maxDimensions?: number;
  } = {}) {
    expect(embedding).toBeDefined();
    expect(embedding.vector).toBeDefined();
    expect(Array.isArray(embedding.vector)).toBe(true);
    expect(embedding.vector.length).toBeGreaterThan(0);

    if (options.expectedDimensions) {
      expect(embedding.vector.length).toBe(options.expectedDimensions);
    }

    if (options.minDimensions) {
      expect(embedding.vector.length).toBeGreaterThanOrEqual(options.minDimensions);
    }

    if (options.maxDimensions) {
      expect(embedding.vector.length).toBeLessThanOrEqual(options.maxDimensions);
    }

    // Verify all values are numbers
    embedding.vector.forEach((val: any) => {
      expect(typeof val).toBe('number');
      expect(isFinite(val)).toBe(true);
    });
  }

  /**
   * Create execution context for testing
   */
  static createExecutionContext(overrides: any = {}) {
    return {
      captureVariables: true,
      mode: 'debug',
      breakpoints: [],
      ...overrides,
    };
  }

  /**
   * Mock WebSocket client for testing
   */
  static createMockWebSocketClient() {
    const events: any[] = [];
    const handlers: Map<string, Function[]> = new Map();

    return {
      emit: (event: string, data: any) => {
        events.push({ event, data, timestamp: Date.now() });
      },
      on: (event: string, handler: Function) => {
        if (!handlers.has(event)) {
          handlers.set(event, []);
        }
        handlers.get(event)!.push(handler);
      },
      trigger: (event: string, data: any) => {
        const eventHandlers = handlers.get(event);
        if (eventHandlers) {
          eventHandlers.forEach(handler => handler(data));
        }
      },
      getEvents: () => events,
      clearEvents: () => events.splice(0, events.length),
      close: () => {},
    };
  }
}
