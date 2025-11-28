import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum BillingPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class BillingAnalyticsQueryDto {
  @IsOptional()
  @IsEnum(BillingPeriod)
  period?: BillingPeriod = BillingPeriod.MONTH;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface TokenUsageByDay {
  date: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  messageCount: number;
}

export interface TokenUsageByAgent {
  agentId: string;
  agentName: string;
  totalTokens: number;
  cost: number;
  messageCount: number;
  conversationCount: number;
}

export interface TokenUsageByModel {
  model: string;
  totalTokens: number;
  cost: number;
  messageCount: number;
  avgTokensPerMessage: number;
}

export interface BillingAnalyticsResponse {
  summary: {
    totalTokens: number;
    totalCost: number;
    totalMessages: number;
    totalConversations: number;
    avgTokensPerMessage: number;
    avgCostPerMessage: number;
  };
  usageByDay: TokenUsageByDay[];
  usageByAgent: TokenUsageByAgent[];
  usageByModel: TokenUsageByModel[];
  topConversations: {
    conversationId: string;
    title: string;
    totalTokens: number;
    cost: number;
    messageCount: number;
  }[];
}
