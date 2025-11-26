import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../auth/entities/user.entity';
import { FineTuningDataset } from './fine-tuning-dataset.entity';
import { FineTunedModel } from './fine-tuned-model.entity';
import { FineTuningEvent } from './fine-tuning-event.entity';

export enum FineTuningJobStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('fine_tuning_jobs')
export class FineTuningJob {
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

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'dataset_id' })
  datasetId: string;

  @ManyToOne(() => FineTuningDataset, (dataset) => dataset.jobs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'dataset_id' })
  dataset: FineTuningDataset;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Model Configuration
  @Column({ name: 'base_model', length: 100 })
  baseModel: string;

  @Column({ length: 50, default: 'openai' })
  provider: string;

  @Column({ name: 'provider_job_id', length: 255, nullable: true })
  providerJobId: string;

  // Hyperparameters
  @Column({ type: 'jsonb', default: {} })
  hyperparameters: any;

  // Status & Progress
  @Column({
    type: 'enum',
    enum: FineTuningJobStatus,
    default: FineTuningJobStatus.PENDING,
  })
  status: FineTuningJobStatus;

  @Column({ name: 'progress_percentage', default: 0 })
  progressPercentage: number;

  @Column({ name: 'current_epoch', nullable: true })
  currentEpoch: number;

  @Column({ name: 'total_epochs', nullable: true })
  totalEpochs: number;

  // Results
  @Column({ name: 'trained_tokens', type: 'bigint', nullable: true })
  trainedTokens: number;

  @Column({ name: 'training_loss', type: 'decimal', precision: 10, scale: 6, nullable: true })
  trainingLoss: number;

  @Column({ name: 'validation_loss', type: 'decimal', precision: 10, scale: 6, nullable: true })
  validationLoss: number;

  @Column({ name: 'result_model_id', nullable: true })
  resultModelId: string;

  @OneToOne(() => FineTunedModel, (model) => model.job, { nullable: true })
  @JoinColumn({ name: 'result_model_id' })
  resultModel: FineTunedModel;

  // Cost & Billing
  @Column({ name: 'estimated_cost_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCostUsd: number;

  @Column({ name: 'actual_cost_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCostUsd: number;

  // Error Handling
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'error_code', length: 100, nullable: true })
  errorCode: string;

  // Relations
  @OneToMany(() => FineTuningEvent, (event) => event.job)
  events: FineTuningEvent[];

  // Timestamps
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
