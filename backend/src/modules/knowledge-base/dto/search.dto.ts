import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query text' })
  @IsString()
  query: string;

  @ApiProperty({ required: false, default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiProperty({ required: false, default: 0.7, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;

  @ApiProperty({ required: false, description: 'Include conversation history for context' })
  @IsOptional()
  @IsString()
  conversationHistory?: string;
}

export class ReindexAllDto {
  @ApiProperty({ required: false, description: 'Force re-indexing even if already indexed' })
  @IsOptional()
  force?: boolean;
}

export class DocumentStatsDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  timesUsed: number;

  @ApiProperty()
  avgScore: number;

  @ApiProperty()
  lastUsed: Date;
}
