import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../auth/entities/user.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowWebhook } from './workflow-webhook.entity';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum WorkflowTriggerType {
  MANUAL = 'manual',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  EVENT = 'event',
  DATABASE = 'database',
  EMAIL = 'email',
  FORM = 'form',
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface TriggerConfig {
  cron?: string; // For schedule triggers
  timezone?: string;
  webhookUrl?: string; // For webhook triggers
  eventType?: string; // For event triggers
  filters?: Record<string, any>;
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  definition: WorkflowDefinition;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
  })
  status: WorkflowStatus;

  @Column({
    name: 'trigger_type',
    type: 'enum',
    enum: WorkflowTriggerType,
    default: WorkflowTriggerType.MANUAL,
  })
  triggerType: WorkflowTriggerType;

  @Column({ name: 'trigger_config', type: 'jsonb', nullable: true })
  triggerConfig: TriggerConfig;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_executed_at', nullable: true })
  lastExecutedAt: Date;

  @Column({ name: 'execution_count', default: 0 })
  executionCount: number;

  @OneToMany(() => WorkflowExecution, (execution) => execution.workflow)
  executions: WorkflowExecution[];

  @OneToMany(() => WorkflowWebhook, (webhook) => webhook.workflow)
  webhooks: WorkflowWebhook[];
}
