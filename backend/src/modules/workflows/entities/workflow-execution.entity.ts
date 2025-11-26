import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowExecutionStep } from './workflow-execution-step.entity';

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.executions)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'workflow_version' })
  workflowVersion: number;

  @Column({
    type: 'enum',
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.PENDING,
  })
  status: WorkflowExecutionStatus;

  @Column({ name: 'trigger_data', type: 'jsonb', nullable: true })
  triggerData: Record<string, any>;

  @CreateDateColumn({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>;

  @OneToMany(() => WorkflowExecutionStep, (step) => step.execution, {
    cascade: true,
    eager: true,
  })
  steps: WorkflowExecutionStep[];
}
