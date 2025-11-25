#!/bin/bash

# Workflow Execution Integration Test Runner
# This script runs comprehensive integration tests for workflow execution features

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   Workflow Execution Integration Tests                       ║"
echo "║   Testing: Breakpoints, Step Mode, Variables, History, etc.  ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Ollama is running
echo -e "${BLUE}Checking Ollama availability...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
    OLLAMA_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ Ollama is not running - LLM/embedding tests will be skipped${NC}"
    echo -e "${YELLOW}  To run all tests: ollama serve${NC}"
    OLLAMA_AVAILABLE=false
fi
echo ""

# Check required models if Ollama is available
if [ "$OLLAMA_AVAILABLE" = true ]; then
    echo -e "${BLUE}Checking required models...${NC}"
    
    # Check llama2
    if ollama list | grep -q "llama2"; then
        echo -e "${GREEN}✓ llama2 model available${NC}"
    else
        echo -e "${YELLOW}⚠ llama2 model not found${NC}"
        echo -e "${YELLOW}  Install with: ollama pull llama2${NC}"
    fi
    
    # Check nomic-embed-text
    if ollama list | grep -q "nomic-embed-text"; then
        echo -e "${GREEN}✓ nomic-embed-text model available${NC}"
    else
        echo -e "${YELLOW}⚠ nomic-embed-text model not found${NC}"
        echo -e "${YELLOW}  Install with: ollama pull nomic-embed-text${NC}"
    fi
    echo ""
fi

# Test suite selection
echo -e "${BLUE}Select test suite to run:${NC}"
echo "  1) All tests (complete integration)"
echo "  2) Basic execution tests only"
echo "  3) Advanced features (breakpoints, step mode, variables, history)"
echo "  4) Ollama LLM tests"
echo "  5) Ollama embedding tests"
echo "  6) End-to-end scenarios"
echo "  7) Quick smoke test"
echo ""
read -p "Enter choice [1-7] (default: 1): " choice
choice=${choice:-1}

# Set test pattern based on choice
case $choice in
    1)
        TEST_PATTERN="*.spec.ts"
        DESCRIPTION="All Integration Tests"
        ;;
    2)
        TEST_PATTERN="workflow-execution-integration.spec.ts"
        DESCRIPTION="Basic Execution Tests"
        ;;
    3)
        TEST_PATTERN="workflow-execution-advanced.spec.ts"
        DESCRIPTION="Advanced Features Tests"
        ;;
    4)
        TEST_PATTERN="workflow-ollama-llm.spec.ts"
        DESCRIPTION="Ollama LLM Tests"
        if [ "$OLLAMA_AVAILABLE" = false ]; then
            echo -e "${RED}✗ Ollama is required for LLM tests${NC}"
            exit 1
        fi
        ;;
    5)
        TEST_PATTERN="workflow-ollama-embeddings.spec.ts"
        DESCRIPTION="Ollama Embedding Tests"
        if [ "$OLLAMA_AVAILABLE" = false ]; then
            echo -e "${RED}✗ Ollama is required for embedding tests${NC}"
            exit 1
        fi
        ;;
    6)
        TEST_PATTERN="workflow-e2e-scenarios.spec.ts"
        DESCRIPTION="End-to-End Scenarios"
        if [ "$OLLAMA_AVAILABLE" = false ]; then
            echo -e "${RED}✗ Ollama is required for E2E scenarios${NC}"
            exit 1
        fi
        ;;
    7)
        TEST_PATTERN="workflow-execution-integration.spec.ts"
        DESCRIPTION="Quick Smoke Test"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Running: ${DESCRIPTION}${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Run tests
cd "$(dirname "$0")/../.."

if npm run test -- "test/workflows/${TEST_PATTERN}" --config=test/workflows/jest.config.js; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${GREEN}✓ Tests passed successfully!${NC}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    # Show summary
    echo -e "${BLUE}Test Summary:${NC}"
    echo "  - Tested: ${DESCRIPTION}"
    echo "  - Pattern: ${TEST_PATTERN}"
    echo "  - Ollama: $([ "$OLLAMA_AVAILABLE" = true ] && echo "Available" || echo "Not Available")"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${RED}✗ Tests failed${NC}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    exit 1
fi

# Optional: Generate coverage report
read -p "Generate coverage report? [y/N]: " generate_coverage
if [ "$generate_coverage" = "y" ] || [ "$generate_coverage" = "Y" ]; then
    echo ""
    echo -e "${BLUE}Generating coverage report...${NC}"
    npm run test:cov -- "test/workflows/${TEST_PATTERN}" --config=test/workflows/jest.config.js
    echo -e "${GREEN}✓ Coverage report generated in coverage/workflows/${NC}"
fi

echo ""
echo -e "${GREEN}✨ Test run complete!${NC}"
echo ""
