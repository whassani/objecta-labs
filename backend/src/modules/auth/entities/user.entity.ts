import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRoleAssignment } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { eager: true, nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  // Virtual property - computed from firstName + lastName
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // ✅ NEW: Email verification fields
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken: string;

  // ✅ NEW: Password reset fields
  @Column({ name: 'reset_token', nullable: true })
  resetToken: string;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires: Date;

  // ✅ NEW: Activity tracking
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RBAC relationship - use this for role management
  @OneToMany(() => UserRoleAssignment, assignment => assignment.user)
  roleAssignments: UserRoleAssignment[];

  // Virtual property for computed roles (populated by services)
  roles?: string[];
}
