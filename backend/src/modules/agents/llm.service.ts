import { Injectable, Logger } from '@nestjs/common';
import {
  LLMProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
} from './interfaces/llm-provider.interface';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private providers: Map<string, LLMProvider>;
  private defaultProvider: string;

  constructor() {
    this.providers = new Map();
    this.registerProviders();
    this.defaultProvider = this.determineDefaultProvider();
  }

  private registerProviders() {
    // Register all available providers
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('openai', new OpenAIProvider());
    
    this.logger.log('Registered LLM providers: ollama, openai');
  }

  private determineDefaultProvider(): string {
    // Use environment variable to determine default provider
    const useOllama = process.env.USE_OLLAMA === 'true';
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (useOllama) {
      this.logger.log('Using Ollama as default provider');
      return 'ollama';
    } else if (hasOpenAIKey) {
      this.logger.log('Using OpenAI as default provider');
      return 'openai';
    } else {
      this.logger.warn('No API keys configured. Defaulting to Ollama.');
      return 'ollama';
    }
  }

  /**
   * Detect provider from model name
   * e.g., "gpt-4" -> "openai", "llama2" -> "ollama"
   */
  private detectProviderFromModel(model: string): string {
    if (model.startsWith('gpt-') || model.startsWith('text-')) {
      return 'openai';
    }
    // Default to ollama for other models
    return 'ollama';
  }

  /**
   * Execute a chat completion with automatic provider detection
   */
  async chat(params: ChatParams, providerName?: string): Promise<ChatResponse> {
    // Determine which provider to use
    const provider = providerName || this.detectProviderFromModel(params.model);
    
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }

    this.logger.log(`Executing chat with ${provider} provider (model: ${params.model})`);

    try {
      // Retry logic: 3 attempts
      let lastError: Error;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await llmProvider.chat(params);
          this.logger.log(`Chat completed successfully (attempt ${attempt})`);
          return response;
        } catch (error) {
          lastError = error;
          this.logger.warn(`Chat attempt ${attempt} failed: ${error.message}`);
          
          if (attempt < 3) {
            // Wait before retrying (exponential backoff)
            await this.sleep(1000 * attempt);
          }
        }
      }

      throw lastError;
    } catch (error) {
      this.logger.error(`Chat failed after 3 attempts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute a streaming chat completion
   */
  streamChat(params: ChatParams, providerName?: string): AsyncIterator<ChatChunk> {
    const provider = providerName || this.detectProviderFromModel(params.model);
    
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }

    this.logger.log(`Starting stream with ${provider} provider (model: ${params.model})`);
    return llmProvider.streamChat(params);
  }

  /**
   * Helper method for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): string {
    return this.defaultProvider;
  }
}
