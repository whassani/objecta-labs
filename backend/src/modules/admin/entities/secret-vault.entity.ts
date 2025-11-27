import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('secrets_vault')
export class SecretVault {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  key: string;

  @Column({ name: 'encrypted_value', type: 'text' })
  encryptedValue: string;

  @Column({ type: 'varchar', length: 32 })
  iv: string;

  @Column({ name: 'auth_tag', type: 'varchar', length: 32 })
  authTag: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 20, default: 'production' })
  environment: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'is_platform_secret', type: 'boolean', default: false })
  isPlatformSecret: boolean;

  @Column({ name: 'last_rotated_at', type: 'timestamp with time zone', nullable: true })
  lastRotatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: PlatformUser;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: PlatformUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
