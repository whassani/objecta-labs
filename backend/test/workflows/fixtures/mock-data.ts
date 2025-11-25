/**
 * Mock Test Data
 * Provides realistic test data for various scenarios
 */

export const mockData = {
  /**
   * Organizations
   */
  organizations: [
    {
      id: 'org-123',
      name: 'Test Organization',
      slug: 'test-org',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'org-456',
      name: 'Demo Company',
      slug: 'demo-company',
      createdAt: new Date('2024-01-15'),
    },
  ],

  /**
   * Users
   */
  users: [
    {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-123',
      role: 'admin',
    },
    {
      id: 'user-2',
      email: 'developer@example.com',
      name: 'Dev User',
      organizationId: 'org-123',
      role: 'developer',
    },
  ],

  /**
   * Customer support tickets
   */
  supportTickets: [
    {
      id: 'ticket-001',
      customer: 'John Smith',
      email: 'john@example.com',
      subject: 'Login issues',
      message: 'I cannot log into my account. I keep getting error messages. This is very frustrating!',
      priority: 'unknown',
      status: 'new',
      createdAt: new Date(),
    },
    {
      id: 'ticket-002',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      subject: 'Feature request',
      message: 'Your product is great! Could you add dark mode support?',
      priority: 'unknown',
      status: 'new',
      createdAt: new Date(),
    },
    {
      id: 'ticket-003',
      customer: 'Mike Davis',
      email: 'mike@example.com',
      subject: 'Billing question',
      message: 'I was charged twice this month. Please refund the duplicate charge.',
      priority: 'unknown',
      status: 'new',
      createdAt: new Date(),
    },
  ],

  /**
   * Product reviews
   */
  productReviews: [
    {
      id: 'review-1',
      productId: 'prod-123',
      rating: 5,
      text: 'This product is amazing! Best purchase ever. Highly recommend!',
      author: 'Alice Brown',
      verified: true,
    },
    {
      id: 'review-2',
      productId: 'prod-123',
      rating: 2,
      text: 'Terrible quality. Would not recommend. Very disappointed.',
      author: 'Bob Wilson',
      verified: true,
    },
    {
      id: 'review-3',
      productId: 'prod-123',
      rating: 4,
      text: 'Pretty good but could be better. Works as expected.',
      author: 'Carol Lee',
      verified: true,
    },
    {
      id: 'review-4',
      productId: 'prod-123',
      rating: 5,
      text: 'Exceeded my expectations. Very satisfied with the purchase!',
      author: 'David Chen',
      verified: true,
    },
    {
      id: 'review-5',
      productId: 'prod-123',
      rating: 1,
      text: 'Not worth the price. Disappointed with the quality.',
      author: 'Emma Taylor',
      verified: false,
    },
  ],

  /**
   * Documents for knowledge base
   */
  knowledgeBaseDocuments: [
    {
      id: 'doc-kb-1',
      title: 'Workflow Automation Guide',
      content: 'Workflow automation allows businesses to streamline repetitive tasks and increase efficiency. By automating routine processes, teams can focus on high-value work.',
      category: 'automation',
      tags: ['workflow', 'automation', 'efficiency'],
    },
    {
      id: 'doc-kb-2',
      title: 'AI and Machine Learning',
      content: 'Artificial intelligence can analyze patterns in data to make predictions and recommendations. Machine learning models learn from historical data to improve over time.',
      category: 'ai',
      tags: ['ai', 'machine-learning', 'predictions'],
    },
    {
      id: 'doc-kb-3',
      title: 'Cloud Computing Benefits',
      content: 'Cloud computing provides on-demand access to computing resources over the internet. It offers scalability, flexibility, and cost savings for businesses of all sizes.',
      category: 'cloud',
      tags: ['cloud', 'infrastructure', 'scalability'],
    },
    {
      id: 'doc-kb-4',
      title: 'DevOps Best Practices',
      content: 'DevOps practices combine software development and IT operations for faster delivery. Continuous integration and deployment enable rapid iteration and feedback.',
      category: 'devops',
      tags: ['devops', 'ci-cd', 'deployment'],
    },
    {
      id: 'doc-kb-5',
      title: 'Microservices Architecture',
      content: 'Microservices architecture breaks applications into small, independent services. Each service can be developed, deployed, and scaled independently.',
      category: 'architecture',
      tags: ['microservices', 'architecture', 'scalability'],
    },
  ],

  /**
   * Technical documents
   */
  technicalDocuments: [
    {
      id: 'tech-doc-1',
      title: 'API Documentation',
      content: `
        # REST API Reference
        
        ## Authentication
        All API requests require authentication using Bearer tokens.
        
        ## Endpoints
        - GET /api/workflows - List all workflows
        - POST /api/workflows - Create new workflow
        - GET /api/workflows/:id - Get workflow details
        - PUT /api/workflows/:id - Update workflow
        - DELETE /api/workflows/:id - Delete workflow
        
        ## Rate Limits
        - 100 requests per minute per user
        - 1000 requests per hour per organization
      `,
      type: 'api-docs',
    },
    {
      id: 'tech-doc-2',
      title: 'Product Launch Report Q4 2024',
      content: `
        Product Launch Report - Q4 2024
        
        Our new AI-powered workflow automation platform launched successfully in October 2024.
        
        Key Metrics:
        - 500+ beta users signed up in first month
        - 85% user satisfaction rating
        - Average time saved per user: 4 hours/week
        - Revenue: $50,000 in first month
        
        Top Features Used:
        1. Visual workflow builder (78% adoption)
        2. AI agent integration (65% adoption)
        3. Real-time collaboration (52% adoption)
        
        Customer Feedback:
        Users highlighted the automation potential and ease of use as key strengths.
        Main feature request: More integrations with third-party tools.
      `,
      type: 'report',
    },
  ],

  /**
   * Blog posts for content generation
   */
  blogTopics: [
    {
      id: 'topic-1',
      title: 'The Future of Workflow Automation',
      targetAudience: 'business managers',
      tone: 'professional',
      keywords: ['automation', 'efficiency', 'productivity'],
    },
    {
      id: 'topic-2',
      title: '10 AI Tools Every Developer Should Know',
      targetAudience: 'developers',
      tone: 'informative',
      keywords: ['ai', 'tools', 'development'],
    },
    {
      id: 'topic-3',
      title: 'How to Build Scalable Microservices',
      targetAudience: 'technical architects',
      tone: 'technical',
      keywords: ['microservices', 'scalability', 'architecture'],
    },
  ],

  /**
   * Sample Q&A pairs
   */
  qaData: [
    {
      question: 'What is workflow automation?',
      expectedAnswer: 'Workflow automation is the process of streamlining repetitive tasks',
    },
    {
      question: 'How does AI help with data analysis?',
      expectedAnswer: 'AI can analyze patterns in data to make predictions',
    },
    {
      question: 'What are the benefits of cloud computing?',
      expectedAnswer: 'Cloud computing provides scalability, flexibility, and cost savings',
    },
    {
      question: 'What is DevOps?',
      expectedAnswer: 'DevOps combines software development and IT operations',
    },
    {
      question: 'What is microservices architecture?',
      expectedAnswer: 'Microservices breaks applications into small, independent services',
    },
  ],

  /**
   * Sample execution results
   */
  executionResults: {
    successful: {
      id: 'exec-001',
      workflowId: 'wf-123',
      status: 'completed',
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      duration: 5000,
      steps: [
        {
          nodeId: 'trigger_1',
          status: 'completed',
          startTime: Date.now() - 5000,
          endTime: Date.now() - 4500,
          duration: 500,
        },
        {
          nodeId: 'action_1',
          status: 'completed',
          startTime: Date.now() - 4500,
          endTime: Date.now(),
          duration: 4500,
        },
      ],
    },
    failed: {
      id: 'exec-002',
      workflowId: 'wf-123',
      status: 'failed',
      startTime: Date.now() - 3000,
      endTime: Date.now(),
      duration: 3000,
      error: 'Node execution failed: Connection timeout',
      steps: [
        {
          nodeId: 'trigger_1',
          status: 'completed',
          startTime: Date.now() - 3000,
          endTime: Date.now() - 2500,
          duration: 500,
        },
        {
          nodeId: 'action_1',
          status: 'failed',
          startTime: Date.now() - 2500,
          endTime: Date.now(),
          duration: 2500,
          error: 'Connection timeout',
        },
      ],
    },
  },

  /**
   * Sample embeddings (384-dimensional for nomic-embed-text)
   */
  sampleEmbeddings: {
    text1: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
    text2: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
    text3: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
  },

  /**
   * LLM response examples
   */
  llmResponses: {
    poem: 'Automation flows with ease,\nTasks completed, minds at peace,\nEfficiency achieved.',
    
    summary: 'This document discusses workflow automation and its benefits for modern businesses.',
    
    sentiment: 'negative',
    
    rating: '7',
    
    category: 'Technical',
  },
};

/**
 * Generate random test data
 */
export const generators = {
  /**
   * Generate random customer ticket
   */
  generateTicket: () => {
    const subjects = [
      'Login issues',
      'Payment problem',
      'Feature request',
      'Bug report',
      'Account question',
    ];
    const messages = [
      'I need help with my account.',
      'The system is not working properly.',
      'Can you add this feature?',
      'I found a bug in the application.',
      'How do I update my settings?',
    ];
    const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];

    return {
      id: `ticket-${Date.now()}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      createdAt: new Date(),
    };
  },

  /**
   * Generate random review
   */
  generateReview: () => {
    const ratings = [1, 2, 3, 4, 5];
    const texts = [
      'Excellent product!',
      'Good quality.',
      'Average performance.',
      'Not satisfied.',
      'Terrible experience.',
    ];
    const authors = ['User A', 'User B', 'User C', 'User D', 'User E'];

    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    return {
      id: `review-${Date.now()}`,
      rating,
      text: texts[5 - rating],
      author: authors[Math.floor(Math.random() * authors.length)],
      verified: Math.random() > 0.3,
      createdAt: new Date(),
    };
  },

  /**
   * Generate random document
   */
  generateDocument: () => {
    const topics = [
      'artificial intelligence',
      'machine learning',
      'cloud computing',
      'cybersecurity',
      'data science',
    ];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    return {
      id: `doc-${Date.now()}`,
      title: `Article about ${topic}`,
      content: `This is an article discussing ${topic} and its applications in modern technology.`,
      category: topic.replace(' ', '-'),
      createdAt: new Date(),
    };
  },

  /**
   * Generate random embedding vector
   */
  generateEmbedding: (dimensions = 384) => {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  },

  /**
   * Generate batch of items
   */
  generateBatch: <T>(generator: () => T, count: number): T[] => {
    return Array.from({ length: count }, generator);
  },
};
