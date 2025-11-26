import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FineTuningJobStatus } from '../entities/fine-tuning-job.entity';

export class HyperparametersDto {
  @ApiPropertyOptional({ description: 'Number of training epochs', default: 3, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  n_epochs?: number;

  @ApiPropertyOptional({ description: 'Batch size', default: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  batch_size?: number;

  @ApiPropertyOptional({ description: 'Learning rate multiplier', default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(10)
  learning_rate_multiplier?: number;

  @ApiPropertyOptional({ description: 'Prompt loss weight (for completion models)', default: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  prompt_loss_weight?: number;

  // Advanced Fine-Tuning Techniques
  @ApiPropertyOptional({ 
    description: 'Fine-tuning method: full, lora, qlora, prefix, adapter', 
    enum: ['full', 'lora', 'qlora', 'prefix', 'adapter'],
    default: 'lora' 
  })
  @IsOptional()
  @IsEnum(['full', 'lora', 'qlora', 'prefix', 'adapter'])
  method?: string;

  // LoRA/QLoRA specific parameters
  @ApiPropertyOptional({ description: 'LoRA rank (lower = faster, higher = better quality)', default: 8, minimum: 1, maximum: 256 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(256)
  lora_rank?: number;

  @ApiPropertyOptional({ description: 'LoRA alpha scaling parameter', default: 16 })
  @IsOptional()
  @IsNumber()
  lora_alpha?: number;

  @ApiPropertyOptional({ description: 'LoRA dropout rate', default: 0.1, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  lora_dropout?: number;

  @ApiPropertyOptional({ description: 'Target modules for LoRA (e.g., q_proj,v_proj)', type: [String] })
  @IsOptional()
  lora_target_modules?: string[];

  // QLoRA specific
  @ApiPropertyOptional({ description: 'Quantization bits for QLoRA (4 or 8)', enum: [4, 8], default: 4 })
  @IsOptional()
  @IsNumber()
  quantization_bits?: number;

  // Prefix Tuning specific
  @ApiPropertyOptional({ description: 'Number of prefix tokens', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  prefix_length?: number;

  // Adapter specific
  @ApiPropertyOptional({ description: 'Adapter bottleneck dimension', default: 64 })
  @IsOptional()
  @IsNumber()
  adapter_size?: number;
}

export class CreateFineTuningJobDto {
  @ApiProperty({ description: 'Job name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Dataset ID to use for training' })
  @IsString()
  datasetId: string;

  @ApiProperty({ description: 'Base model to fine-tune', example: 'gpt-3.5-turbo' })
  @IsString()
  baseModel: string;

  @ApiPropertyOptional({ description: 'Provider', enum: ['openai', 'ollama', 'anthropic', 'local'], default: 'openai' })
  @IsOptional()
  @IsEnum(['openai', 'ollama', 'anthropic', 'local'])
  provider?: string;

  @ApiPropertyOptional({ description: 'Workspace ID (optional)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Hyperparameters for training' })
  @IsOptional()
  @ValidateNested()
  @Type(() => HyperparametersDto)
  hyperparameters?: HyperparametersDto;

  @ApiPropertyOptional({ description: 'Validation split (0-1)', default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.5)
  validationSplit?: number;
}

export class UpdateFineTuningJobDto {
  @ApiPropertyOptional({ description: 'Job name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CancelFineTuningJobDto {
  @ApiProperty({ description: 'Job ID to cancel' })
  @IsString()
  jobId: string;
}

export class FineTuningJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  datasetId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  baseModel: string;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  providerJobId?: string;

  @ApiProperty()
  hyperparameters: any;

  @ApiProperty({ enum: FineTuningJobStatus })
  status: FineTuningJobStatus;

  @ApiProperty()
  progressPercentage: number;

  @ApiPropertyOptional()
  currentEpoch?: number;

  @ApiPropertyOptional()
  totalEpochs?: number;

  @ApiPropertyOptional()
  trainedTokens?: number;

  @ApiPropertyOptional()
  trainingLoss?: number;

  @ApiPropertyOptional()
  validationLoss?: number;

  @ApiPropertyOptional()
  resultModelId?: string;

  @ApiPropertyOptional()
  estimatedCostUsd?: number;

  @ApiPropertyOptional()
  actualCostUsd?: number;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  errorCode?: string;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  dataset?: {
    id: string;
    name: string;
    totalExamples: number;
  };

  @ApiPropertyOptional()
  creator?: {
    id: string;
    email: string;
    name: string;
  };
}

export class EstimateCostDto {
  @ApiProperty({ description: 'Dataset ID' })
  @IsString()
  datasetId: string;

  @ApiProperty({ description: 'Base model' })
  @IsString()
  baseModel: string;

  @ApiPropertyOptional({ description: 'Number of epochs', default: 3 })
  @IsOptional()
  @IsNumber()
  epochs?: number;
}

export class CostEstimateResponseDto {
  @ApiProperty()
  estimatedCostUsd: number;

  @ApiProperty()
  totalTokens: number;

  @ApiProperty()
  trainingTokens: number;

  @ApiProperty()
  validationTokens: number;

  @ApiProperty()
  epochs: number;

  @ApiProperty()
  baseModel: string;

  @ApiProperty()
  breakdown: {
    trainingCost: number;
    validationCost: number;
  };
}
