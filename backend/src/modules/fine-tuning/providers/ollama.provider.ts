import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import {
  IFineTuningProvider,
  FineTuningJobConfig,
  FineTuningJobResult,
  FineTuningJobStatusResponse,
  CostEstimate,
} from './fine-tuning-provider.interface';
import { FineTuningJobStatus } from '../entities/fine-tuning-job.entity';

/**
 * Ollama Fine-Tuning Provider
 * 
 * Uses Ollama's local model training capabilities
 * Supports models like Llama 2, Mistral, etc.
 * 
 * Note: Ollama fine-tuning is done locally and is free,
 * but requires significant compute resources (GPU recommended)
 */
@Injectable()
export class OllamaFineTuningProvider implements IFineTuningProvider {
  private readonly logger = new Logger(OllamaFineTuningProvider.name);
  private readonly ollamaHost: string;
  private activeJobs: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {
    this.ollamaHost = this.configService.get<string>('OLLAMA_HOST') || 'http://localhost:11434';
  }

  async createFineTuningJob(config: FineTuningJobConfig): Promise<FineTuningJobResult> {
    try {
      this.logger.log(`Creating Ollama fine-tuning job with base model: ${config.baseModel}`);

      // Validate Ollama is available
      await this.checkOllamaAvailable();

      // Generate unique job ID
      const jobId = `ollama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Convert dataset to Ollama format (Modelfile)
      const modelfilePath = await this.createModelfile(config, jobId);

      // Start fine-tuning process in background
      this.startFineTuningProcess(jobId, modelfilePath, config);

      return {
        providerJobId: jobId,
        status: FineTuningJobStatus.QUEUED,
        estimatedCostUsd: 0, // Ollama is free (local compute)
      };
    } catch (error) {
      this.logger.error(`Failed to create Ollama fine-tuning job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getJobStatus(providerJobId: string): Promise<FineTuningJobStatusResponse> {
    const job = this.activeJobs.get(providerJobId);

    if (!job) {
      // Check if model exists (training completed)
      const modelName = `ft-${providerJobId}`;
      const modelExists = await this.checkModelExists(modelName);

      if (modelExists) {
        return {
          status: FineTuningJobStatus.SUCCEEDED,
          progressPercentage: 100,
          providerModelId: modelName,
        };
      }

      return {
        status: FineTuningJobStatus.FAILED,
        progressPercentage: 0,
        errorMessage: 'Job not found or failed',
      };
    }

    return {
      status: job.status,
      progressPercentage: job.progress || 0,
      currentEpoch: job.currentEpoch,
      totalEpochs: job.totalEpochs,
      providerModelId: job.status === FineTuningJobStatus.SUCCEEDED ? `ft-${providerJobId}` : undefined,
      errorMessage: job.error,
    };
  }

  async cancelJob(providerJobId: string): Promise<void> {
    const job = this.activeJobs.get(providerJobId);
    
    if (job && job.process) {
      job.process.kill();
      job.status = FineTuningJobStatus.CANCELLED;
      this.activeJobs.set(providerJobId, job);
      this.logger.log(`Cancelled Ollama job: ${providerJobId}`);
    }
  }

  async estimateCost(
    totalExamples: number,
    baseModel: string,
    epochs?: number,
  ): Promise<CostEstimate> {
    // Ollama is free (runs locally)
    return {
      estimatedCostUsd: 0,
      totalTokens: totalExamples * 500, // Rough estimate
      trainingTokens: totalExamples * 500 * (epochs || 3),
      validationTokens: totalExamples * 100,
      breakdown: {
        trainingCost: 0,
        validationCost: 0,
      },
    };
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
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        totalExamples++;
        try {
          const example = JSON.parse(line);
          
          if (!example.messages || !Array.isArray(example.messages)) {
            errors.push(`Line ${totalExamples}: Missing messages array`);
            continue;
          }

          // Count tokens (rough estimate)
          example.messages.forEach((msg: any) => {
            totalTokens += Math.ceil((msg.content?.length || 0) / 4);
          });
        } catch (e) {
          errors.push(`Line ${totalExamples}: Invalid JSON`);
        }
      }

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
      return {
        valid: false,
        errors: [`Failed to read file: ${error.message}`],
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Popular Ollama models that support fine-tuning
    return [
      'llama2',
      'llama2:7b',
      'llama2:13b',
      'mistral',
      'mistral:7b',
      'codellama',
      'codellama:7b',
      'phi',
      'neural-chat',
      'starling-lm',
    ];
  }

  // Private helper methods

  private async checkOllamaAvailable(): Promise<void> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama not responding');
      }
    } catch (error) {
      throw new BadRequestException(
        `Ollama is not available at ${this.ollamaHost}. Please ensure Ollama is installed and running.`
      );
    }
  }

  private async checkModelExists(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`);
      const data = await response.json();
      return data.models?.some((m: any) => m.name === modelName);
    } catch {
      return false;
    }
  }

  private async createModelfile(config: FineTuningJobConfig, jobId: string): Promise<string> {
    // Read training data
    const trainingData = fs.readFileSync(config.datasetPath, 'utf8');
    const lines = trainingData.split('\n').filter(line => line.trim());

    // Parse examples
    const examples: any[] = [];
    for (const line of lines) {
      try {
        const example = JSON.parse(line);
        examples.push(example);
      } catch (e) {
        this.logger.warn(`Skipping invalid line in dataset`);
      }
    }

    // Create Modelfile content
    const modelfileContent = this.generateModelfile(config.baseModel, examples, config.hyperparameters);

    // Save Modelfile
    const modelfilePath = path.join(path.dirname(config.datasetPath), `Modelfile-${jobId}`);
    fs.writeFileSync(modelfilePath, modelfileContent);

    this.logger.log(`Created Modelfile: ${modelfilePath}`);
    return modelfilePath;
  }

  private generateModelfile(baseModel: string, examples: any[], hyperparameters: any): string {
    // Build training examples section
    const systemMessages: string[] = [];
    const conversationExamples: string[] = [];

    examples.forEach((example, idx) => {
      if (example.messages && Array.isArray(example.messages)) {
        const messages = example.messages;
        
        // Extract system message
        const systemMsg = messages.find((m: any) => m.role === 'system');
        if (systemMsg && idx === 0) {
          systemMessages.push(systemMsg.content);
        }

        // Extract conversation
        const userMsg = messages.find((m: any) => m.role === 'user');
        const assistantMsg = messages.find((m: any) => m.role === 'assistant');
        
        if (userMsg && assistantMsg) {
          conversationExamples.push(
            `### Instruction:\n${userMsg.content}\n\n### Response:\n${assistantMsg.content}`
          );
        }
      }
    });

    // Generate Modelfile
    let modelfile = `FROM ${baseModel}\n\n`;

    // Add system prompt
    if (systemMessages.length > 0) {
      modelfile += `SYSTEM """${systemMessages[0]}"""\n\n`;
    }

    // Add parameters
    modelfile += `PARAMETER temperature ${hyperparameters.temperature || 0.7}\n`;
    modelfile += `PARAMETER num_ctx ${hyperparameters.context_window || 2048}\n`;
    
    if (hyperparameters.n_epochs) {
      modelfile += `PARAMETER num_train ${hyperparameters.n_epochs}\n`;
    }

    // Add training examples as TEMPLATE
    if (conversationExamples.length > 0) {
      modelfile += `\n# Training Examples\n`;
      modelfile += `TEMPLATE """Below are training examples:\n\n`;
      modelfile += conversationExamples.slice(0, 10).join('\n\n---\n\n'); // Limit to first 10
      modelfile += `\n"""\n`;
    }

    return modelfile;
  }

  private startFineTuningProcess(jobId: string, modelfilePath: string, config: FineTuningJobConfig): void {
    const modelName = `ft-${jobId}`;

    // Initialize job tracking
    this.activeJobs.set(jobId, {
      status: FineTuningJobStatus.RUNNING,
      progress: 0,
      totalEpochs: config.hyperparameters.n_epochs || 3,
      currentEpoch: 0,
      startTime: Date.now(),
    });

    // Run ollama create command in background
    const command = 'ollama';
    const args = ['create', modelName, '-f', modelfilePath];

    this.logger.log(`Starting Ollama create: ${command} ${args.join(' ')}`);

    const process = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const job = this.activeJobs.get(jobId);
    job.process = process;

    process.stdout.on('data', (data) => {
      const output = data.toString();
      this.logger.log(`Ollama output: ${output}`);

      // Update progress based on output
      if (output.includes('transferring')) {
        job.progress = 20;
      } else if (output.includes('processing')) {
        job.progress = 50;
      } else if (output.includes('writing')) {
        job.progress = 80;
      }

      this.activeJobs.set(jobId, job);
    });

    process.stderr.on('data', (data) => {
      this.logger.error(`Ollama error: ${data.toString()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        job.status = FineTuningJobStatus.SUCCEEDED;
        job.progress = 100;
        this.logger.log(`Ollama fine-tuning completed: ${modelName}`);
      } else {
        job.status = FineTuningJobStatus.FAILED;
        job.error = `Process exited with code ${code}`;
        this.logger.error(`Ollama fine-tuning failed with code ${code}`);
      }

      this.activeJobs.set(jobId, job);

      // Clean up Modelfile
      try {
        fs.unlinkSync(modelfilePath);
      } catch (e) {
        this.logger.warn(`Failed to cleanup Modelfile: ${e.message}`);
      }
    });
  }
}
