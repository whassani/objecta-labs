import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('workspace_activity')
export class WorkspaceActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'activity_type' })
  activityType: string; // agent_created, workflow_executed, document_uploaded, etc.

  @Column({ name: 'entity_type', nullable: true })
  entityType: string; // agent, workflow, document, etc.

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
