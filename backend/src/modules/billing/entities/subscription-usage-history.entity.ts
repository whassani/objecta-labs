import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('subscription_usage_history')
export class SubscriptionUsageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @Column({ name: 'tokens_used', default: 0 })
  tokensUsed: number;

  @Column({ name: 'api_calls_made', default: 0 })
  apiCallsMade: number;

  @Column({ name: 'workflow_executions', default: 0 })
  workflowExecutions: number;

  @Column({ name: 'storage_used_mb', default: 0 })
  storageUsedMb: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
