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

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ name: 'value_type', type: 'varchar', length: 20, default: 'string' })
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'is_sensitive', type: 'boolean', default: false })
  isSensitive: boolean;

  @Column({ name: 'validation_rules', type: 'jsonb', nullable: true })
  validationRules: any;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: PlatformUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to get typed value
  getTypedValue(): any {
    if (!this.value) return null;

    switch (this.valueType) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return this.value;
        }
      case 'array':
        try {
          return JSON.parse(this.value);
        } catch {
          return [];
        }
      default:
        return this.value;
    }
  }

  // Helper method to set typed value
  setTypedValue(value: any): void {
    if (value === null || value === undefined) {
      this.value = null;
      return;
    }

    switch (this.valueType) {
      case 'number':
        this.value = String(value);
        break;
      case 'boolean':
        this.value = value ? 'true' : 'false';
        break;
      case 'json':
      case 'array':
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = String(value);
    }
  }
}
