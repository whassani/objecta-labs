import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('daily_metrics')
@Unique(['organizationId', 'date'])
@Index(['organizationId'])
@Index(['date'])
export class DailyMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_messages', default: 0 })
  totalMessages: number;

  @Column({ name: 'total_conversations', default: 0 })
  totalConversations: number;

  @Column({ name: 'total_tokens', type: 'bigint', default: 0 })
  totalTokens: number;

  @Column({ name: 'unique_users', default: 0 })
  uniqueUsers: number;

  @Column({ name: 'avg_response_time', type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgResponseTime: number;

  @Column({ name: 'agent_count', default: 0 })
  agentCount: number;

  @Column({ name: 'workflow_executions', default: 0 })
  workflowExecutions: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
