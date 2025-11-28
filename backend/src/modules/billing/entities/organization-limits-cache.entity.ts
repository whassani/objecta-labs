import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SubscriptionPlan, PlanLimits, PlanFeatures } from './subscription-plan.entity';

@Entity('organization_limits_cache')
export class OrganizationLimitsCache {
  @PrimaryColumn({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'plan_id', nullable: true })
  planId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ type: 'jsonb' })
  limits: PlanLimits;

  @Column({ type: 'jsonb' })
  features: PlanFeatures;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
