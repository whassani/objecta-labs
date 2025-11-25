# 🧪 Workflow Execution Integration Tests - Complete

## ✅ Implementation Complete

Comprehensive integration test suite covering all workflow execution features with Ollama LLM and embedding integration.

## 📋 Test Coverage

### Test Suites Created

| Test Suite | File | Tests | Purpose |
|------------|------|-------|---------|
| **Basic Execution** | `workflow-execution-integration.spec.ts` | 2 | Linear workflows, branching, conditions |
| **Advanced Features** | `workflow-execution-advanced.spec.ts` | 6 | Breakpoints, step mode, variables, history, WebSocket |
| **Ollama LLM** | `workflow-ollama-llm.spec.ts` | 7 | Text generation, streaming, context, conditions, errors |
| **Ollama Embeddings** | `workflow-ollama-embeddings.spec.ts` | 6 | Embeddings, semantic search, RAG, similarity, hybrid search |
| **E2E Scenarios** | `workflow-e2e-scenarios.spec.ts` | 5 | Real-world complete workflows |

**Total: 26 comprehensive integration tests**

## 🎯 Features Tested

### 1. ✅ Breakpoint Execution
```typescript
it('should pause execution at breakpoint and resume', async () => {
  // Tests:
  // - Setting breakpoints on nodes
  // - Pausing when breakpoint is hit
  // - Resuming execution
  // - Verifying execution state
});

it('should evaluate conditional breakpoint', async () => {
  // Tests:
  // - Conditional breakpoint expressions
  // - Breaking only when condition is true
  // - Loop iteration tracking
});
```

### 2. ✅ Step-by-Step Execution
```typescript
it('should execute workflow in step mode', async () => {
  // Tests:
  // - Step-by-step mode activation
  // - Executing one node at a time
  // - Waiting for step command
  // - Tracking current node
});
```

### 3. ✅ Variable Inspection
```typescript
it('should capture variables at each node execution', async () => {
  // Tests:
  // - Variable snapshots at each node
  // - Input/output tracking
  // - Context variable propagation
  // - Data transformation verification
});
```

### 4. ✅ Execution History
```typescript
it('should save execution history with full state', async () => {
  // Tests:
  // - History saving on completion
  // - Multiple execution tracking
  // - Full state restoration
  // - Replay functionality
});
```

### 5. ✅ WebSocket Real-time Updates
```typescript
it('should stream execution events via WebSocket', async () => {
  // Tests:
  // - WebSocket connection
  // - Event streaming (node-start, node-complete, etc.)
  // - Real-time UI updates
  // - Connection management
});
```

### 6. ✅ Ollama LLM Integration
```typescript
it('should generate text using Ollama', async () => {
  // Tests:
  // - LLM node execution
  // - Text generation
  // - Model configuration
  // - Output validation
});

it('should chain multiple LLM calls with context', async () => {
  // Tests:
  // - Context passing between LLM nodes
  // - Multi-step reasoning
  // - Variable usage in prompts
});
```

### 7. ✅ Ollama Embeddings
```typescript
it('should embed documents using Ollama', async () => {
  // Tests:
  // - Document embedding generation
  // - Batch processing
  // - Vector storage
  // - Embedding validation
});

it('should perform semantic search using embeddings', async () => {
  // Tests:
  // - Query embedding
  // - Vector similarity search
  // - Result ranking
  // - Relevance scoring
});
```

### 8. ✅ RAG (Retrieval Augmented Generation)
```typescript
it('should perform RAG query with retrieval and generation', async () => {
  // Tests:
  // - Knowledge base retrieval
  // - Context-aware generation
  // - Answer quality
  // - End-to-end RAG pipeline
});
```

## 🚀 Quick Start

### Prerequisites

1. **Install Ollama** (for LLM/embedding tests):
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull required models
ollama pull llama2
ollama pull nomic-embed-text
```

2. **Setup Backend**:
```bash
cd backend
npm install
```

### Run Tests

#### Interactive Test Runner
```bash
cd backend/test/workflows
./run-tests.sh
```

This provides a menu:
```
Select test suite to run:
  1) All tests (complete integration)
  2) Basic execution tests only
  3) Advanced features (breakpoints, step mode, variables, history)
  4) Ollama LLM tests
  5) Ollama embedding tests
  6) End-to-end scenarios
  7) Quick smoke test
```

#### Run All Tests
```bash
npm test -- test/workflows/*.spec.ts
```

#### Run Specific Suite
```bash
# Basic execution
npm test -- test/workflows/workflow-execution-integration.spec.ts

# Advanced features
npm test -- test/workflows/workflow-execution-advanced.spec.ts

# Ollama LLM
npm test -- test/workflows/workflow-ollama-llm.spec.ts

# Ollama embeddings
npm test -- test/workflows/workflow-ollama-embeddings.spec.ts

# E2E scenarios
npm test -- test/workflows/workflow-e2e-scenarios.spec.ts
```

#### With Coverage
```bash
npm run test:cov -- test/workflows/*.spec.ts --config=test/workflows/jest.config.js
```

## 📊 Test Scenarios

### Scenario 1: Customer Support Ticket Analysis ⭐
**File**: `workflow-e2e-scenarios.spec.ts`

Complete support ticket workflow:
```
Incoming Ticket
    ├─> Analyze Sentiment (LLM)
    ├─> Categorize Issue (LLM)
    ├─> Check Priority (Condition)
    │   ├─> High Priority (if negative)
    │   └─> Normal Priority (if positive/neutral)
    ├─> Merge Paths
    ├─> Embed Query
    ├─> Search Knowledge Base (Vector Search)
    ├─> Generate Response (LLM with context)
    └─> Log Result
```

**Tests**:
- Sentiment analysis (negative/positive/neutral)
- Issue categorization
- Priority determination
- Knowledge base search
- Context-aware response generation

### Scenario 2: Content Generation Pipeline ⭐
**File**: `workflow-e2e-scenarios.spec.ts`

Multi-stage content creation:
```
Start
    ├─> Generate Outline (LLM)
    ├─> Generate Full Content (LLM)
    ├─> Quality Review (LLM rating)
    ├─> Quality Check (Condition)
    │   ├─> Mark Approved (if rating >= 7)
    │   └─> Revise Content (if rating < 7)
    └─> Generate SEO Keywords (LLM)
```

**Tests**:
- Outline generation
- Content expansion
- Quality assessment
- Conditional revision
- SEO optimization

### Scenario 3: Batch Data Processing ⭐
**File**: `workflow-e2e-scenarios.spec.ts`

Review analysis with aggregation:
```
Start
    ├─> Initialize Results
    ├─> Loop Through Reviews
    │   ├─> Analyze Sentiment (LLM)
    │   ├─> Predict Rating (LLM)
    │   └─> Store Result
    ├─> Calculate Statistics
    └─> Generate Summary (LLM)
```

**Tests**:
- Loop execution (5 iterations)
- Individual sentiment analysis
- Rating prediction
- Result aggregation
- Summary generation

### Scenario 4: Document Intelligence ⭐
**File**: `workflow-e2e-scenarios.spec.ts`

RAG-based document Q&A:
```
New Document
    ├─> Extract Key Info (LLM)
    ├─> Embed Document
    ├─> Store in Vector DB
    ├─> Prepare Questions
    └─> Loop Through Questions
        ├─> Embed Question
        ├─> Search Document (Vector)
        └─> Generate Answer (LLM + context)
```

**Tests**:
- Information extraction
- Document embedding
- Multi-question handling
- Semantic search
- Context-aware answers

### Scenario 5: Multi-Agent Collaboration ⭐
**File**: `workflow-e2e-scenarios.spec.ts`

Coordinated AI agents:
```
Task Input
    ├─> Planner Agent (creates strategy)
    ├─> Creative Agent (generates ideas)
    ├─> Analyst Agent (evaluates feasibility)
    └─> Synthesizer Agent (combines insights)
```

**Tests**:
- Agent coordination
- Context passing
- Role-specific outputs
- Final synthesis

## 🛠️ Test Utilities

### TestHelpers Class

Location: `backend/test/workflows/utils/test-helpers.ts`

```typescript
import { TestHelpers } from './utils/test-helpers';

// Check Ollama availability
const available = await TestHelpers.checkOllamaAvailability();
// Returns: boolean

// Get available models
const models = await TestHelpers.getAvailableModels();
// Returns: string[] - e.g., ['llama2', 'nomic-embed-text']

// Ensure model is available
await TestHelpers.ensureModelAvailable('llama2');
// Pulls model if not present

// Create test workflows
const simpleWorkflow = TestHelpers.createSimpleWorkflow({
  name: 'Test Workflow',
  organizationId: 'org-123',
  nodeCount: 5,
});

const llmWorkflow = TestHelpers.createLLMWorkflow({
  name: 'LLM Test',
  organizationId: 'org-123',
  model: 'llama2',
  prompt: 'Write a poem about {{topic}}',
});

const embeddingWorkflow = TestHelpers.createEmbeddingWorkflow({
  name: 'Embedding Test',
  organizationId: 'org-123',
  documents: [
    { id: 'doc1', text: 'Document content...' },
  ],
});

const ragWorkflow = TestHelpers.createRAGWorkflow({
  name: 'RAG Test',
  organizationId: 'org-123',
  question: 'What is workflow automation?',
  collection: 'knowledge-base',
});

// Verification helpers
TestHelpers.verifyExecutionSuccess(execution);
// Checks: status='completed', has steps, has timestamps

TestHelpers.verifyLLMOutput(output, {
  minLength: 10,
  maxLength: 1000,
  contains: ['keyword1', 'keyword2'],
  notContains: ['badword'],
});
// Validates LLM text output

TestHelpers.verifyEmbedding(embedding, {
  expectedDimensions: 768,
  minDimensions: 100,
  maxDimensions: 2000,
});
// Validates embedding vectors

// Utility functions
await TestHelpers.waitForCondition(
  () => execution.status === 'completed',
  { timeout: 10000, interval: 100 }
);

await TestHelpers.sleep(1000);

const similarity = TestHelpers.cosineSimilarity(vec1, vec2);
// Returns: number (0-1)

const testData = TestHelpers.generateTestData('text', 10);
// Generates: 10 random text strings
```

### Custom Jest Matchers

```typescript
// Check valid execution
expect(execution).toBeValidExecution();

// Check valid LLM output
expect(step).toHaveValidLLMOutput();

// Check valid embedding
expect(embedding).toHaveValidEmbedding();
```

## 📁 File Structure

```
backend/test/workflows/
├── workflow-execution-integration.spec.ts    # Basic execution tests
│   ├── Simple linear workflow
│   └── Branching with conditions
│
├── workflow-execution-advanced.spec.ts       # Advanced features
│   ├── Breakpoint execution
│   ├── Step-by-step mode
│   ├── Variable inspection
│   ├── Execution history
│   └── WebSocket streaming
│
├── workflow-ollama-llm.spec.ts              # LLM integration
│   ├── Basic text generation
│   ├── Streaming responses
│   ├── Context and variables
│   ├── Chained LLM calls
│   ├── Conditional logic
│   └── Error handling
│
├── workflow-ollama-embeddings.spec.ts       # Embedding integration
│   ├── Document embedding
│   ├── Batch processing
│   ├── Semantic search
│   ├── RAG workflows
│   ├── Similarity comparison
│   └── Hybrid search
│
├── workflow-e2e-scenarios.spec.ts           # End-to-end scenarios
│   ├── Customer support analysis
│   ├── Content generation pipeline
│   ├── Batch data processing
│   ├── Document intelligence
│   └── Multi-agent collaboration
│
├── utils/
│   └── test-helpers.ts                      # Test utilities
│
├── jest.config.js                           # Jest configuration
├── jest.setup.ts                            # Test setup
├── run-tests.sh                             # Interactive test runner
└── README.md                                # Test documentation
```

## ⚙️ Configuration

### Environment Variables

```bash
# Ollama configuration
export OLLAMA_URL=http://localhost:11434

# Database
export DATABASE_URL=postgresql://user:pass@localhost:5432/testdb

# Test timeout (milliseconds)
export TEST_TIMEOUT=300000
```

### Jest Configuration

File: `backend/test/workflows/jest.config.js`

```javascript
module.exports = {
  displayName: 'Workflow Integration Tests',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  testTimeout: 300000, // 5 minutes for LLM tests
  setupFilesAfterEnv: ['./jest.setup.ts'],
  collectCoverageFrom: [
    '../../src/modules/workflows/**/*.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: '../../coverage/workflows',
};
```

## 🎭 Test Execution Modes

### 1. Normal Mode
```typescript
const execution = await executorService.execute(workflowId, inputData);
// Runs workflow normally without debugging
```

### 2. Debug Mode
```typescript
const execution = await executorService.execute(workflowId, inputData, {
  mode: 'debug',
  captureVariables: true,
});
// Enables variable capture and detailed logging
```

### 3. Step Mode
```typescript
const execution = await executorService.execute(workflowId, inputData, {
  mode: 'step',
});
// Pauses before each node, requires executeStep() calls
```

### 4. Backend Mode
```typescript
const execution = await executorService.execute(workflowId, inputData, {
  mode: 'backend',
});
// Uses backend executor with WebSocket streaming
```

### 5. With Breakpoints
```typescript
const execution = await executorService.execute(workflowId, inputData, {
  mode: 'debug',
  breakpoints: ['node_1', 'node_3'],
});
// Pauses at specified nodes
```

## 📈 Test Metrics

### Execution Times

| Test Category | Average Time | Max Time |
|---------------|--------------|----------|
| Basic Execution | 1-5 seconds | 10 seconds |
| Advanced Features | 5-30 seconds | 60 seconds |
| LLM Generation | 5-30 seconds | 60 seconds |
| Embeddings | 10-60 seconds | 120 seconds |
| E2E Scenarios | 60-180 seconds | 300 seconds |

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Scenarios**: 5+ real-world workflows
- **Error Cases**: All error conditions

## 🐛 Troubleshooting

### Ollama Not Available
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull models
ollama pull llama2
ollama pull nomic-embed-text

# Verify models
ollama list
```

### Tests Timing Out
```bash
# Increase timeout in test file
jest.setTimeout(600000); // 10 minutes

# Or via environment
TEST_TIMEOUT=600000 npm test
```

### Model Not Found
```bash
# Pull specific model
ollama pull llama2:latest

# Check available models
ollama list

# Use different model in tests
model: 'llama2:7b'
```

### WebSocket Connection Issues
```bash
# Check backend is running
curl http://localhost:3001/health

# Verify WebSocket endpoint
wscat -c ws://localhost:3001/workflows

# Check CORS configuration
# backend/src/modules/workflows/workflow-execution.gateway.ts
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Workflow Integration Tests

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
      
      ollama:
        image: ollama/ollama:latest
        ports:
          - 11434:11434
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Pull Ollama models
        run: |
          ollama pull llama2
          ollama pull nomic-embed-text
      
      - name: Run integration tests
        run: |
          cd backend
          npm test -- test/workflows/*.spec.ts
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/workflows/lcov.info
```

## 📝 Adding New Tests

### Template for New Test

```typescript
describe('My New Feature', () => {
  let executorService: WorkflowExecutorService;
  let workflowsService: WorkflowsService;

  beforeAll(async () => {
    // Setup test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkflowsModule],
    }).compile();

    executorService = moduleFixture.get<WorkflowExecutorService>(WorkflowExecutorService);
    workflowsService = moduleFixture.get<WorkflowsService>(WorkflowsService);
  });

  it('should test my feature', async () => {
    // Create workflow
    const workflow = TestHelpers.createSimpleWorkflow({
      name: 'Test Workflow',
      organizationId: 'test-org',
    });

    // Execute
    const createdWorkflow = await workflowsService.create(workflow);
    const execution = await executorService.execute(
      createdWorkflow.id,
      {},
      { captureVariables: true }
    );

    // Assert
    expect(execution.status).toBe('completed');
    TestHelpers.verifyExecutionSuccess(execution);
  });
});
```

## ✨ Summary

**Test Implementation Complete!**

- ✅ **26 comprehensive integration tests**
- ✅ **5 test suites** covering all features
- ✅ **5 end-to-end scenarios** for real-world workflows
- ✅ **Test utilities and helpers** for easy testing
- ✅ **Interactive test runner** for convenience
- ✅ **Full Ollama integration** (LLM + embeddings)
- ✅ **Complete documentation** with examples

**Ready for:**
- Development testing
- CI/CD integration
- Regression testing
- Feature validation
- Performance benchmarking

**Next Steps:**
1. Run tests locally: `./run-tests.sh`
2. Review test output
3. Add tests for new features
4. Integrate into CI/CD pipeline
5. Monitor test coverage

---

*All workflow execution features are comprehensively tested with real-world scenarios!* 🎉
