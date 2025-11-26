import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FineTuningJob } from './fine-tuning-job.entity';

@Entity('fine_tuning_events')
export class FineTuningEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => FineTuningJob, (job) => job.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: FineTuningJob;

  @Column({ name: 'event_type', length: 100 })
  eventType: string; // 'status_change', 'progress_update', 'error', 'metric_update'

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
