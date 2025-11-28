import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsObject, Min } from 'class-validator';
import { PlanTier, PlanLimits, PlanFeatures } from '../../billing/entities/subscription-plan.entity';

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsEnum(PlanTier)
  tier: PlanTier;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @IsNumber()
  @Min(0)
  priceYearly: number;

  @IsObject()
  limits: PlanLimits;

  @IsObject()
  features: PlanFeatures;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;
}

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @IsOptional()
  @IsObject()
  limits?: PlanLimits;

  @IsOptional()
  @IsObject()
  features?: PlanFeatures;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;
}

export class PlanLimitsDto implements PlanLimits {
  @IsNumber()
  maxAgents: number;

  @IsNumber()
  maxConversations: number;

  @IsNumber()
  maxWorkflows: number;

  @IsNumber()
  maxTools: number;

  @IsNumber()
  maxDataSources: number;

  @IsNumber()
  maxDocuments: number;

  @IsNumber()
  maxTeamMembers: number;

  @IsNumber()
  monthlyTokenLimit: number;

  @IsNumber()
  dailyTokenLimit: number;

  @IsNumber()
  maxTokensPerRequest: number;

  @IsNumber()
  maxDocumentSizeMB: number;

  @IsNumber()
  maxKnowledgeBaseSizeMB: number;

  @IsNumber()
  maxWorkflowExecutionsPerDay: number;

  @IsNumber()
  maxApiCallsPerDay: number;

  @IsNumber()
  maxFineTuningJobs: number;

  @IsNumber()
  maxFineTuningDatasets: number;

  @IsNumber()
  maxTrainingExamplesPerDataset: number;
}

export class PlanFeaturesDto implements PlanFeatures {
  @IsBoolean()
  basicAgents: boolean;

  @IsBoolean()
  advancedAgents: boolean;

  @IsBoolean()
  customModels: boolean;

  @IsBoolean()
  fineTuning: boolean;

  @IsBoolean()
  workflows: boolean;

  @IsBoolean()
  advancedWorkflows: boolean;

  @IsBoolean()
  knowledgeBase: boolean;

  @IsBoolean()
  semanticSearch: boolean;

  @IsBoolean()
  hybridSearch: boolean;

  @IsBoolean()
  teamCollaboration: boolean;

  @IsBoolean()
  roleBasedAccess: boolean;

  @IsBoolean()
  auditLogs: boolean;

  @IsBoolean()
  apiAccess: boolean;

  @IsBoolean()
  webhooks: boolean;

  @IsBoolean()
  customIntegrations: boolean;

  @IsBoolean()
  basicAnalytics: boolean;

  @IsBoolean()
  advancedAnalytics: boolean;

  @IsBoolean()
  customReports: boolean;

  @IsBoolean()
  realTimeMonitoring: boolean;

  @IsBoolean()
  emailSupport: boolean;

  @IsBoolean()
  prioritySupport: boolean;

  @IsBoolean()
  dedicatedSupport: boolean;

  @IsNumber()
  slaDays: number;

  @IsBoolean()
  sso: boolean;

  @IsBoolean()
  customDomain: boolean;

  @IsNumber()
  dataRetentionDays: number;

  @IsNumber()
  backupFrequencyHours: number;
}
