/**
 * Seed Data Generators
 * Functions to populate test database with realistic data
 */

import { mockData } from './mock-data';
import { mockWorkflows } from './mock-workflows';
import { mockScenarios } from './mock-scenarios';

export class SeedDataGenerator {
  /**
   * Generate complete test database seed
   */
  static async seedAll() {
    return {
      organizations: await this.seedOrganizations(),
      users: await this.seedUsers(),
      workflows: await this.seedWorkflows(),
      executions: await this.seedExecutions(),
      knowledgeBase: await this.seedKnowledgeBase(),
      vectors: await this.seedVectors(),
    };
  }

  /**
   * Seed organizations
   */
  static async seedOrganizations() {
    return mockData.organizations.map((org, index) => ({
      ...org,
      settings: {
        workflowLimit: 100,
        aiEnabled: true,
        collaborationEnabled: true,
      },
      subscription: {
        plan: index === 0 ? 'enterprise' : 'professional',
        status: 'active',
        trialEndsAt: null,
      },
    }));
  }

  /**
   * Seed users
   */
  static async seedUsers() {
    return mockData.users.map(user => ({
      ...user,
      password: '$2b$10$hashedpassword', // bcrypt hash
      emailVerified: true,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
      settings: {
        theme: 'light',
        notifications: true,
        timezone: 'America/New_York',
      },
    }));
  }

  /**
   * Seed workflows
   */
  static async seedWorkflows() {
    const workflows = Object.values(mockWorkflows);
    return workflows.map((workflow, index) => ({
      ...workflow,
      id: `wf-${index + 1}`,
      version: 1,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      createdBy: 'user-1',
      tags: ['test', 'automation'],
      executionCount: Math.floor(Math.random() * 100),
      lastExecutedAt: new Date(),
    }));
  }

  /**
   * Seed workflow executions
   */
  static async seedExecutions() {
    const executions = [];
    const statuses = ['completed', 'failed', 'running', 'paused'];
    
    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startTime = Date.now() - Math.random() * 86400000 * 7; // Last 7 days
      const duration = Math.random() * 30000; // 0-30 seconds
      
      executions.push({
        id: `exec-${i + 1}`,
        workflowId: `wf-${Math.floor(Math.random() * 5) + 1}`,
        status,
        startTime: new Date(startTime),
        endTime: status === 'completed' || status === 'failed' 
          ? new Date(startTime + duration) 
          : null,
        duration: status === 'completed' || status === 'failed' ? duration : null,
        triggeredBy: 'user-1',
        inputData: { test: true },
        outputData: status === 'completed' ? { result: 'success' } : null,
        error: status === 'failed' ? 'Execution failed: Test error' : null,
        steps: this.generateExecutionSteps(status),
        logs: this.generateExecutionLogs(status),
        variables: this.generateExecutionVariables(),
      });
    }
    
    return executions;
  }

  /**
   * Generate execution steps
   */
  private static generateExecutionSteps(status: string) {
    const steps = [];
    const nodeCount = Math.floor(Math.random() * 5) + 2; // 2-6 nodes
    
    for (let i = 0; i < nodeCount; i++) {
      const stepStatus = i < nodeCount - 1 
        ? 'completed' 
        : status === 'failed' ? 'failed' : 'completed';
      
      steps.push({
        nodeId: `node_${i + 1}`,
        status: stepStatus,
        startTime: Date.now() - (nodeCount - i) * 1000,
        endTime: Date.now() - (nodeCount - i - 1) * 1000,
        duration: 1000,
        output: stepStatus === 'completed' ? { data: `output_${i}` } : null,
        error: stepStatus === 'failed' ? 'Step execution failed' : null,
      });
    }
    
    return steps;
  }

  /**
   * Generate execution logs
   */
  private static generateExecutionLogs(status: string) {
    const logs = [
      { timestamp: Date.now() - 10000, level: 'info', message: 'Workflow execution started' },
      { timestamp: Date.now() - 8000, level: 'info', message: 'Node trigger_1 completed', nodeId: 'trigger_1' },
      { timestamp: Date.now() - 6000, level: 'info', message: 'Node action_1 started', nodeId: 'action_1' },
    ];
    
    if (status === 'failed') {
      logs.push({
        timestamp: Date.now() - 2000,
        level: 'error',
        message: 'Node action_1 failed: Connection timeout',
        nodeId: 'action_1',
      });
    } else {
      logs.push({
        timestamp: Date.now() - 2000,
        level: 'info',
        message: 'Workflow execution completed successfully',
      });
    }
    
    return logs;
  }

  /**
   * Generate execution variables
   */
  private static generateExecutionVariables() {
    return {
      node_1: {
        input: { test: true },
        output: { result: 'processed' },
        context: { timestamp: Date.now() },
      },
    };
  }

  /**
   * Seed knowledge base documents
   */
  static async seedKnowledgeBase() {
    const documents = [
      ...mockData.knowledgeBaseDocuments,
      ...mockScenarios.customerSupport.knowledgeBase.map(kb => ({
        id: kb.id,
        title: kb.title,
        content: kb.content,
        category: kb.category,
        tags: [kb.category],
      })),
    ];
    
    return documents.map(doc => ({
      ...doc,
      organizationId: 'org-123',
      collectionId: 'default',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      createdBy: 'user-1',
      metadata: {
        source: 'test-seed',
        indexed: true,
      },
      chunks: this.generateDocumentChunks(doc.content),
    }));
  }

  /**
   * Generate document chunks
   */
  private static generateDocumentChunks(content: string, chunkSize = 500) {
    const chunks = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize) {
        chunks.push({
          id: `chunk-${chunkIndex++}`,
          text: currentChunk.trim(),
          startIndex: 0,
          endIndex: currentChunk.length,
        });
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        startIndex: 0,
        endIndex: currentChunk.length,
      });
    }
    
    return chunks;
  }

  /**
   * Seed vector embeddings
   */
  static async seedVectors() {
    const vectors = [];
    const documents = mockData.knowledgeBaseDocuments;
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      vectors.push({
        id: `vec-${i + 1}`,
        documentId: doc.id,
        collectionId: 'default',
        vector: this.generateRandomEmbedding(384),
        metadata: {
          title: doc.title,
          category: doc.category,
          tags: doc.tags,
          content: doc.content.substring(0, 200),
        },
        createdAt: new Date('2024-01-01'),
      });
    }
    
    return vectors;
  }

  /**
   * Generate random embedding vector
   */
  private static generateRandomEmbedding(dimensions: number): number[] {
    const vector = [];
    for (let i = 0; i < dimensions; i++) {
      vector.push((Math.random() - 0.5) * 2); // Range: -1 to 1
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }

  /**
   * Seed support tickets
   */
  static async seedSupportTickets() {
    return mockScenarios.customerSupport.tickets.map(ticket => ({
      ...ticket,
      organizationId: 'org-123',
      assignedTo: null,
      responses: [],
      metadata: {
        source: 'email',
        ipAddress: '192.168.1.1',
      },
    }));
  }

  /**
   * Seed product reviews
   */
  static async seedProductReviews() {
    return mockScenarios.dataProcessing.reviews.map(review => ({
      ...review,
      organizationId: 'org-123',
      sentiment: null, // To be analyzed by workflow
      aiAnalysis: null,
      moderationStatus: 'pending',
    }));
  }

  /**
   * Seed blog topics
   */
  static async seedBlogTopics() {
    return mockData.blogTopics.map(topic => ({
      ...topic,
      organizationId: 'org-123',
      status: 'draft',
      outline: null,
      content: null,
      seoScore: null,
      publishedAt: null,
    }));
  }

  /**
   * Generate realistic execution history
   */
  static generateExecutionHistory(workflowId: string, count: number = 10) {
    const history = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const startTime = now - (i * 3600000); // 1 hour apart
      const duration = Math.random() * 5000 + 1000; // 1-6 seconds
      const status = Math.random() > 0.8 ? 'failed' : 'completed';
      
      history.push({
        id: `hist-${i + 1}`,
        workflowId,
        status,
        startTime: new Date(startTime),
        endTime: new Date(startTime + duration),
        duration,
        nodeStates: {
          trigger_1: { status: 'completed', duration: 100 },
          action_1: { status: status === 'failed' ? 'failed' : 'completed', duration: duration - 100 },
        },
        logs: [
          { timestamp: startTime, message: 'Execution started', level: 'info' },
          { 
            timestamp: startTime + duration, 
            message: status === 'failed' ? 'Execution failed' : 'Execution completed', 
            level: status === 'failed' ? 'error' : 'info' 
          },
        ],
        variables: {
          trigger_1: { input: {}, output: { triggered: true } },
        },
      });
    }
    
    return history;
  }

  /**
   * Generate breakpoint configurations
   */
  static generateBreakpointConfigs() {
    return [
      { nodeId: 'action_1', enabled: true, condition: null },
      { nodeId: 'condition_1', enabled: true, condition: 'input.value > 100' },
      { nodeId: 'loop_1', enabled: true, condition: 'iteration === 5' },
    ];
  }

  /**
   * Generate variable snapshots
   */
  static generateVariableSnapshots(nodeIds: string[]) {
    const snapshots = new Map();
    
    nodeIds.forEach((nodeId, index) => {
      snapshots.set(nodeId, {
        nodeId,
        timestamp: Date.now() + index * 1000,
        variables: {
          iteration: index,
          previousOutput: index > 0 ? `output_${index - 1}` : null,
        },
        inputData: { nodeIndex: index },
        outputData: { result: `output_${index}` },
      });
    });
    
    return snapshots;
  }

  /**
   * Clean up all test data
   */
  static async cleanAll() {
    return {
      organizationsDeleted: true,
      usersDeleted: true,
      workflowsDeleted: true,
      executionsDeleted: true,
      knowledgeBaseDeleted: true,
      vectorsDeleted: true,
    };
  }
}

/**
 * Quick seed functions for common scenarios
 */
export const quickSeed = {
  /**
   * Seed minimal data for quick tests
   */
  minimal: async () => {
    return {
      organization: mockData.organizations[0],
      user: mockData.users[0],
      workflow: mockWorkflows.simpleLinear,
    };
  },

  /**
   * Seed data for LLM tests
   */
  llm: async () => {
    return {
      organization: mockData.organizations[0],
      user: mockData.users[0],
      workflows: [
        mockWorkflows.llmGeneration,
        mockWorkflows.ragWorkflow,
        mockWorkflows.multiAgent,
      ],
    };
  },

  /**
   * Seed data for embedding tests
   */
  embeddings: async () => {
    return {
      organization: mockData.organizations[0],
      user: mockData.users[0],
      workflow: mockWorkflows.embeddingGeneration,
      documents: mockData.knowledgeBaseDocuments,
      vectors: mockData.sampleEmbeddings,
    };
  },

  /**
   * Seed data for scenario tests
   */
  scenarios: async () => {
    return {
      organization: mockData.organizations[0],
      user: mockData.users[0],
      customerSupport: mockScenarios.customerSupport,
      dataProcessing: mockScenarios.dataProcessing,
      documentIntelligence: mockScenarios.documentIntelligence,
      multiAgent: mockScenarios.multiAgent,
    };
  },

  /**
   * Seed data for advanced features
   */
  advanced: async () => {
    return {
      organization: mockData.organizations[0],
      user: mockData.users[0],
      workflow: mockWorkflows.withBreakpoint,
      breakpoints: SeedDataGenerator.generateBreakpointConfigs(),
      history: SeedDataGenerator.generateExecutionHistory('wf-1', 10),
      variables: SeedDataGenerator.generateVariableSnapshots(['node_1', 'node_2', 'node_3']),
    };
  },
};

/**
 * Database seeder utility
 */
export class DatabaseSeeder {
  /**
   * Seed database with test data
   */
  static async seed(options: {
    includeOrganizations?: boolean;
    includeUsers?: boolean;
    includeWorkflows?: boolean;
    includeExecutions?: boolean;
    includeKnowledgeBase?: boolean;
    includeVectors?: boolean;
  } = {}) {
    const {
      includeOrganizations = true,
      includeUsers = true,
      includeWorkflows = true,
      includeExecutions = true,
      includeKnowledgeBase = true,
      includeVectors = true,
    } = options;

    const results = {
      organizations: [],
      users: [],
      workflows: [],
      executions: [],
      knowledgeBase: [],
      vectors: [],
    };

    if (includeOrganizations) {
      results.organizations = await SeedDataGenerator.seedOrganizations();
      console.log(`✓ Seeded ${results.organizations.length} organizations`);
    }

    if (includeUsers) {
      results.users = await SeedDataGenerator.seedUsers();
      console.log(`✓ Seeded ${results.users.length} users`);
    }

    if (includeWorkflows) {
      results.workflows = await SeedDataGenerator.seedWorkflows();
      console.log(`✓ Seeded ${results.workflows.length} workflows`);
    }

    if (includeExecutions) {
      results.executions = await SeedDataGenerator.seedExecutions();
      console.log(`✓ Seeded ${results.executions.length} executions`);
    }

    if (includeKnowledgeBase) {
      results.knowledgeBase = await SeedDataGenerator.seedKnowledgeBase();
      console.log(`✓ Seeded ${results.knowledgeBase.length} knowledge base documents`);
    }

    if (includeVectors) {
      results.vectors = await SeedDataGenerator.seedVectors();
      console.log(`✓ Seeded ${results.vectors.length} vector embeddings`);
    }

    return results;
  }

  /**
   * Clean database
   */
  static async clean() {
    const results = await SeedDataGenerator.cleanAll();
    console.log('✓ Database cleaned');
    return results;
  }

  /**
   * Reset database (clean + seed)
   */
  static async reset() {
    await this.clean();
    await this.seed();
    console.log('✓ Database reset complete');
  }
}
