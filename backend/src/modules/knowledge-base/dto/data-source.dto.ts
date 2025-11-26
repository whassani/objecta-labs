import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDataSourceDto {
  @ApiProperty()
  @IsString()
  sourceType: string;

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
  agentId?: string;

  @ApiProperty()
  @IsString()
  authType: string;

  @ApiProperty({ type: 'object' })
  @IsObject()
  credentials: any;

  @ApiProperty({ required: false, type: 'object' })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiProperty({ default: 'daily' })
  @IsOptional()
  @IsString()
  syncFrequency?: string;
}

export class UpdateDataSourceDto {
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
  @IsString()
  syncFrequency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
