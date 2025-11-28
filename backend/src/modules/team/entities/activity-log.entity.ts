import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'actor_name' })
  actorName: string;

  @Column({ name: 'action_type' })
  actionType: string; // created, updated, deleted, invited, etc.

  @Column({ name: 'resource_type' })
  resourceType: string; // agent, workflow, user, etc.

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'resource_name', nullable: true })
  resourceName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'ip_address', nullable: true, type: 'inet' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
