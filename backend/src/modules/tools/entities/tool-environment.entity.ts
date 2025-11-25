import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tool } from './tool.entity';

@Entity('tool_environments')
export class ToolEnvironment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tool_id' })
  toolId: string;

  @ManyToOne(() => Tool, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'development', 'staging', 'production'

  @Column({ type: 'jsonb' })
  config: {
    url?: string;
    headers?: Record<string, string>;
    auth?: any;
    timeout?: number;
    variables?: Record<string, string>; // Environment-specific variables
  };

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
