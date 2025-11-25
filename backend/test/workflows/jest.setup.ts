import { TestHelpers } from './utils/test-helpers';

// Global test setup
beforeAll(async () => {
  console.log('\n🚀 Starting Workflow Integration Tests\n');
  
  // Check Ollama availability
  const ollamaAvailable = await TestHelpers.checkOllamaAvailability();
  
  if (ollamaAvailable) {
    console.log('✅ Ollama is available');
    
    const models = await TestHelpers.getAvailableModels();
    console.log(`📦 Available models: ${models.join(', ')}`);
    
    // Ensure required models are available
    const requiredModels = ['llama2', 'nomic-embed-text'];
    for (const model of requiredModels) {
      const available = models.includes(model);
      if (available) {
        console.log(`✅ Model ${model} is ready`);
      } else {
        console.log(`⚠️  Model ${model} not found, tests requiring it will be skipped`);
      }
    }
  } else {
    console.log('⚠️  Ollama is not available - LLM/Embedding tests will be skipped');
    console.log('   To run all tests, start Ollama: ollama serve');
  }
  
  console.log('\n');
});

// Global test teardown
afterAll(async () => {
  console.log('\n✨ Workflow Integration Tests Complete\n');
});

// Increase timeout for all tests
jest.setTimeout(300000); // 5 minutes

// Custom matchers
expect.extend({
  toBeValidExecution(received) {
    const pass = 
      received &&
      typeof received === 'object' &&
      'status' in received &&
      'steps' in received &&
      Array.isArray(received.steps);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid execution`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid execution with status and steps`,
        pass: false,
      };
    }
  },
  
  toHaveValidLLMOutput(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      'output' in received &&
      'text' in received.output &&
      typeof received.output.text === 'string' &&
      received.output.text.length > 0;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid LLM output`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid LLM output with text property`,
        pass: false,
      };
    }
  },
  
  toHaveValidEmbedding(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      'vector' in received &&
      Array.isArray(received.vector) &&
      received.vector.length > 0 &&
      received.vector.every(v => typeof v === 'number');
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid embedding`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid embedding with vector array`,
        pass: false,
      };
    }
  },
});
