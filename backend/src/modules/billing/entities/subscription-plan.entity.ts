import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  PRO_MAX = 'pro_max',
}

export interface PlanLimits {
  // Core Limits
  maxAgents: number;
  maxConversations: number;
  maxWorkflows: number;
  maxTools: number;
  maxDataSources: number;
  maxDocuments: number;
  maxTeamMembers: number;

  // Token Limits
  monthlyTokenLimit: number; // Total tokens per month
  dailyTokenLimit: number; // Daily token limit
  maxTokensPerRequest: number; // Max tokens per single request

  // Feature Limits
  maxDocumentSizeMB: number; // Max document upload size
  maxKnowledgeBaseSizeMB: number; // Total KB storage
  maxWorkflowExecutionsPerDay: number;
  maxApiCallsPerDay: number;

  // Fine-tuning Limits
  maxFineTuningJobs: number;
  maxFineTuningDatasets: number;
  maxTrainingExamplesPerDataset: number;
}

export interface PlanFeatures {
  // Core Features
  basicAgents: boolean;
  advancedAgents: boolean;
  customModels: boolean;
  fineTuning: boolean;
  workflows: boolean;
  advancedWorkflows: boolean;
  knowledgeBase: boolean;
  semanticSearch: boolean;
  hybridSearch: boolean;
  
  // Collaboration
  teamCollaboration: boolean;
  roleBasedAccess: boolean;
  auditLogs: boolean;
  
  // Integrations
  apiAccess: boolean;
  webhooks: boolean;
  customIntegrations: boolean;
  
  // Analytics & Monitoring
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  customReports: boolean;
  realTimeMonitoring: boolean;
  
  // Support
  emailSupport: boolean;
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  slaDays: number; // SLA response time in days
  
  // Security
  sso: boolean;
  customDomain: boolean;
  dataRetentionDays: number;
  backupFrequencyHours: number;
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // Free, Pro, Pro Max

  @Column({ type: 'varchar', unique: true })
  tier: PlanTier;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceMonthly: number; // Monthly price in USD

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceYearly: number; // Yearly price in USD (usually discounted)

  @Column({ type: 'jsonb' })
  limits: PlanLimits;

  @Column({ type: 'jsonb' })
  features: PlanFeatures;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPopular: boolean; // Highlight as "Most Popular"

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Display order

  @Column({ name: 'stripe_price_id_monthly', nullable: true })
  stripePriceIdMonthly: string;

  @Column({ name: 'stripe_price_id_yearly', nullable: true })
  stripePriceIdYearly: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
