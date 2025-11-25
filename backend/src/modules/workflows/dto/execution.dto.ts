import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsDate, IsBoolean } from 'class-validator';
import { WorkflowExecutionStatus } from '../entities/workflow-execution.entity';
import { StepStatus } from '../entities/workflow-execution-step.entity';

export class ListExecutionsDto {
  @IsString()
  @IsOptional()
  workflowId?: string;

  @IsEnum(WorkflowExecutionStatus)
  @IsOptional()
  status?: WorkflowExecutionStatus;

  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;

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

export class ExecutionResponseDto {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowExecutionStatus;
  triggerData?: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  error?: string;
  context?: Record<string, any>;
  steps?: ExecutionStepResponseDto[];
}

export class ExecutionStepResponseDto {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeName?: string;
  status: StepStatus;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  durationMs?: number;
  retryCount: number;
}

export class ExecutionLogsDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsEnum(StepStatus)
  @IsOptional()
  status?: StepStatus;

  @IsString()
  @IsOptional()
  nodeType?: string;
}

export class CancelExecutionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RetryExecutionDto {
  @IsString()
  @IsOptional()
  fromStepId?: string;

  @IsBoolean()
  @IsOptional()
  resetContext?: boolean;
}
