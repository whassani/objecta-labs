import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as readline from 'readline';
import {
  IFineTuningProvider,
  FineTuningJobConfig,
  FineTuningJobResult,
  FineTuningJobStatusResponse,
  CostEstimate,
} from './fine-tuning-provider.interface';
import { FineTuningJobStatus } from '../entities/fine-tuning-job.entity';

@Injectable()
export class OpenAIFineTuningProvider implements IFineTuningProvider {
  private readonly logger = new Logger(OpenAIFineTuningProvider.name);
  private openai: OpenAI;

  // OpenAI fine-tuning pricing (as of 2024)
  private readonly PRICING = {
    'gpt-3.5-turbo': {
      training: 0.008, // per 1K tokens
      input: 0.003, // per 1K tokens (for validation)
    },
    'gpt-4': {
      training: 0.03, // per 1K tokens
      input: 0.03, // per 1K tokens
    },
    'davinci-002': {
      training: 0.006,
      input: 0.002,
    },
    'babbage-002': {
      training: 0.0004,
      input: 0.0001,
    },
  };

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. OpenAI fine-tuning will not work.');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async createFineTuningJob(config: FineTuningJobConfig): Promise<FineTuningJobResult> {
    try {
      this.logger.log(`Creating fine-tuning job with base model: ${config.baseModel}`);

      // Determine fine-tuning method
      const method = config.hyperparameters.method || 'full';
      this.logger.log(`Using fine-tuning method: ${method}`);

      // OpenAI doesn't natively support LoRA/QLoRA/etc., but we can optimize the training
      // Note: For true LoRA support, you'd need to use HuggingFace PEFT library
      // This implementation provides method-aware parameter tuning for OpenAI's API

      // Upload the training file
      const fileStream = fs.createReadStream(config.datasetPath);
      const uploadedFile = await this.openai.files.create({
        file: fileStream,
        purpose: 'fine-tune',
      });

      this.logger.log(`Uploaded training file: ${uploadedFile.id}`);

      // Prepare hyperparameters based on method
      const hyperparameters = this.prepareHyperparameters(config.hyperparameters, method);

      // Create the fine-tuning job
      const fineTuningJob = await this.openai.fineTuning.jobs.create({
        training_file: uploadedFile.id,
        model: config.baseModel,
        hyperparameters,
        suffix: this.generateModelSuffix(method),
      });

      this.logger.log(`Created fine-tuning job: ${fineTuningJob.id} (method: ${method})`);

      return {
        providerJobId: fineTuningJob.id,
        status: this.mapOpenAIStatus(fineTuningJob.status),
      };
    } catch (error) {
      this.logger.error(`Failed to create fine-tuning job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getJobStatus(providerJobId: string): Promise<FineTuningJobStatusResponse> {
    try {
      const job = await this.openai.fineTuning.jobs.retrieve(providerJobId);
      
      // Get events for more details
      const events = await this.openai.fineTuning.jobs.listEvents(providerJobId, {
        limit: 10,
      });

      const status = this.mapOpenAIStatus(job.status);
      const progressPercentage = this.calculateProgress(job, events.data);

      return {
        status,
        progressPercentage,
        trainedTokens: job.trained_tokens || undefined,
        providerModelId: job.fine_tuned_model || undefined,
        errorMessage: job.error?.message,
        errorCode: job.error?.code,
        events: events.data.map((event) => ({
          type: event.type,
          message: event.message,
          timestamp: new Date(event.created_at * 1000),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get job status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelJob(providerJobId: string): Promise<void> {
    try {
      await this.openai.fineTuning.jobs.cancel(providerJobId);
      this.logger.log(`Cancelled fine-tuning job: ${providerJobId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async estimateCost(
    totalExamples: number,
    baseModel: string,
    epochs: number = 3,
  ): Promise<CostEstimate> {
    try {
      // Estimate tokens per example (rough estimate)
      const avgTokensPerExample = 500; // Conservative estimate
      const totalTokens = totalExamples * avgTokensPerExample;
      
      // Training tokens = total tokens * epochs
      const trainingTokens = totalTokens * epochs;
      
      // Validation split (typically 20%)
      const validationTokens = totalTokens * 0.2;

      // Get pricing for the model
      const pricing = this.getPricing(baseModel);
      
      const trainingCost = (trainingTokens / 1000) * pricing.training;
      const validationCost = (validationTokens / 1000) * pricing.input;
      const estimatedCostUsd = trainingCost + validationCost;

      return {
        estimatedCostUsd: parseFloat(estimatedCostUsd.toFixed(2)),
        totalTokens,
        trainingTokens,
        validationTokens,
        breakdown: {
          trainingCost: parseFloat(trainingCost.toFixed(2)),
          validationCost: parseFloat(validationCost.toFixed(2)),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to estimate cost: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateDataset(filePath: string): Promise<{
    valid: boolean;
    errors?: string[];
    totalExamples?: number;
    totalTokens?: number;
  }> {
    const errors: string[] = [];
    let totalExamples = 0;
    let totalTokens = 0;

    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        totalExamples++;

        try {
          const example = JSON.parse(line);

          // Validate structure
          if (!example.messages || !Array.isArray(example.messages)) {
            errors.push(`Line ${totalExamples}: Missing or invalid 'messages' array`);
            continue;
          }

          // Validate messages
          for (const msg of example.messages) {
            if (!msg.role || !msg.content) {
              errors.push(`Line ${totalExamples}: Invalid message format`);
              break;
            }
            if (!['system', 'user', 'assistant'].includes(msg.role)) {
              errors.push(`Line ${totalExamples}: Invalid role '${msg.role}'`);
              break;
            }
            // Rough token count (1 token ≈ 4 characters)
            totalTokens += Math.ceil(msg.content.length / 4);
          }

          // Must have at least one user and one assistant message
          const hasUser = example.messages.some((m) => m.role === 'user');
          const hasAssistant = example.messages.some((m) => m.role === 'assistant');
          
          if (!hasUser || !hasAssistant) {
            errors.push(`Line ${totalExamples}: Must have at least one user and one assistant message`);
          }
        } catch (parseError) {
          errors.push(`Line ${totalExamples}: Invalid JSON - ${parseError.message}`);
        }

        // Stop after finding too many errors
        if (errors.length > 50) {
          errors.push('Too many errors. Validation stopped.');
          break;
        }
      }

      // Minimum examples required
      if (totalExamples < 10) {
        errors.push(`Insufficient examples: ${totalExamples} (minimum 10 required)`);
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        totalExamples,
        totalTokens,
      };
    } catch (error) {
      this.logger.error(`Dataset validation failed: ${error.message}`, error.stack);
      return {
        valid: false,
        errors: [`File read error: ${error.message}`],
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // OpenAI models that support fine-tuning
    return [
      'gpt-3.5-turbo-1106',
      'gpt-3.5-turbo-0613',
      'gpt-4-0613',
      'davinci-002',
      'babbage-002',
    ];
  }

  // Helper methods
  private mapOpenAIStatus(openaiStatus: string): FineTuningJobStatus {
    const statusMap: Record<string, FineTuningJobStatus> = {
      validating_files: FineTuningJobStatus.VALIDATING,
      queued: FineTuningJobStatus.QUEUED,
      running: FineTuningJobStatus.RUNNING,
      succeeded: FineTuningJobStatus.SUCCEEDED,
      failed: FineTuningJobStatus.FAILED,
      cancelled: FineTuningJobStatus.CANCELLED,
    };

    return statusMap[openaiStatus] || FineTuningJobStatus.PENDING;
  }

  private calculateProgress(job: any, events: any[]): number {
    if (job.status === 'succeeded') return 100;
    if (job.status === 'failed' || job.status === 'cancelled') return 0;

    // Try to extract progress from events
    const progressEvent = events.find((e) => e.message?.includes('step'));
    if (progressEvent) {
      const match = progressEvent.message.match(/step (\d+)\/(\d+)/);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        return Math.round((current / total) * 100);
      }
    }

    // Default progress based on status
    if (job.status === 'running') return 50;
    if (job.status === 'queued') return 10;
    if (job.status === 'validating_files') return 5;

    return 0;
  }

  private getPricing(baseModel: string): { training: number; input: number } {
    // Find matching pricing
    for (const [model, pricing] of Object.entries(this.PRICING)) {
      if (baseModel.includes(model)) {
        return pricing;
      }
    }

    // Default to gpt-3.5-turbo pricing
    return this.PRICING['gpt-3.5-turbo'];
  }

  // ==================== Advanced Fine-Tuning Support ====================

  /**
   * Prepare hyperparameters optimized for the chosen fine-tuning method
   * Note: OpenAI's API doesn't natively support LoRA/QLoRA, but we optimize parameters
   * For true LoRA/QLoRA, consider using HuggingFace PEFT + local training
   */
  private prepareHyperparameters(hyperparameters: any, method: string): any {
    const baseHyperparameters = {
      n_epochs: hyperparameters.n_epochs || 3,
    };

    // Add batch_size if provided
    if (hyperparameters.batch_size) {
      baseHyperparameters['batch_size'] = hyperparameters.batch_size;
    }

    // Add learning_rate_multiplier if provided
    if (hyperparameters.learning_rate_multiplier) {
      baseHyperparameters['learning_rate_multiplier'] = hyperparameters.learning_rate_multiplier;
    }

    // Optimize parameters based on method
    switch (method) {
      case 'lora':
        // For LoRA-style training, use more conservative learning rate
        if (!hyperparameters.learning_rate_multiplier) {
          baseHyperparameters['learning_rate_multiplier'] = 0.5;
        }
        this.logger.log('Optimizing for LoRA-style efficient training');
        break;

      case 'qlora':
        // For QLoRA, use even more conservative approach
        if (!hyperparameters.learning_rate_multiplier) {
          baseHyperparameters['learning_rate_multiplier'] = 0.3;
        }
        this.logger.log('Optimizing for QLoRA-style efficient training');
        break;

      case 'prefix':
        // Prefix tuning typically needs fewer epochs
        if (!hyperparameters.n_epochs) {
          baseHyperparameters['n_epochs'] = 2;
        }
        this.logger.log('Optimizing for prefix tuning style');
        break;

      case 'adapter':
        // Adapter layers benefit from moderate learning rate
        if (!hyperparameters.learning_rate_multiplier) {
          baseHyperparameters['learning_rate_multiplier'] = 0.7;
        }
        this.logger.log('Optimizing for adapter-style training');
        break;

      case 'full':
      default:
        // Full fine-tuning uses default OpenAI parameters
        this.logger.log('Using full fine-tuning parameters');
        break;
    }

    return baseHyperparameters;
  }

  /**
   * Generate a model suffix based on the fine-tuning method
   */
  private generateModelSuffix(method: string): string {
    switch (method) {
      case 'lora':
        return 'lora';
      case 'qlora':
        return 'qlora';
      case 'prefix':
        return 'prefix';
      case 'adapter':
        return 'adapter';
      default:
        return 'ft';
    }
  }

  /**
   * Estimate cost with method-specific adjustments
   * LoRA/QLoRA would be cheaper in practice, but OpenAI charges the same
   * Note: For real cost savings, use local training with PEFT library
   */
  async estimateCostWithMethod(
    totalExamples: number,
    baseModel: string,
    epochs: number = 3,
    method: string = 'full',
  ): Promise<CostEstimate> {
    const baseCost = await this.estimateCost(totalExamples, baseModel, epochs);

    // Add method information to the estimate
    let notes = '';
    switch (method) {
      case 'lora':
        notes = 'Note: OpenAI charges full price. For 90% cost savings, use local LoRA training.';
        break;
      case 'qlora':
        notes = 'Note: OpenAI charges full price. For 95% cost savings, use local QLoRA training.';
        break;
      case 'prefix':
        notes = 'Note: OpenAI charges full price. For 98% cost savings, use local prefix tuning.';
        break;
      case 'adapter':
        notes = 'Note: OpenAI charges full price. For 92% cost savings, use local adapter training.';
        break;
    }

    return {
      ...baseCost,
      notes,
    } as any;
  }
}
