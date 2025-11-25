/**
 * Simple script to test LLM integration manually
 * Run with: node test-llm-integration.js
 */

const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama connection...');
  console.log(`   Ollama URL: ${OLLAMA_URL}`);
  
  try {
    // Test if Ollama is running
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    console.log('✅ Ollama is running!');
    console.log('📦 Available models:', response.data.models.map(m => m.name).join(', '));
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Ollama:', error.message);
    console.log('\n💡 To fix this:');
    console.log('   1. Install Ollama: https://ollama.ai');
    console.log('   2. Start Ollama: ollama serve');
    console.log('   3. Pull a model: ollama pull llama2');
    return false;
  }
}

async function testLLMChat() {
  console.log('\n🤖 Testing LLM chat...');
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: 'mistral',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in exactly 5 words.' }
      ],
      stream: false
    }, {
      timeout: 120000 // 2 minutes for model loading
    });
    
    console.log('✅ LLM chat successful!');
    console.log('📝 Response:', response.data.message.content);
    console.log('📊 Tokens:', {
      prompt: response.data.prompt_eval_count || 0,
      completion: response.data.eval_count || 0,
      total: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
    });
    return true;
  } catch (error) {
    console.error('❌ LLM chat failed:', error.message);
    if (error.response?.data) {
      console.error('   Details:', error.response.data);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 LLM Integration Test\n');
  
  const ollamaOk = await testOllamaConnection();
  if (!ollamaOk) {
    process.exit(1);
  }
  
  const chatOk = await testLLMChat();
  if (!chatOk) {
    process.exit(1);
  }
  
  console.log('\n✨ All tests passed! LLM integration is ready.\n');
}

main().catch(console.error);
