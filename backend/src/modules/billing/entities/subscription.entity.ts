import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'plan_id', nullable: true })
  planId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'stripe_customer_id', unique: true, nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', unique: true, nullable: true })
  stripeSubscriptionId: string;

  @Column({ default: 'free' })
  plan: string; // Legacy field - kept for backward compatibility

  @Column({ type: 'varchar', default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ name: 'billing_cycle', type: 'varchar', default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Column({ name: 'current_period_start', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'trial_end', nullable: true })
  trialEnd: Date;

  @Column({ name: 'usage_tokens_current_period', default: 0 })
  usageTokensCurrentPeriod: number;

  @Column({ name: 'usage_reset_at', nullable: true })
  usageResetAt: Date;

  @Column({ name: 'discount_percentage', default: 0 })
  discountPercentage: number;

  @Column({ name: 'discount_end_date', nullable: true })
  discountEndDate: Date;

  @Column({ name: 'admin_notes', nullable: true, type: 'text' })
  adminNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
