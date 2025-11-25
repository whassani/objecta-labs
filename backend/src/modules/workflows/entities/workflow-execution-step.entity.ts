import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('workflow_execution_steps')
export class WorkflowExecutionStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'execution_id' })
  executionId: string;

  @ManyToOne(() => WorkflowExecution, (execution) => execution.steps)
  @JoinColumn({ name: 'execution_id' })
  execution: WorkflowExecution;

  @Column({ name: 'node_id' })
  nodeId: string;

  @Column({ name: 'node_type' })
  nodeType: string;

  @Column({ name: 'node_name', nullable: true })
  nodeName: string;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING,
  })
  status: StepStatus;

  @Column({ name: 'input_data', type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @Column({ name: 'output_data', type: 'jsonb', nullable: true })
  outputData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'start_time', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;
}
