import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export type JobStatus = 
  | 'pending' 
  | 'active' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'delayed';

export type JobType = 
  | 'data-conversion' 
  | 'fine-tuning' 
  | 'workflow-execution' 
  | 'document-processing' 
  | 'model-training'
  | 'bulk-operation';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  type: JobType;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: JobStatus;

  @Column({ type: 'jsonb', nullable: true })
  data: any; // Job input data

  @Column({ type: 'jsonb', nullable: true })
  result: any; // Job output/result

  @Column({ type: 'jsonb', nullable: true })
  error: any; // Error details if failed

  @Column({ type: 'jsonb', nullable: true })
  progress: {
    current: number;
    total: number;
    percentage: number;
    message: string;
  };

  @Column({ name: 'queue_name', length: 100 })
  queueName: string;

  @Column({ name: 'bull_job_id', nullable: true })
  bullJobId: string; // Bull queue job ID

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed fields
  get duration(): number | null {
    if (this.startedAt && this.completedAt) {
      return this.completedAt.getTime() - this.startedAt.getTime();
    }
    return null;
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isActive(): boolean {
    return this.status === 'active';
  }
}
