import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class CreateTicketDto {
  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @IsOptional()
  tags?: string[];
}

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  tags?: string[];
}

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
