import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ name: 'rollout_percentage', type: 'integer', default: 0 })
  rolloutPercentage: number;

  @Column({ name: 'rollout_strategy', type: 'varchar', length: 50, default: 'all' })
  rolloutStrategy: 'all' | 'percentage' | 'whitelist' | 'plan';

  @Column({ name: 'target_plans', type: 'text', array: true, default: '{}' })
  targetPlans: string[];

  @Column({ name: 'target_orgs', type: 'uuid', array: true, default: '{}' })
  targetOrgs: string[];

  @Column({ type: 'jsonb', default: '{}' })
  conditions: any;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: PlatformUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if feature is enabled for organization
  isEnabledForOrganization(orgId: string, plan?: string): boolean {
    if (!this.enabled) return false;

    switch (this.rolloutStrategy) {
      case 'all':
        return true;
      case 'whitelist':
        return this.targetOrgs.includes(orgId);
      case 'plan':
        return plan && this.targetPlans.includes(plan);
      case 'percentage':
        // Simple hash-based percentage rollout
        const hash = this.hashOrgId(orgId);
        return hash < this.rolloutPercentage;
      default:
        return false;
    }
  }

  private hashOrgId(orgId: string): number {
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}
