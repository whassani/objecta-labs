# Workflow Execution Integration Tests

Comprehensive integration tests for all workflow execution features including breakpoints, step-by-step execution, variable inspection, execution history, and Ollama LLM/embedding integration.

## Test Suites

### 1. Basic Execution Tests (`workflow-execution-integration.spec.ts`)
- Simple linear workflow execution
- Branching workflows with conditions
- Loop execution
- Merge nodes
- Error handling

### 2. Advanced Features Tests (`workflow-execution-advanced.spec.ts`)
- **Breakpoints**: Pause execution at specific nodes
- **Conditional Breakpoints**: Break based on conditions
- **Step-by-Step Mode**: Execute one node at a time
- **Variable Inspection**: Capture and inspect variables
- **Execution History**: Save and replay executions
- **WebSocket Streaming**: Real-time execution updates

### 3. Ollama LLM Tests (`workflow-ollama-llm.spec.ts`)
- Basic text generation
- Streaming responses
- Context and variable usage in prompts
- Chained LLM calls
- Conditional logic based on LLM output
- Error handling and retries

### 4. Ollama Embedding Tests (`workflow-ollama-embeddings.spec.ts`)
- Document embedding generation
- Batch embedding processing
- Semantic search workflows
- RAG (Retrieval Augmented Generation)
- Multi-turn RAG conversations
- Similarity comparison
- Hybrid search (keyword + semantic)

### 5. End-to-End Scenarios (`workflow-e2e-scenarios.spec.ts`)
- **Customer Support**: Ticket analysis with sentiment, categorization, and response
- **Content Generation**: Multi-stage content pipeline with quality checks
- **Data Processing**: Batch processing with loops and aggregation
- **Document Intelligence**: RAG-based document Q&A
- **Multi-Agent Collaboration**: Coordinated AI agents

## Prerequisites

### Required
- Node.js 18+ with npm
- PostgreSQL database
- Backend application configured

### Optional (for LLM/Embedding tests)
- Ollama installed and running
- Models: `llama2`, `nomic-embed-text`

### Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull required models
ollama pull llama2
ollama pull nomic-embed-text
```

## Running Tests

### Quick Start
```bash
cd backend/test/workflows
./run-tests.sh
```

### Run Specific Test Suites

```bash
# All tests
npm test -- test/workflows/*.spec.ts

# Basic execution only
npm test -- test/workflows/workflow-execution-integration.spec.ts

# Advanced features
npm test -- test/workflows/workflow-execution-advanced.spec.ts

# Ollama LLM tests
npm test -- test/workflows/workflow-ollama-llm.spec.ts

# Ollama embedding tests
npm test -- test/workflows/workflow-ollama-embeddings.spec.ts

# End-to-end scenarios
npm test -- test/workflows/workflow-e2e-scenarios.spec.ts
```

### With Coverage
```bash
npm run test:cov -- test/workflows/*.spec.ts --config=test/workflows/jest.config.js
```

## Test Structure

```
test/workflows/
├── workflow-execution-integration.spec.ts    # Basic execution tests
├── workflow-execution-advanced.spec.ts       # Advanced features
├── workflow-ollama-llm.spec.ts              # LLM integration
├── workflow-ollama-embeddings.spec.ts       # Embedding integration
├── workflow-e2e-scenarios.spec.ts           # End-to-end scenarios
├── utils/
│   └── test-helpers.ts                      # Test utilities
├── jest.config.js                           # Jest configuration
├── jest.setup.ts                            # Test setup
├── run-tests.sh                             # Test runner script
└── README.md                                # This file
```

## Test Helpers

The `TestHelpers` class provides utilities:

```typescript
import { TestHelpers } from './utils/test-helpers';

// Check Ollama availability
const available = await TestHelpers.checkOllamaAvailability();

// Get available models
const models = await TestHelpers.getAvailableModels();

// Create test workflows
const workflow = TestHelpers.createSimpleWorkflow({
  name: 'Test',
  organizationId: 'org-1',
});

// Verify execution
TestHelpers.verifyExecutionSuccess(execution);

// Verify LLM output
TestHelpers.verifyLLMOutput(step.output, {
  minLength: 10,
  contains: ['keyword'],
});

// Verify embeddings
TestHelpers.verifyEmbedding(embedding, {
  minDimensions: 100,
});
```

## Environment Variables

```bash
# Ollama URL (default: http://localhost:11434)
export OLLAMA_URL=http://localhost:11434

# Database connection
export DATABASE_URL=postgresql://user:pass@localhost:5432/testdb

# Test timeout (milliseconds)
export TEST_TIMEOUT=300000
```

## Custom Matchers

Jest custom matchers are available:

```typescript
// Check valid execution
expect(execution).toBeValidExecution();

// Check valid LLM output
expect(step).toHaveValidLLMOutput();

// Check valid embedding
expect(embedding).toHaveValidEmbedding();
```

## Test Scenarios

### Scenario 1: Customer Support Ticket Analysis
Tests a complete support workflow:
1. Analyze sentiment (negative/positive/neutral)
2. Categorize issue (Technical/Billing/Account/General)
3. Determine priority based on sentiment
4. Search knowledge base using embeddings
5. Generate personalized response with LLM

### Scenario 2: Content Generation Pipeline
Tests multi-stage content creation:
1. Generate outline with LLM
2. Write full content based on outline
3. Quality check and rating
4. Conditional revision if needed
5. Generate SEO keywords

### Scenario 3: Data Processing with Aggregation
Tests batch processing:
1. Loop through multiple reviews
2. Analyze sentiment for each
3. Predict ratings
4. Aggregate statistics
5. Generate summary report

### Scenario 4: Document Intelligence
Tests RAG-based Q&A:
1. Extract key information from document
2. Generate and store embeddings
3. Loop through user questions
4. Semantic search for relevant context
5. Generate answers with retrieved context

### Scenario 5: Multi-Agent Collaboration
Tests coordinated AI agents:
1. Planner agent creates strategy
2. Creative agent generates ideas
3. Analyst agent evaluates feasibility
4. Synthesizer agent combines insights

## Test Execution Features

All scenarios test:
- ✅ Breakpoint functionality
- ✅ Step-by-step execution
- ✅ Variable capture and inspection
- ✅ Execution history
- ✅ WebSocket streaming (backend mode)
- ✅ Error handling
- ✅ Context passing between nodes
- ✅ Conditional branching
- ✅ Loop execution
- ✅ Merge nodes

## Performance Notes

### Test Timeouts
- Basic tests: 10 seconds
- LLM tests: 30-60 seconds
- Complex scenarios: 180-300 seconds
- Batch processing: Up to 5 minutes

### Ollama Performance
- First run may be slower (model loading)
- Subsequent runs are faster (model cached)
- Embedding generation: ~100ms per document
- LLM generation: 1-5 seconds per response

## Troubleshooting

### Ollama Not Available
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull missing models
ollama pull llama2
ollama pull nomic-embed-text
```

### Tests Timing Out
```bash
# Increase timeout
export TEST_TIMEOUT=600000

# Or in code
jest.setTimeout(600000);
```

### Database Connection Issues
```bash
# Check database is running
psql -h localhost -U user -d testdb

# Reset test database
npm run db:reset:test
```

### Memory Issues with Large Tests
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Workflow Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      ollama:
        image: ollama/ollama:latest
        ports:
          - 11434:11434
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Pull Ollama models
        run: |
          ollama pull llama2
          ollama pull nomic-embed-text
      
      - name: Run tests
        run: npm test -- test/workflows/*.spec.ts
```

## Coverage Reports

```bash
# Generate coverage
npm run test:cov -- test/workflows/*.spec.ts

# View HTML report
open coverage/workflows/index.html
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Use TestHelpers for common operations
3. Add proper test descriptions
4. Include cleanup in `afterEach`
5. Handle Ollama unavailability gracefully
6. Document complex scenarios
7. Add tests to appropriate suite

## Support

For issues or questions:
- Check logs in `backend/logs/`
- Review test output for failures
- Verify Ollama models are available
- Check database connections
- Ensure environment variables are set
