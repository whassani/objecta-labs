import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_webhooks')
export class WorkflowWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.webhooks)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'webhook_url', unique: true })
  webhookUrl: string;

  @Column({ name: 'secret_token', nullable: true })
  secretToken: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
