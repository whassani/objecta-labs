import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dataSourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  chunkCount: number;

  @ApiProperty()
  processingStatus: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DocumentChunkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  chunkIndex: number;

  @ApiProperty()
  metadata: any;
}
