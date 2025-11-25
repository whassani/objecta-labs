import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteToolDto {
  @ApiProperty({ description: 'Tool input parameters', required: false })
  @IsOptional()
  input?: any;

  @ApiProperty({ description: 'Additional context for execution', required: false })
  @IsOptional()
  context?: any;
}

export class ToolExecutionResultDto {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  toolId: string;
  toolName: string;
}
