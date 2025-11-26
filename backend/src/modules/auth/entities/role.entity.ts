import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRoleAssignment } from './user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  name: string; // owner, admin, editor, viewer

  @Column({ length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  permissions: string[]; // Array of permission strings

  @Column({ default: false })
  isDefault: boolean; // Default role for new users

  @Column({ default: false })
  isSystem: boolean; // System roles cannot be deleted

  @Column({ type: 'int', default: 0 })
  level: number; // Role hierarchy level (higher = more permissions)

  @OneToMany(() => UserRoleAssignment, (assignment) => assignment.role)
  userAssignments: UserRoleAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
