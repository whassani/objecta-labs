import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  retryOn: string[];
  backoffMultiplier?: number;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    context: string = 'Operation',
  ): Promise<{ result: T; retryCount: number }> {
    if (!config.enabled) {
      const result = await fn();
      return { result, retryCount: 0 };
    }

    let lastError: any;
    let retryCount = 0;
    let delay = config.retryDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        this.logger.log(`${context}: Attempt ${attempt + 1}/${config.maxRetries + 1}`);
        const result = await fn();
        
        if (attempt > 0) {
          this.logger.log(`${context}: Succeeded after ${attempt} retries`);
        }
        
        return { result, retryCount: attempt };
      } catch (error) {
        lastError = error;
        retryCount = attempt;

        // Check if we should retry this error
        if (!this.shouldRetry(error, config)) {
          this.logger.warn(`${context}: Error not retryable: ${error.message}`);
          throw error;
        }

        // Don't retry if we've exhausted attempts
        if (attempt === config.maxRetries) {
          this.logger.error(
            `${context}: Failed after ${config.maxRetries} retries`,
            error.stack,
          );
          break;
        }

        // Wait before retrying with exponential backoff
        this.logger.warn(
          `${context}: Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        );
        await this.sleep(delay);

        // Apply backoff multiplier
        if (config.backoffMultiplier) {
          delay = Math.floor(delay * config.backoffMultiplier);
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any, config: RetryConfig): boolean {
    // Check for HTTP status codes
    if (error.response?.status) {
      const statusCode = error.response.status.toString();
      if (config.retryOn.includes(statusCode)) {
        return true;
      }
      
      // Check for status code ranges (e.g., "5xx")
      if (config.retryOn.some(code => {
        if (code.endsWith('xx')) {
          const prefix = code.charAt(0);
          return statusCode.startsWith(prefix);
        }
        return false;
      })) {
        return true;
      }
    }

    // Check for error types/names
    if (config.retryOn.includes(error.name)) {
      return true;
    }

    // Check for error messages
    if (config.retryOn.some(pattern => error.message?.includes(pattern))) {
      return true;
    }

    // Default retry for network errors
    if (config.retryOn.includes('network') && 
        (error.code === 'ECONNREFUSED' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'ENOTFOUND')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get default retry configuration
   */
  static getDefaultConfig(): RetryConfig {
    return {
      enabled: false,
      maxRetries: 3,
      retryDelay: 1000,
      retryOn: ['5xx', 'network', 'ETIMEDOUT'],
      backoffMultiplier: 2,
    };
  }
}
