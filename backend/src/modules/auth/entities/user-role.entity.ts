import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

/**
 * User role assignment with scope (organization or workspace level)
 * 
 * Examples:
 * - User is OWNER of Organization A
 * - User is ADMIN in Organization A, Workspace 1
 * - User is EDITOR in Organization A, Workspace 2
 * - User is VIEWER in Organization A (all workspaces)
 */
@Entity('user_role_assignments')
@Unique(['userId', 'organizationId', 'workspaceId', 'roleId'])
export class UserRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace | null;

  @Column({ name: 'granted_by', nullable: true })
  grantedBy: string; // User ID who granted this role

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  grantor: User;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null; // Optional: for temporary access

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
