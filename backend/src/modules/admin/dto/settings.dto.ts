import { IsString, IsBoolean, IsOptional, IsEnum, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// System Settings DTOs
export class CreateSystemSettingDto {
  @ApiProperty({ example: 'platform' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'name' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'ObjectaLabs' })
  @IsString()
  value: string;

  @ApiProperty({ enum: ['string', 'number', 'boolean', 'json', 'array'], example: 'string' })
  @IsEnum(['string', 'number', 'boolean', 'json', 'array'])
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @ApiPropertyOptional({ example: 'Platform display name' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  validationRules?: any;
}

export class UpdateSystemSettingDto {
  @ApiPropertyOptional({ example: 'ObjectaLabs Platform' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ example: 'Updated platform name' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;
}

export class GetSettingsByCategoryDto {
  @ApiProperty({ example: 'platform' })
  @IsString()
  category: string;
}

// Feature Flags DTOs
export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'Advanced Analytics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'advanced_analytics' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ example: 'Enable advanced analytics dashboard' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ enum: ['all', 'percentage', 'whitelist', 'plan'], example: 'all' })
  @IsOptional()
  @IsEnum(['all', 'percentage', 'whitelist', 'plan'])
  rolloutStrategy?: 'all' | 'percentage' | 'whitelist' | 'plan';

  @ApiPropertyOptional({ example: ['professional', 'enterprise'] })
  @IsOptional()
  @IsArray()
  targetPlans?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  targetOrgs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ example: 'Advanced Analytics Dashboard' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Enable advanced analytics with AI insights' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({ enum: ['all', 'percentage', 'whitelist', 'plan'] })
  @IsOptional()
  @IsEnum(['all', 'percentage', 'whitelist', 'plan'])
  rolloutStrategy?: 'all' | 'percentage' | 'whitelist' | 'plan';

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  targetPlans?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  targetOrgs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class CheckFeatureFlagDto {
  @ApiProperty({ example: 'advanced_analytics' })
  @IsString()
  flagKey: string;

  @ApiProperty({ example: 'org-uuid-here' })
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  plan?: string;
}

// Organization Settings DTOs
export class CreateOrganizationSettingDto {
  @ApiProperty({ example: 'org-uuid-here' })
  @IsString()
  organizationId: string;

  @ApiProperty({ example: 'limits.max_users_per_org' })
  @IsString()
  settingKey: string;

  @ApiProperty({ example: '50' })
  @IsString()
  settingValue: string;

  @ApiProperty({ enum: ['string', 'number', 'boolean', 'json', 'array'], example: 'number' })
  @IsEnum(['string', 'number', 'boolean', 'json', 'array'])
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @ApiPropertyOptional({ example: 'Increased limit for enterprise customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrganizationSettingDto {
  @ApiPropertyOptional({ example: '100' })
  @IsOptional()
  @IsString()
  settingValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['string', 'number', 'boolean', 'json', 'array'])
  valueType?: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Admin Preferences DTOs
export class UpdateAdminPreferencesDto {
  @ApiPropertyOptional({ example: { theme: 'dark', language: 'en' } })
  @IsObject()
  preferences: Record<string, any>;
}

// Settings Audit Log DTOs
export class GetSettingsAuditLogDto {
  @ApiPropertyOptional({ enum: ['system', 'feature', 'organization', 'admin'] })
  @IsOptional()
  @IsEnum(['system', 'feature', 'organization', 'admin'])
  settingType?: 'system' | 'feature' | 'organization' | 'admin';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  settingKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;
}

// Response DTOs
export class SystemSettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  valueType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isSensitive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FeatureFlagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  rolloutPercentage: number;

  @ApiProperty()
  rolloutStrategy: string;

  @ApiProperty()
  targetPlans: string[];

  @ApiProperty()
  targetOrgs: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FeatureFlagCheckResponseDto {
  @ApiProperty()
  flagKey: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  reason: string;
}

export class SettingsGroupedResponseDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  settings: SystemSettingResponseDto[];
}
