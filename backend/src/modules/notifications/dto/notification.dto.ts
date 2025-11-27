import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum NotificationType {
  SYSTEM = 'system',
  BILLING = 'billing',
  AGENT = 'agent',
  WORKFLOW = 'workflow',
  TEAM = 'team',
  KNOWLEDGE_BASE = 'knowledge_base',
}

export enum NotificationCategory {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum EmailFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never',
}

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsString()
  link?: string;
}

export class UpdatePreferenceDto {
  @IsString()
  notificationType: string;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsEnum(EmailFrequency)
  emailFrequency?: EmailFrequency;
}
