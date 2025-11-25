# 🚀 Quick Start - Workflow Execution Tests

## Prerequisites (5 minutes)

### 1. Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama (in background)
ollama serve &
```

### 2. Pull Required Models
```bash
# Pull LLM model (takes 2-3 minutes)
ollama pull llama2

# Pull embedding model (takes 1-2 minutes)
ollama pull nomic-embed-text

# Verify models installed
ollama list
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

## Run Tests (1 minute)

### Option 1: Interactive Runner (Recommended)
```bash
cd backend/test/workflows
./run-tests.sh
```

**Menu appears:**
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

**Choose option 7 for quick smoke test!**

### Option 2: Direct Command
```bash
# Quick smoke test (30 seconds)
cd backend
npm test -- test/workflows/workflow-execution-integration.spec.ts

# All tests (5-10 minutes)
npm test -- test/workflows/*.spec.ts
```

## Test Results

### Expected Output
```
PASS test/workflows/workflow-execution-integration.spec.ts
  Basic Workflow Execution
    ✓ should execute a simple linear workflow (234ms)
    ✓ should execute a workflow with branching conditions (345ms)

PASS test/workflows/workflow-execution-advanced.spec.ts
  Breakpoint Execution
    ✓ should pause execution at breakpoint and resume (1023ms)
    ✓ should evaluate conditional breakpoint (1234ms)
  Step-by-Step Execution
    ✓ should execute workflow in step mode (2345ms)
  Variable Inspection
    ✓ should capture variables at each node execution (1567ms)
  ...

Test Suites: 5 passed, 5 total
Tests:       26 passed, 26 total
Time:        182.456s
```

## What's Being Tested?

### ✅ Basic Features (2 tests)
- Simple workflows execute correctly
- Conditional branching works

### ✅ Advanced Features (6 tests)
- ⏸️ Breakpoints pause execution
- 👣 Step-by-step mode works
- 🔍 Variables are captured
- 📜 History is saved and replayed
- 🔌 WebSocket streams events

### ✅ Ollama LLM (7 tests)
- 🤖 Text generation works
- 📝 Context is passed correctly
- 🔗 Multiple LLMs can chain
- ❌ Errors are handled

### ✅ Ollama Embeddings (6 tests)
- 📊 Documents are embedded
- 🔎 Semantic search works
- 🧠 RAG pipelines function
- 📈 Similarity is calculated

### ✅ Real-World Scenarios (5 tests)
- 📞 Customer support automation
- ✍️ Content generation
- 📊 Data processing
- 📚 Document Q&A
- 🤝 Multi-agent workflows

## Troubleshooting

### "Ollama not available"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### "Model not found"
```bash
# Pull the model
ollama pull llama2
ollama pull nomic-embed-text

# Check they're installed
ollama list
```

### "Tests timing out"
```bash
# Some tests take time (LLM generation)
# Just wait - first run is slower
# Subsequent runs are faster (model cached)
```

### "Connection refused"
```bash
# Make sure backend dependencies are installed
cd backend
npm install

# Check database is running
psql -h localhost -U postgres -l
```

## Next Steps

### 1. Review Test Files
```bash
# Open in your editor
code backend/test/workflows/
```

### 2. Read Documentation
```bash
# Comprehensive guide
cat backend/test/workflows/README.md

# Test implementation details
cat WORKFLOW-EXECUTION-TESTS-COMPLETE.md
```

### 3. Run Specific Tests
```bash
# Just LLM tests
npm test -- test/workflows/workflow-ollama-llm.spec.ts

# Just embeddings
npm test -- test/workflows/workflow-ollama-embeddings.spec.ts

# Just scenarios
npm test -- test/workflows/workflow-e2e-scenarios.spec.ts
```

### 4. Add Your Own Tests
```bash
# Copy template from README
# Modify for your use case
# Run and verify
```

## Performance Notes

### First Run
- **Ollama model loading**: 30-60 seconds
- **Test execution**: 5-10 minutes
- **Total**: ~10 minutes

### Subsequent Runs
- **Model cached**: No loading time
- **Test execution**: 3-5 minutes
- **Total**: ~5 minutes

### Individual Test Suites
- **Basic**: 10-30 seconds
- **Advanced**: 1-2 minutes
- **LLM**: 2-5 minutes
- **Embeddings**: 2-5 minutes
- **Scenarios**: 5-10 minutes

## Success Criteria

✅ All 26 tests pass
✅ No timeout errors
✅ Execution times reasonable
✅ Coverage reports generated (optional)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Ollama not running | `ollama serve` |
| Model not found | `ollama pull llama2` |
| Tests timeout | Wait longer or increase timeout |
| Database error | Check PostgreSQL is running |
| Import errors | `npm install` in backend |
| Port in use | Kill process on port 3001 |

## Pro Tips

### 💡 Run tests in watch mode
```bash
npm test -- --watch test/workflows/
```

### 💡 Run only failed tests
```bash
npm test -- --onlyFailures
```

### 💡 See detailed output
```bash
npm test -- --verbose
```

### 💡 Generate coverage
```bash
npm run test:cov -- test/workflows/*.spec.ts
```

### 💡 Debug specific test
```bash
npm test -- -t "should pause execution at breakpoint"
```

## That's It! 🎉

You now have comprehensive integration tests for:
- ⏸️ Breakpoints
- 👣 Step-by-step execution
- 🔍 Variable inspection
- 📜 Execution history
- 🔌 WebSocket streaming
- 🤖 LLM integration
- 📊 Embedding integration
- 🧠 RAG workflows

**Happy Testing!** 🧪
