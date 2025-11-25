import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiProperty()
  @IsString()
  systemPrompt: string;

  @ApiProperty({ default: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ default: 2000 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ default: false, description: 'Enable knowledge base RAG' })
  @IsOptional()
  @IsBoolean()
  useKnowledgeBase?: boolean;

  @ApiProperty({ default: 3, description: 'Max chunks from knowledge base' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  knowledgeBaseMaxResults?: number;

  @ApiProperty({ default: 0.7, description: 'Similarity threshold for RAG' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  knowledgeBaseThreshold?: number;
}

export class UpdateAgentDto {
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
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  useKnowledgeBase?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  knowledgeBaseMaxResults?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  knowledgeBaseThreshold?: number;
}
