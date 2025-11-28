import { Injectable, Logger } from '@nestjs/common';

/**
 * Token Counter Service
 * 
 * Estimates token usage for conversations, RAG context, and LLM calls.
 * Uses approximation method (1 token ≈ 4 characters) for speed.
 * 
 * For production accuracy, consider using tiktoken library:
 * npm install tiktoken
 */
@Injectable()
export class TokenCounterService {
  private readonly logger = new Logger(TokenCounterService.name);

  /**
   * Estimate token count from text
   * Simple approximation: 1 token ≈ 4 characters
   * 
   * For more accuracy, use tiktoken library
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Count tokens in an array of messages
   */
  countMessageTokens(messages: Array<{ content: string; role: string }>): number {
    let total = 0;
    
    for (const msg of messages) {
      total += this.estimateTokens(msg.content);
      total += 4; // Message formatting overhead
    }
    
    return total;
  }

  /**
   * Calculate total context tokens
   */
  calculateTotalContext(data: {
    systemPrompt: string;
    messages: Array<{ content: string; role: string }>;
    ragContext?: string;
    userMessage?: string;
  }): {
    systemTokens: number;
    historyTokens: number;
    ragTokens: number;
    userMessageTokens: number;
    totalTokens: number;
  } {
    const systemTokens = this.estimateTokens(data.systemPrompt);
    const historyTokens = this.countMessageTokens(data.messages);
    const ragTokens = this.estimateTokens(data.ragContext || '');
    const userMessageTokens = this.estimateTokens(data.userMessage || '');
    
    return {
      systemTokens,
      historyTokens,
      ragTokens,
      userMessageTokens,
      totalTokens: systemTokens + historyTokens + ragTokens + userMessageTokens,
    };
  }

  /**
   * Check if context fits within limit
   */
  fitsInContext(
    systemPrompt: string,
    messages: any[],
    ragContext: string,
    maxContextTokens: number,
    userMessage?: string
  ): boolean {
    const calc = this.calculateTotalContext({
      systemPrompt,
      messages,
      ragContext,
      userMessage,
    });
    
    return calc.totalTokens <= maxContextTokens;
  }

  /**
   * Calculate cost based on token usage
   * Returns cost in USD
   */
  calculateCost(usage: {
    promptTokens: number;
    completionTokens: number;
    model: string;
  }): number {
    // Pricing as of 2024 (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
    };

    const price = pricing[usage.model] || pricing['gpt-3.5-turbo'];
    
    const inputCost = (usage.promptTokens / 1000) * price.input;
    const outputCost = (usage.completionTokens / 1000) * price.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get recommended maxTokens based on context size
   */
  getRecommendedMaxTokens(
    contextTokens: number,
    modelContextWindow: number
  ): number {
    // Leave buffer for response
    const availableForResponse = modelContextWindow - contextTokens - 100; // 100 token buffer
    
    // Cap at reasonable maximum
    return Math.min(availableForResponse, 4000);
  }

  /**
   * Get context window size for model
   */
  getModelContextWindow(model: string): number {
    const windows: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'mistral': 8192,
      'llama2': 4096,
      'llama2-13b': 4096,
      'codellama': 16384,
    };

    return windows[model] || 4096; // Default to 4k
  }
}
