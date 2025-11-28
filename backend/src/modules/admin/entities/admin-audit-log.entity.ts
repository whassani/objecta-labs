import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  @ManyToOne(() => PlatformUser)
  @JoinColumn({ name: 'admin_user_id' })
  platformUser: PlatformUser;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ name: 'ip_address', type: 'inet' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
