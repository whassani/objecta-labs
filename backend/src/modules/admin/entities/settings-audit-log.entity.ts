import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('settings_audit_log')
export class SettingsAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'setting_type', type: 'varchar', length: 50 })
  settingType: 'system' | 'feature' | 'organization' | 'admin';

  @Column({ name: 'setting_key', type: 'varchar', length: 100 })
  settingKey: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changer: PlatformUser;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
