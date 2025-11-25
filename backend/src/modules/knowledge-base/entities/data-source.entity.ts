import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column({ name: 'source_type' })
  sourceType: string; // github, confluence, notion, jira, etc.

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'auth_type' })
  authType: string; // oauth, api_key, basic

  @Column({ type: 'jsonb' })
  credentials: any; // Encrypted credentials

  @Column({ type: 'jsonb', default: '{}' })
  config: any;

  @Column({ name: 'sync_frequency', default: 'daily' })
  syncFrequency: string; // realtime, hourly, daily, manual

  @Column({ name: 'last_synced_at', nullable: true })
  lastSyncedAt: Date;

  @Column({ default: 'active' })
  status: string; // active, paused, error

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
