import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Subscription } from './subscription.entity';

@Entity('usage_records')
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'metric_type' })
  metricType: string; // messages, agents, storage, api_calls

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
