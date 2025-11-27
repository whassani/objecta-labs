import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { PlatformUser } from './platform-user.entity';

@Entity('organization_settings')
export class OrganizationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'setting_key', type: 'varchar', length: 100 })
  settingKey: string;

  @Column({ name: 'setting_value', type: 'text', nullable: true })
  settingValue: string;

  @Column({ name: 'value_type', type: 'varchar', length: 20, default: 'string' })
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'array';

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: PlatformUser;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to get typed value
  getTypedValue(): any {
    if (!this.settingValue) return null;

    switch (this.valueType) {
      case 'number':
        return parseFloat(this.settingValue);
      case 'boolean':
        return this.settingValue === 'true';
      case 'json':
        try {
          return JSON.parse(this.settingValue);
        } catch {
          return this.settingValue;
        }
      case 'array':
        try {
          return JSON.parse(this.settingValue);
        } catch {
          return [];
        }
      default:
        return this.settingValue;
    }
  }

  // Helper method to set typed value
  setTypedValue(value: any): void {
    if (value === null || value === undefined) {
      this.settingValue = null;
      return;
    }

    switch (this.valueType) {
      case 'number':
        this.settingValue = String(value);
        break;
      case 'boolean':
        this.settingValue = value ? 'true' : 'false';
        break;
      case 'json':
      case 'array':
        this.settingValue = JSON.stringify(value);
        break;
      default:
        this.settingValue = String(value);
    }
  }
}
