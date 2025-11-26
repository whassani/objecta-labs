import { FineTuningJobStatus } from '../entities/fine-tuning-job.entity';

export interface FineTuningJobConfig {
  datasetPath: string;
  baseModel: string;
  hyperparameters: {
    // Method selection
    method?: 'full' | 'lora' | 'qlora' | 'prefix' | 'adapter';
    
    // Standard parameters
    n_epochs?: number;
    batch_size?: number;
    learning_rate_multiplier?: number;
    prompt_loss_weight?: number;
    temperature?: number;
    context_window?: number;
    
    // LoRA-specific parameters
    lora_rank?: number;
    lora_alpha?: number;
    lora_dropout?: number;
    
    // QLoRA-specific parameters
    quantization_bits?: number;
    
    // Prefix Tuning-specific parameters
    prefix_length?: number;
    
    // Adapter-specific parameters
    adapter_size?: number;
  };
  validationSplit?: number;
}

export interface FineTuningJobResult {
  providerJobId: string;
  status: FineTuningJobStatus;
  estimatedCostUsd?: number;
}

export interface FineTuningJobStatusResponse {
  status: FineTuningJobStatus;
  progressPercentage: number;
  currentEpoch?: number;
  totalEpochs?: number;
  trainedTokens?: number;
  trainingLoss?: number;
  validationLoss?: number;
  providerModelId?: string;
  errorMessage?: string;
  errorCode?: string;
  events?: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface CostEstimate {
  estimatedCostUsd: number;
  totalTokens: number;
  trainingTokens: number;
  validationTokens: number;
  breakdown: {
    trainingCost: number;
    validationCost: number;
  };
}

export interface IFineTuningProvider {
  /**
   * Create and start a fine-tuning job
   */
  createFineTuningJob(config: FineTuningJobConfig): Promise<FineTuningJobResult>;

  /**
   * Get the status of a fine-tuning job
   */
  getJobStatus(providerJobId: string): Promise<FineTuningJobStatusResponse>;

  /**
   * Cancel a running fine-tuning job
   */
  cancelJob(providerJobId: string): Promise<void>;

  /**
   * Estimate the cost of a fine-tuning job
   */
  estimateCost(totalExamples: number, baseModel: string, epochs?: number): Promise<CostEstimate>;

  /**
   * Validate dataset format for this provider
   */
  validateDataset(filePath: string): Promise<{
    valid: boolean;
    errors?: string[];
    totalExamples?: number;
    totalTokens?: number;
  }>;

  /**
   * List available base models for fine-tuning
   */
  getAvailableModels(): Promise<string[]>;
}
