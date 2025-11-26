import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../auth/entities/user.entity';
import { TrainingExample } from './training-example.entity';
import { FineTuningJob } from './fine-tuning-job.entity';

@Entity('fine_tuning_datasets')
export class FineTuningDataset {
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

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size_bytes', type: 'bigint' })
  fileSizeBytes: number;

  @Column({ length: 50, default: 'jsonl' })
  format: string;

  // Dataset Statistics
  @Column({ name: 'total_examples', default: 0 })
  totalExamples: number;

  @Column({ default: false })
  validated: boolean;

  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors: any;

  // Metadata
  @Column({ length: 100, nullable: true })
  source: string; // 'upload', 'conversations', 'api'

  @Column({ name: 'source_filters', type: 'jsonb', nullable: true })
  sourceFilters: any;

  // Relations
  @OneToMany(() => TrainingExample, (example) => example.dataset)
  examples: TrainingExample[];

  @OneToMany(() => FineTuningJob, (job) => job.dataset)
  jobs: FineTuningJob[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
