import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('secrets_rotation_history')
export class SecretsRotationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'secret_key', type: 'varchar', length: 200 })
  secretKey: string;

  @Column({ name: 'rotated_by', nullable: true })
  rotatedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'rotated_by' })
  rotator: PlatformUser;

  @Column({ name: 'old_value_hash', type: 'varchar', length: 64, nullable: true })
  oldValueHash: string;

  @Column({ name: 'new_value_hash', type: 'varchar', length: 64, nullable: true })
  newValueHash: string;

  @Column({ name: 'rotation_reason', type: 'text', nullable: true })
  rotationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
