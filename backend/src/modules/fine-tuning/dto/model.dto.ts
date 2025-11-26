import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FineTunedModelStatus } from '../entities/fine-tuned-model.entity';

export class UpdateFineTunedModelDto {
  @ApiPropertyOptional({ description: 'Model name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Model description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Model status', enum: FineTunedModelStatus })
  @IsOptional()
  @IsEnum(FineTunedModelStatus)
  status?: FineTunedModelStatus;
}

export class DeployModelDto {
  @ApiPropertyOptional({ description: 'Agent ID to deploy to (optional)' })
  @IsOptional()
  @IsString()
  agentId?: string;
}

export class FineTunedModelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  baseModel: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  providerModelId: string;

  @ApiPropertyOptional()
  trainingAccuracy?: number;

  @ApiPropertyOptional()
  validationAccuracy?: number;

  @ApiPropertyOptional()
  finalLoss?: number;

  @ApiProperty()
  deployed: boolean;

  @ApiPropertyOptional()
  deployedAt?: Date;

  @ApiProperty()
  deploymentCount: number;

  @ApiProperty()
  totalTokensUsed: number;

  @ApiProperty()
  totalRequests: number;

  @ApiPropertyOptional()
  averageLatencyMs?: number;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional()
  parentModelId?: string;

  @ApiProperty({ enum: FineTunedModelStatus })
  status: FineTunedModelStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  archivedAt?: Date;

  @ApiPropertyOptional()
  job?: {
    id: string;
    name: string;
    completedAt: Date;
  };
}

export class ModelStatsDto {
  @ApiProperty()
  totalModels: number;

  @ApiProperty()
  deployedModels: number;

  @ApiProperty()
  activeModels: number;

  @ApiProperty()
  archivedModels: number;

  @ApiProperty()
  totalTokensUsed: number;

  @ApiProperty()
  totalRequests: number;

  @ApiProperty()
  averageLatency: number;

  @ApiProperty()
  byProvider: Record<string, number>;

  @ApiProperty()
  byBaseModel: Record<string, number>;
}
