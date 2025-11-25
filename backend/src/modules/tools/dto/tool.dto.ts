import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateToolDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty()
  @IsString()
  toolType: string;

  @ApiProperty()
  @IsString()
  actionType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  config?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  schema?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiProperty({ default: 100 })
  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateToolDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  config?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  schema?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  // Phase 3: Advanced Configuration
  @ApiProperty({ required: false })
  @IsOptional()
  retryConfig?: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    retryOn: string[];
    backoffMultiplier?: number;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  responseTransform?: {
    enabled: boolean;
    type: 'jsonpath' | 'javascript';
    expression: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentEnvironment?: string;
}
