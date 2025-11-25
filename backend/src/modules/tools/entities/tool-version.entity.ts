import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tool } from './tool.entity';

@Entity('tool_versions')
export class ToolVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tool_id' })
  toolId: string;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'integer' })
  version: number;

  @Column({ type: 'jsonb' })
  snapshot: {
    name: string;
    description: string;
    config: any;
    schema: any;
    retryConfig: any;
    responseTransform: any;
  };

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string; // User ID

  @Column({ type: 'text', nullable: true })
  changelog: string;

  @Column({ type: 'simple-array', nullable: true, name: 'changed_fields' })
  changedFields: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
