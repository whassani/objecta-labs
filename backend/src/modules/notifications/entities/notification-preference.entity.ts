import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('notification_preferences')
@Unique(['userId', 'notificationType'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'notification_type' })
  notificationType: string;

  @Column({ name: 'in_app_enabled', default: true })
  inAppEnabled: boolean;

  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'email_frequency', default: 'immediate' })
  emailFrequency: string; // immediate, daily, weekly, never

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
