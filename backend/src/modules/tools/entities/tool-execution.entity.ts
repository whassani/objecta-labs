import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tool } from './tool.entity';

@Entity('tool_executions')
export class ToolExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tool_id' })
  toolId: string;

  @ManyToOne(() => Tool)
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  input: any;

  @Column({ type: 'jsonb', nullable: true })
  output: any;

  @Column({ type: 'jsonb', nullable: true })
  request: any; // Full request details (method, url, headers, body)

  @Column({ type: 'jsonb', nullable: true })
  response: any; // Full response details (status, headers, body)

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'execution_time', type: 'integer' }) // milliseconds
  executionTime: number;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'is_test', default: false })
  isTest: boolean; // Distinguish test executions from real ones

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
