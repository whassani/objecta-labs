import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { FineTuningJob } from './fine-tuning-job.entity';

export enum FineTunedModelStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

@Entity('fine_tuned_models')
export class FineTunedModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'job_id' })
  jobId: string;

  @OneToOne(() => FineTuningJob, (job) => job.resultModel, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: FineTuningJob;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Model Details
  @Column({ name: 'base_model', length: 100 })
  baseModel: string;

  @Column({ length: 50, default: 'openai' })
  provider: string;

  @Column({ name: 'provider_model_id', length: 255 })
  providerModelId: string;

  // Performance Metrics
  @Column({ name: 'training_accuracy', type: 'decimal', precision: 5, scale: 4, nullable: true })
  trainingAccuracy: number;

  @Column({ name: 'validation_accuracy', type: 'decimal', precision: 5, scale: 4, nullable: true })
  validationAccuracy: number;

  @Column({ name: 'final_loss', type: 'decimal', precision: 10, scale: 6, nullable: true })
  finalLoss: number;

  // Deployment
  @Column({ default: false })
  deployed: boolean;

  @Column({ name: 'deployed_at', type: 'timestamp', nullable: true })
  deployedAt: Date;

  @Column({ name: 'deployment_count', default: 0 })
  deploymentCount: number;

  // Usage Statistics
  @Column({ name: 'total_tokens_used', type: 'bigint', default: 0 })
  totalTokensUsed: number;

  @Column({ name: 'total_requests', default: 0 })
  totalRequests: number;

  @Column({ name: 'average_latency_ms', nullable: true })
  averageLatencyMs: number;

  // Version Control
  @Column({ default: 1 })
  version: number;

  @Column({ name: 'parent_model_id', nullable: true })
  parentModelId: string;

  @ManyToOne(() => FineTunedModel, { nullable: true })
  @JoinColumn({ name: 'parent_model_id' })
  parentModel: FineTunedModel;

  // Status
  @Column({
    type: 'enum',
    enum: FineTunedModelStatus,
    default: FineTunedModelStatus.ACTIVE,
  })
  status: FineTunedModelStatus;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamp', nullable: true })
  archivedAt: Date;
}
