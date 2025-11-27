import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSecretDto {
  @ApiProperty({ example: 'stripe.secret_key' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'sk_live_...' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'stripe', enum: ['stripe', 'smtp', 'llm', 'oauth', 'database', 'other'] })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Stripe secret key for production' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'production' })
  @IsOptional()
  @IsEnum(['production', 'staging', 'development'])
  environment?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'org-uuid-here', description: 'Organization ID for customer secrets (null for platform secrets)' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: false, description: 'True for platform secrets, false for organization secrets' })
  @IsOptional()
  isPlatformSecret?: boolean;
}

export class UpdateSecretDto {
  @ApiPropertyOptional({ example: 'sk_live_new...' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ example: 'Updated Stripe secret key' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class RotateSecretDto {
  @ApiProperty({ example: 'sk_live_new...' })
  @IsString()
  newValue: string;

  @ApiPropertyOptional({ example: 'Regular scheduled rotation' })
  @IsOptional()
  @IsString()
  rotationReason?: string;
}

export class GetSecretsQueryDto {
  @ApiPropertyOptional({ example: 'stripe' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'production' })
  @IsOptional()
  @IsEnum(['production', 'staging', 'development'])
  environment?: string;

  @ApiPropertyOptional({ example: 'org-uuid-here' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'platform', enum: ['platform', 'organization', 'all'] })
  @IsOptional()
  @IsString()
  scope?: 'platform' | 'organization' | 'all';
}

export class GetAccessLogQueryDto {
  @ApiPropertyOptional({ example: 'stripe.secret_key' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: 'read' })
  @IsOptional()
  @IsEnum(['read', 'write', 'update', 'delete', 'rotate'])
  action?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  offset?: number;
}

export class SecretResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty({ description: 'Masked value for security' })
  maskedValue: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  environment: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  isPlatformSecret: boolean;

  @ApiProperty()
  lastRotatedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
