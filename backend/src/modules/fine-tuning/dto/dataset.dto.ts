import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDatasetDto {
  @ApiProperty({ description: 'Dataset name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Dataset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace ID (optional for organization-level datasets)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiProperty({ description: 'File format', enum: ['jsonl', 'csv', 'json'], default: 'jsonl' })
  @IsEnum(['jsonl', 'csv', 'json'])
  format: string;

  @ApiPropertyOptional({ description: 'Source of the dataset', enum: ['upload', 'conversations', 'api'] })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Filters used if imported from conversations' })
  @IsOptional()
  @IsObject()
  sourceFilters?: any;
}

export class UpdateDatasetDto {
  @ApiPropertyOptional({ description: 'Dataset name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Dataset description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ImportFromConversationsDto {
  @ApiProperty({ description: 'Dataset name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Dataset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace ID to filter conversations' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Agent ID to filter conversations' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Start date for conversation filter' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for conversation filter' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum quality score (0-1)' })
  @IsOptional()
  @IsNumber()
  minQualityScore?: number;

  @ApiPropertyOptional({ description: 'Maximum number of examples to import' })
  @IsOptional()
  @IsNumber()
  maxExamples?: number;
}

export class ValidateDatasetDto {
  @ApiProperty({ description: 'Dataset ID to validate' })
  @IsString()
  datasetId: string;
}

export class DatasetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  fileSizeBytes: number;

  @ApiProperty()
  format: string;

  @ApiProperty()
  totalExamples: number;

  @ApiProperty()
  validated: boolean;

  @ApiPropertyOptional()
  validationErrors?: any;

  @ApiPropertyOptional()
  source?: string;

  @ApiPropertyOptional()
  sourceFilters?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  creator?: {
    id: string;
    email: string;
    name: string;
  };
}

export class DatasetStatsDto {
  @ApiProperty()
  totalDatasets: number;

  @ApiProperty()
  totalExamples: number;

  @ApiProperty()
  totalSizeBytes: number;

  @ApiProperty()
  validatedDatasets: number;

  @ApiProperty()
  byFormat: Record<string, number>;

  @ApiProperty()
  bySource: Record<string, number>;
}
