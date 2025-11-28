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

@Entity('team_invitations')
export class TeamInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'invited_by' })
  invitedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @Column()
  email: string;

  @Column()
  role: string; // admin, member, viewer

  @Column({ unique: true })
  token: string;

  @Column({ default: 'pending' })
  status: string; // pending, accepted, expired, revoked

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
