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

@Entity('admin_preferences')
export class AdminPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_id' })
  adminId: string;

  @ManyToOne(() => PlatformUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: PlatformUser;

  @Column({ type: 'jsonb', default: '{}' })
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    timezone?: string;
    dashboardWidgets?: string[];
    notifications?: {
      email?: boolean;
      push?: boolean;
      desktop?: boolean;
    };
    defaultFilters?: Record<string, any>;
    itemsPerPage?: number;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  getPreference(key: string, defaultValue?: any): any {
    return this.preferences[key] ?? defaultValue;
  }

  setPreference(key: string, value: any): void {
    this.preferences = {
      ...this.preferences,
      [key]: value,
    };
  }

  updatePreferences(updates: Record<string, any>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
  }
}
