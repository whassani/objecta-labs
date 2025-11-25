# Test Fixtures and Mock Data

This directory contains comprehensive mock data and fixtures for testing workflow execution features.

## Files Overview

### `mock-data.ts`
Basic mock data for common entities:
- Organizations
- Users
- Support tickets
- Product reviews
- Knowledge base documents
- Technical documents
- Blog topics
- Q&A pairs
- Execution results
- Sample embeddings
- LLM responses

**Data Generators:**
- `generateTicket()` - Random support ticket
- `generateReview()` - Random product review
- `generateDocument()` - Random document
- `generateEmbedding()` - Random vector embedding
- `generateBatch()` - Batch of items

### `mock-workflows.ts`
Pre-built workflow definitions:
- `simpleLinear` - Basic sequential workflow
- `conditionalBranch` - If/else branching
- `loopExecution` - Iteration workflow
- `llmGeneration` - LLM text generation
- `embeddingGeneration` - Document embedding
- `ragWorkflow` - RAG question answering
- `withBreakpoint` - Debugging workflow
- `multiAgent` - Multi-agent collaboration

### `mock-scenarios.ts`
Complete datasets for end-to-end scenarios:
- **Customer Support** - Tickets and knowledge base
- **Content Generation** - Topics and SEO guidelines
- **Data Processing** - Product reviews and metrics
- **Document Intelligence** - Documents and questions
- **Multi-Agent** - Projects and agent roles

**Helper Functions:**
- `getTicketsByPriority()`
- `getReviewsByRating()`
- `calculateAverageRating()`
- `getSentimentBreakdown()`
- `searchDocuments()`
- `extractMetrics()`

### `seed-data.ts`
Database seeding utilities:
- `SeedDataGenerator` - Generate complete test data
- `quickSeed` - Quick seed functions for common scenarios
- `DatabaseSeeder` - Database seeding utility

**Methods:**
- `seedAll()` - Seed complete database
- `seedOrganizations()` - Seed organizations
- `seedUsers()` - Seed users
- `seedWorkflows()` - Seed workflows
- `seedExecutions()` - Seed executions
- `seedKnowledgeBase()` - Seed documents
- `seedVectors()` - Seed embeddings
- `cleanAll()` - Clean all test data

**Quick Seed Functions:**
- `minimal()` - Minimal data for quick tests
- `llm()` - Data for LLM tests
- `embeddings()` - Data for embedding tests
- `scenarios()` - Data for scenario tests
- `advanced()` - Data for advanced features

### `mock-api-responses.ts`
Mock API responses for testing:
- **Ollama API** - Generate, embeddings, streaming
- **Workflow API** - CRUD, execute, history
- **Vector Store** - Store, search
- **WebSocket** - Event messages
- **Errors** - Various error responses

**Response Generators:**
- `ollamaGenerate()` - Mock LLM response
- `ollamaEmbedding()` - Mock embedding
- `workflowExecution()` - Mock execution
- `vectorSearchResults()` - Mock search results
- `executionHistory()` - Mock history

### `index.ts`
Central export for all fixtures:
```typescript
import fixtures from './fixtures';

// Access all fixtures
fixtures.data
fixtures.workflows
fixtures.scenarios
fixtures.generators
fixtures.seedGenerator
fixtures.quickSeed
fixtures.databaseSeeder
```

## Usage Examples

### Import Fixtures
```typescript
import { mockData, mockWorkflows, mockScenarios } from './fixtures';
import { SeedDataGenerator, quickSeed } from './fixtures/seed-data';
import { TestHelpers } from '../utils/test-helpers';
```

### Use Mock Data
```typescript
// Get support tickets
const tickets = mockData.supportTickets;

// Generate random ticket
const newTicket = mockData.generators.generateTicket();

// Get workflow definition
const workflow = mockWorkflows.llmGeneration;
```

### Seed Database
```typescript
// Quick seed for LLM tests
const data = await quickSeed.llm();

// Full database seed
const results = await DatabaseSeeder.seed();

// Seed specific data
const workflows = await SeedDataGenerator.seedWorkflows();
const vectors = await SeedDataGenerator.seedVectors();
```

### Use Scenarios
```typescript
// Customer support scenario
const { tickets, knowledgeBase } = mockScenarios.customerSupport;

// Get sentiment breakdown
const sentiment = scenarioHelpers.getSentimentBreakdown();
```

### Mock API Responses
```typescript
import { mockApiResponses, mockResponseGenerators } from './fixtures/mock-api-responses';

// Use predefined response
const response = mockApiResponses.ollama.generate.success;

// Generate custom response
const customResponse = mockResponseGenerators.ollamaGenerate('Your prompt');
```

## Data Statistics

### Mock Data Counts
- Organizations: 2
- Users: 2
- Support Tickets: 3
- Product Reviews: 5
- Knowledge Base Documents: 5
- Technical Documents: 2
- Blog Topics: 3
- Q&A Pairs: 5

### Workflow Definitions
- Total Workflows: 8
- Simple Workflows: 3
- LLM Workflows: 2
- Embedding Workflows: 2
- Complex Workflows: 1

### Scenario Data
- Customer Support Tickets: 3
- Knowledge Base Articles: 3
- Content Topics: 3
- Product Reviews: 5
- Technical Documents: 2
- Multi-Agent Projects: 2

## Best Practices

### For Tests
1. Import only what you need
2. Use quick seed for simple tests
3. Use full seed for integration tests
4. Clean data after tests
5. Use generators for dynamic data

### For Scenarios
1. Use realistic data
2. Include edge cases
3. Vary data types
4. Include error cases
5. Document expected outcomes

### For Performance
1. Seed once per test suite
2. Clean only when needed
3. Use transactions for isolation
4. Cache frequently used data
5. Generate data on-demand

## Maintenance

### Adding New Data
1. Add to appropriate file
2. Export from index.ts
3. Document in README
4. Add to seed functions
5. Test with actual usage

### Updating Data
1. Check for breaking changes
2. Update dependent tests
3. Verify seed functions
4. Test scenarios
5. Update documentation

## Troubleshooting

### Data Not Found
- Check import paths
- Verify exports in index.ts
- Ensure seed was run
- Check database connection

### Seed Failures
- Verify database is running
- Check foreign key constraints
- Ensure clean state
- Review error messages

### Stale Data
- Run clean before seed
- Check cache
- Verify timestamps
- Reset database if needed
