import { IsString, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { WorkflowDefinition } from '../entities/workflow.entity';

export class ListTemplatesDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  publicOnly?: boolean;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsObject()
  definition: WorkflowDefinition;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class DeployTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsObject()
  @IsOptional()
  configOverrides?: Record<string, any>;
}

export class TemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
  definition: WorkflowDefinition;
  icon?: string;
  isPublic: boolean;
  createdBy?: string;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}
