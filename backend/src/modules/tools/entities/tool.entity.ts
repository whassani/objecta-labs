import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agent_tools')
export class Tool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'tool_type' })
  toolType: string; // database, api, file, custom

  @Column({ name: 'action_type' })
  actionType: string; // read, write, update, delete

  @Column({ type: 'jsonb' })
  config: any;

  @Column({ type: 'jsonb' })
  schema: any;

  @Column({ type: 'simple-array', default: '' })
  permissions: string[];

  @Column({ name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ name: 'rate_limit', default: 100 })
  rateLimit: number;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
