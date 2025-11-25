/**
 * Mock Scenario Data
 * Complete datasets for end-to-end scenario testing
 */

export const mockScenarios = {
  /**
   * Customer Support Scenario
   */
  customerSupport: {
    tickets: [
      {
        id: 'ticket-cs-001',
        ticketNumber: 'CS-2024-001',
        customer: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          accountId: 'ACC-12345',
          tier: 'premium',
        },
        subject: 'Cannot access dashboard after password reset',
        message: `I reset my password 30 minutes ago but I still cannot log into the dashboard. 
                  I've tried clearing my cache and using different browsers. 
                  This is urgent as I need to access my reports for a meeting in 2 hours!`,
        category: 'unknown',
        priority: 'unknown',
        sentiment: 'unknown',
        status: 'new',
        createdAt: new Date('2024-01-15T09:30:00'),
        tags: ['login', 'password', 'urgent'],
      },
      {
        id: 'ticket-cs-002',
        ticketNumber: 'CS-2024-002',
        customer: {
          name: 'Sarah Johnson',
          email: 'sarah.j@techcorp.com',
          accountId: 'ACC-67890',
          tier: 'enterprise',
        },
        subject: 'Feature request: Export data in multiple formats',
        message: `Your product is fantastic! We've been using it for 6 months and love it.
                  One feature that would be really helpful is the ability to export reports 
                  in multiple formats (CSV, Excel, PDF). Currently only PDF is available.`,
        category: 'unknown',
        priority: 'unknown',
        sentiment: 'unknown',
        status: 'new',
        createdAt: new Date('2024-01-15T10:15:00'),
        tags: ['feature-request', 'export', 'reports'],
      },
      {
        id: 'ticket-cs-003',
        ticketNumber: 'CS-2024-003',
        customer: {
          name: 'Mike Davis',
          email: 'mdavis@startup.io',
          accountId: 'ACC-11122',
          tier: 'standard',
        },
        subject: 'Billing discrepancy - charged twice',
        message: `I noticed I was charged twice on January 10th. My credit card shows two charges 
                  of $99.00 each. I should only have one subscription. Please refund the duplicate 
                  charge as soon as possible.`,
        category: 'unknown',
        priority: 'unknown',
        sentiment: 'unknown',
        status: 'new',
        createdAt: new Date('2024-01-15T11:00:00'),
        tags: ['billing', 'refund', 'duplicate-charge'],
      },
    ],
    
    knowledgeBase: [
      {
        id: 'kb-001',
        title: 'Password Reset Troubleshooting',
        content: `If you're having trouble logging in after a password reset:
                  1. Wait 5 minutes for the change to propagate
                  2. Clear your browser cache and cookies
                  3. Try incognito/private browsing mode
                  4. Check your spam folder for the confirmation email
                  5. Contact support if issues persist after 30 minutes`,
        category: 'authentication',
        helpful: 156,
        views: 2341,
      },
      {
        id: 'kb-002',
        title: 'Exporting Reports',
        content: `To export reports:
                  1. Navigate to the Reports section
                  2. Select the report you want to export
                  3. Click the Export button in the top right
                  4. Choose your format (PDF, CSV coming soon)
                  5. The file will download automatically`,
        category: 'reports',
        helpful: 89,
        views: 1456,
      },
      {
        id: 'kb-003',
        title: 'Billing and Subscriptions',
        content: `For billing issues:
                  - View invoices in Account Settings > Billing
                  - Update payment method in the same section
                  - For duplicate charges, contact support with transaction IDs
                  - Refunds typically process within 5-7 business days`,
        category: 'billing',
        helpful: 234,
        views: 3567,
      },
    ],
  },

  /**
   * Content Generation Scenario
   */
  contentGeneration: {
    topics: [
      {
        id: 'topic-001',
        title: 'The Future of AI in Business Automation',
        targetAudience: 'business executives',
        tone: 'professional and visionary',
        keywords: ['AI', 'automation', 'business transformation', 'ROI', 'efficiency'],
        wordCount: 800,
        outline: null,
        draft: null,
        final: null,
      },
      {
        id: 'topic-002',
        title: 'Best Practices for API Integration',
        targetAudience: 'software developers',
        tone: 'technical and practical',
        keywords: ['API', 'integration', 'REST', 'authentication', 'error handling'],
        wordCount: 1200,
        outline: null,
        draft: null,
        final: null,
      },
      {
        id: 'topic-003',
        title: 'How to Choose the Right Cloud Provider',
        targetAudience: 'IT managers',
        tone: 'analytical and helpful',
        keywords: ['cloud', 'AWS', 'Azure', 'GCP', 'comparison', 'costs'],
        wordCount: 1000,
        outline: null,
        draft: null,
        final: null,
      },
    ],
    
    seoGuidelines: {
      titleLength: { min: 50, max: 60 },
      metaDescriptionLength: { min: 150, max: 160 },
      keywordDensity: { min: 0.01, max: 0.03 },
      headingsRequired: ['H1', 'H2', 'H3'],
      minWordCount: 500,
    },
  },

  /**
   * Data Processing Scenario
   */
  dataProcessing: {
    reviews: [
      {
        id: 'rev-001',
        productId: 'PROD-AI-TOOL',
        productName: 'AI Workflow Assistant',
        rating: 5,
        title: 'Game changer for our team!',
        review: `This AI tool has completely transformed how our team works. 
                We've automated 80% of our repetitive tasks and saved countless hours.
                The interface is intuitive, setup was easy, and the results are amazing.
                Highly recommend to any team looking to boost productivity!`,
        author: 'Emily Chen',
        verified: true,
        helpful: 45,
        date: new Date('2024-01-10'),
      },
      {
        id: 'rev-002',
        productId: 'PROD-AI-TOOL',
        productName: 'AI Workflow Assistant',
        rating: 2,
        title: 'Not worth the steep learning curve',
        review: `I was excited to try this tool but found it incredibly difficult to set up.
                The documentation is lacking and customer support was slow to respond.
                After two weeks, I still can't get it to work properly with our systems.
                Very disappointed given the high price point.`,
        author: 'Robert Martinez',
        verified: true,
        helpful: 12,
        date: new Date('2024-01-11'),
      },
      {
        id: 'rev-003',
        productId: 'PROD-AI-TOOL',
        productName: 'AI Workflow Assistant',
        rating: 4,
        title: 'Solid product with room for improvement',
        review: `Overall a good tool that does what it promises. The automation features work well
                and we've seen measurable time savings. However, the mobile app needs work and
                I'd like to see more integration options. Support has been responsive when needed.`,
        author: 'Lisa Thompson',
        verified: true,
        helpful: 28,
        date: new Date('2024-01-12'),
      },
      {
        id: 'rev-004',
        productId: 'PROD-AI-TOOL',
        productName: 'AI Workflow Assistant',
        rating: 5,
        title: 'Exceeded expectations in every way',
        review: `I've been using automation tools for years and this is by far the best.
                The AI capabilities are impressive, the workflow builder is powerful yet simple,
                and the analytics give great insights. ROI was positive within the first month!`,
        author: 'David Park',
        verified: true,
        helpful: 67,
        date: new Date('2024-01-13'),
      },
      {
        id: 'rev-005',
        productId: 'PROD-AI-TOOL',
        productName: 'AI Workflow Assistant',
        rating: 1,
        title: 'Buggy and unreliable',
        review: `Constant crashes, workflows fail randomly, and data sometimes gets corrupted.
                Support tickets go unanswered for days. I regret purchasing this and will be
                looking for alternatives. Save your money and look elsewhere.`,
        author: 'Jennifer Wilson',
        verified: false,
        helpful: 8,
        date: new Date('2024-01-14'),
      },
    ],
    
    aggregationMetrics: {
      totalReviews: 5,
      averageRating: null,
      ratingDistribution: null,
      sentimentBreakdown: null,
      verifiedPercentage: null,
    },
  },

  /**
   * Document Intelligence Scenario
   */
  documentIntelligence: {
    documents: [
      {
        id: 'doc-001',
        title: 'Q4 2024 Product Launch Report',
        type: 'business-report',
        content: `
Executive Summary

Our new AI-powered workflow automation platform launched successfully on October 15, 2024.

Key Performance Indicators:
• Beta Program: 500+ users signed up in the first month
• User Satisfaction: 85% reported being "very satisfied" or "extremely satisfied"
• Time Savings: Average of 4 hours per week per user
• Revenue: $50,000 MRR by end of Q4
• Churn Rate: 3% (below industry average of 5%)

Top Features by Adoption:
1. Visual Workflow Builder - 78% of active users
2. AI Agent Integration - 65% of active users
3. Real-time Collaboration - 52% of active users
4. Analytics Dashboard - 48% of active users
5. API Integration - 35% of active users

Customer Feedback Highlights:
• "Easiest automation tool I've ever used"
• "The AI suggestions are surprisingly accurate"
• "Saved our team 20+ hours per week"
• "Integration with our existing tools was seamless"

Areas for Improvement:
• Mobile app experience (requested by 42% of users)
• More third-party integrations (requested by 38% of users)
• Advanced analytics features (requested by 25% of users)

Marketing Performance:
• Website Traffic: 50,000 unique visitors
• Conversion Rate: 2.5% (industry average 2%)
• CAC (Customer Acquisition Cost): $450
• LTV (Lifetime Value): $3,600
• LTV/CAC Ratio: 8:1 (healthy ratio)

Next Quarter Goals:
1. Reach 1,000 active users
2. Launch mobile applications (iOS and Android)
3. Add 10 new third-party integrations
4. Achieve 90% user satisfaction
5. Reduce churn to 2%
        `,
        metadata: {
          author: 'Product Team',
          department: 'Product Management',
          confidential: false,
          version: '1.0',
        },
        createdAt: new Date('2024-12-15'),
      },
      {
        id: 'doc-002',
        title: 'Technical Architecture Documentation',
        type: 'technical-docs',
        content: `
System Architecture Overview

Technology Stack:
• Frontend: Next.js 14, React 18, TypeScript, TailwindCSS
• Backend: NestJS, Node.js, TypeScript
• Database: PostgreSQL 15, Redis
• Vector Store: Qdrant
• AI/ML: Ollama (llama2, nomic-embed-text)
• Infrastructure: Docker, Kubernetes, AWS

Architecture Patterns:
1. Microservices Architecture
   - Separate services for workflows, agents, knowledge base
   - API Gateway for routing and authentication
   - Event-driven communication via message queue

2. CQRS (Command Query Responsibility Segregation)
   - Separate read and write operations
   - Optimized query performance
   - Event sourcing for audit trail

3. RAG (Retrieval Augmented Generation)
   - Vector embeddings for semantic search
   - Context-aware LLM responses
   - Hybrid search (keyword + semantic)

Security Measures:
• JWT-based authentication
• Role-based access control (RBAC)
• Encryption at rest and in transit
• Rate limiting and DDoS protection
• Regular security audits

Performance Targets:
• API Response Time: <100ms (p95)
• Workflow Execution: <5s for simple workflows
• Concurrent Users: 10,000+
• Database Queries: <50ms (p95)
• Uptime: 99.9% SLA

Scalability:
• Horizontal scaling with Kubernetes
• Auto-scaling based on CPU/memory metrics
• Database read replicas for query load
• CDN for static assets
• Caching strategy (Redis)
        `,
        metadata: {
          author: 'Engineering Team',
          department: 'Engineering',
          confidential: true,
          version: '2.1',
        },
        createdAt: new Date('2024-11-20'),
      },
    ],
    
    questions: [
      'What was the user satisfaction rating in Q4 2024?',
      'How much revenue was generated by end of Q4?',
      'What are the top 3 features by adoption?',
      'What improvements did customers request?',
      'What technology stack is used for the frontend?',
      'What are the performance targets for API response time?',
      'What security measures are implemented?',
      'What is the churn rate compared to industry average?',
    ],
  },

  /**
   * Multi-Agent Collaboration Scenario
   */
  multiAgent: {
    projects: [
      {
        id: 'proj-001',
        title: 'Mobile App for Fitness Tracking',
        description: 'Design and develop a mobile application for tracking workouts, nutrition, and progress',
        requirements: [
          'Track workouts with exercise library',
          'Log daily nutrition and calories',
          'Progress tracking with charts',
          'Social features to share achievements',
          'Integration with wearable devices',
        ],
        constraints: {
          budget: '$50,000',
          timeline: '6 months',
          team: '3 developers, 1 designer',
        },
      },
      {
        id: 'proj-002',
        title: 'E-commerce Platform Redesign',
        description: 'Modernize existing e-commerce platform with improved UX and performance',
        requirements: [
          'Mobile-first responsive design',
          'One-click checkout',
          'AI-powered product recommendations',
          'Real-time inventory management',
          'Multi-currency support',
        ],
        constraints: {
          budget: '$100,000',
          timeline: '9 months',
          team: '5 developers, 2 designers, 1 PM',
        },
      },
    ],
    
    agentRoles: {
      planner: {
        name: 'Strategic Planner',
        expertise: 'Project planning, requirements analysis, risk assessment',
        responsibilities: 'Create project plan, identify milestones, assess feasibility',
      },
      designer: {
        name: 'UX/UI Designer',
        expertise: 'User experience, interface design, usability',
        responsibilities: 'Design user flows, create mockups, ensure usability',
      },
      developer: {
        name: 'Technical Developer',
        expertise: 'Software development, architecture, implementation',
        responsibilities: 'Assess technical complexity, estimate effort, identify challenges',
      },
      analyst: {
        name: 'Business Analyst',
        expertise: 'Business analysis, ROI calculation, market research',
        responsibilities: 'Evaluate business value, calculate costs, assess market fit',
      },
    },
  },
};

/**
 * Helper functions for scenario data
 */
export const scenarioHelpers = {
  /**
   * Get support tickets by priority
   */
  getTicketsByPriority: (priority: string) => {
    return mockScenarios.customerSupport.tickets.filter(
      t => t.priority === priority
    );
  },

  /**
   * Get reviews by rating
   */
  getReviewsByRating: (minRating: number) => {
    return mockScenarios.dataProcessing.reviews.filter(
      r => r.rating >= minRating
    );
  },

  /**
   * Calculate average rating
   */
  calculateAverageRating: () => {
    const reviews = mockScenarios.dataProcessing.reviews;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  },

  /**
   * Get sentiment breakdown
   */
  getSentimentBreakdown: () => {
    const reviews = mockScenarios.dataProcessing.reviews;
    return {
      positive: reviews.filter(r => r.rating >= 4).length,
      neutral: reviews.filter(r => r.rating === 3).length,
      negative: reviews.filter(r => r.rating <= 2).length,
    };
  },

  /**
   * Search documents by keyword
   */
  searchDocuments: (keyword: string) => {
    return mockScenarios.documentIntelligence.documents.filter(
      d => d.content.toLowerCase().includes(keyword.toLowerCase())
    );
  },

  /**
   * Extract metrics from document
   */
  extractMetrics: (documentId: string) => {
    const doc = mockScenarios.documentIntelligence.documents.find(
      d => d.id === documentId
    );
    if (!doc) return null;

    // Extract numbers and percentages from content
    const numbers = doc.content.match(/\d+\.?\d*%?/g) || [];
    const metrics = doc.content.match(/\d+,?\d*\+?/g) || [];
    
    return { numbers, metrics };
  },
};
