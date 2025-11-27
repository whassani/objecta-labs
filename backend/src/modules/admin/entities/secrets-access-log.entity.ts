import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('secrets_access_log')
export class SecretsAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secret_key', type: 'varchar', length: 200 })
  secretKey: string;

  @Column({ type: 'varchar', length: 50 })
  action: 'read' | 'write' | 'update' | 'delete' | 'rotate';

  @Column({ name: 'accessed_by', nullable: true })
  accessedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'accessed_by' })
  accessor: PlatformUser;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
