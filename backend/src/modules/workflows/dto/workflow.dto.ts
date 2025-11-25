import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { WorkflowStatus, WorkflowTriggerType, WorkflowDefinition, TriggerConfig } from '../entities/workflow.entity';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  definition?: WorkflowDefinition;

  @IsEnum(WorkflowTriggerType)
  @IsOptional()
  triggerType?: WorkflowTriggerType;

  @IsObject()
  @IsOptional()
  triggerConfig?: TriggerConfig;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  workspaceId?: string;
}

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  definition?: WorkflowDefinition;

  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @IsEnum(WorkflowTriggerType)
  @IsOptional()
  triggerType?: WorkflowTriggerType;

  @IsObject()
  @IsOptional()
  triggerConfig?: TriggerConfig;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  version?: number;
}

export class ExecuteWorkflowDto {
  @IsObject()
  @IsOptional()
  triggerData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class ListWorkflowsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @IsEnum(WorkflowTriggerType)
  @IsOptional()
  triggerType?: WorkflowTriggerType;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  workspaceId?: string;

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

export class WorkflowResponseDto {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  triggerConfig?: TriggerConfig;
  version: number;
  tags: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
}

export class DuplicateWorkflowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  copyStatus?: boolean;
}
