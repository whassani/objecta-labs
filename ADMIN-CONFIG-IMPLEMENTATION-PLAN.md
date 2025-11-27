# 🔧 Admin Configuration Management - Complete Implementation Plan

## 🎯 Overview

This document provides a **complete implementation plan** for adding dynamic configuration management to your SaaS admin panel.

**Goal:** Allow admins to configure platform settings, feature flags, and organization-specific overrides through the UI without redeploying code.

---

## 📦 What We're Building

### Core Features

1. **System Settings Management** - Platform-wide configuration
2. **Feature Flags** - Enable/disable features dynamically
3. **Organization Overrides** - Custom settings per customer
4. **Admin Preferences** - Personal admin settings
5. **Settings Audit Log** - Track all configuration changes
6. **Validation & Caching** - Ensure data integrity and performance

---

## 🗂️ Phase 1: Database Schema (Day 1 - 2 hours)

### Step 1.1: Create Migration File

```bash
touch backend/src/migrations/013-create-settings-tables.sql
```

### Step 1.2: Database Schema

```sql
-- ============================================
-- System Settings Tables
-- ============================================

-- Main system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  validation_rules JSONB,
  updated_by UUID REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_setting_key UNIQUE(category, key)
);

-- Feature flags for gradual rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_strategy VARCHAR(50) DEFAULT 'all' CHECK (rollout_strategy IN ('all', 'percentage', 'whitelist', 'plan')),
  target_plans TEXT[] DEFAULT '{}',
  target_orgs UUID[] DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization-specific setting overrides
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'array')),
  updated_by UUID REFERENCES platform_users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_org_setting UNIQUE(organization_id, setting_key)
);

-- Admin user preferences
CREATE TABLE IF NOT EXISTS admin_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_admin_prefs UNIQUE(admin_id)
);

-- Audit log for settings changes
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('system', 'feature', 'organization', 'admin')),
  setting_key VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES platform_users(id),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;
CREATE INDEX idx_system_settings_updated ON system_settings(updated_at DESC);

CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = true;
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_strategy ON feature_flags(rollout_strategy);

CREATE INDEX idx_org_settings_org_id ON organization_settings(organization_id);
CREATE INDEX idx_org_settings_key ON organization_settings(setting_key);
CREATE INDEX idx_org_settings_org_key ON organization_settings(organization_id, setting_key);

CREATE INDEX idx_admin_prefs_admin_id ON admin_preferences(admin_id);

CREATE INDEX idx_settings_audit_type ON settings_audit_log(setting_type);
CREATE INDEX idx_settings_audit_key ON settings_audit_log(setting_key);
CREATE INDEX idx_settings_audit_changed_by ON settings_audit_log(changed_by);
CREATE INDEX idx_settings_audit_created ON settings_audit_log(created_at DESC);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE system_settings IS 'Platform-wide system settings';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and A/B testing';
COMMENT ON TABLE organization_settings IS 'Customer-specific setting overrides';
COMMENT ON TABLE admin_preferences IS 'Admin user preferences and UI settings';
COMMENT ON TABLE settings_audit_log IS 'Audit trail for all configuration changes';

-- ============================================
-- Seed Default Settings
-- ============================================

-- Platform Branding
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('platform', 'name', 'ObjectaLabs', 'string', 'Platform name', true),
('platform', 'tagline', 'Build AI Agents Without Code', 'string', 'Platform tagline', true),
('platform', 'logo_url', '/logo.png', 'string', 'Logo URL', true),
('platform', 'primary_color', '#3B82F6', 'string', 'Primary brand color', true),
('platform', 'secondary_color', '#10B981', 'string', 'Secondary brand color', true);

-- Contact Information
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('contact', 'support_email', 'support@objecta-labs.com', 'string', 'Support email address', true),
('contact', 'sales_email', 'sales@objecta-labs.com', 'string', 'Sales email address', true),
('contact', 'website', 'https://objecta-labs.com', 'string', 'Company website', true);

-- Default Limits
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('limits', 'max_users_per_org', '10', 'number', 'Maximum users per organization', false),
('limits', 'max_agents_per_org', '5', 'number', 'Maximum agents per organization', false),
('limits', 'max_conversations_per_org', '100', 'number', 'Maximum conversations per organization', false),
('limits', 'max_storage_gb', '5', 'number', 'Maximum storage per organization (GB)', false),
('limits', 'max_api_calls_per_month', '10000', 'number', 'Maximum API calls per month', false),
('limits', 'max_knowledge_base_docs', '100', 'number', 'Maximum knowledge base documents', false);

-- Security Policies
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('security', 'session_timeout_minutes', '60', 'number', 'Session timeout in minutes', false),
('security', 'require_2fa', 'false', 'boolean', 'Require two-factor authentication', false),
('security', 'password_min_length', '8', 'number', 'Minimum password length', false),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase in password', false),
('security', 'password_require_number', 'true', 'boolean', 'Require number in password', false),
('security', 'password_require_special', 'true', 'boolean', 'Require special character in password', false),
('security', 'max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', false),
('security', 'lockout_duration_minutes', '15', 'number', 'Account lockout duration in minutes', false);

-- Billing Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('billing', 'trial_length_days', '14', 'number', 'Trial period length in days', false),
('billing', 'default_plan', 'free', 'string', 'Default subscription plan', false),
('billing', 'grace_period_days', '3', 'number', 'Payment grace period in days', false),
('billing', 'auto_suspend_on_failure', 'false', 'boolean', 'Auto-suspend on payment failure', false);

-- Maintenance Mode
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('maintenance', 'enabled', 'false', 'boolean', 'Maintenance mode enabled', true),
('maintenance', 'message', 'We are performing scheduled maintenance', 'string', 'Maintenance message', true),
('maintenance', 'allow_admin_access', 'true', 'boolean', 'Allow admin access during maintenance', false);

-- API Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('api', 'rate_limit_per_minute', '100', 'number', 'API rate limit per minute', false),
('api', 'rate_limit_per_hour', '5000', 'number', 'API rate limit per hour', false),
('api', 'timeout_seconds', '30', 'number', 'API timeout in seconds', false),
('api', 'max_request_size_mb', '10', 'number', 'Maximum request size in MB', false);

-- Analytics
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('analytics', 'enabled', 'true', 'boolean', 'Analytics tracking enabled', false),
('analytics', 'retention_days', '90', 'number', 'Data retention period in days', false),
('analytics', 'track_user_activity', 'true', 'boolean', 'Track user activity', false);

-- Email Configuration
INSERT INTO system_settings (category, key, value, value_type, description, is_public, is_sensitive) VALUES
('email', 'smtp_host', 'smtp.sendgrid.net', 'string', 'SMTP host', false, false),
('email', 'smtp_port', '587', 'number', 'SMTP port', false, false),
('email', 'smtp_user', '', 'string', 'SMTP username', false, true),
('email', 'smtp_password', '', 'string', 'SMTP password', false, true),
('email', 'from_address', 'noreply@objecta-labs.com', 'string', 'From email address', false, false),
('email', 'from_name', 'ObjectaLabs', 'string', 'From name', false, false);

-- Default Feature Flags
INSERT INTO feature_flags (name, key, description, enabled, rollout_strategy) VALUES
('Workflow Automation', 'workflow_automation', 'Enable workflow automation features', true, 'all'),
('Fine Tuning', 'fine_tuning', 'Enable fine-tuning features', true, 'all'),
('Advanced Analytics', 'advanced_analytics', 'Enable advanced analytics dashboard', false, 'plan'),
('White Label', 'white_label', 'Enable white-label customization', false, 'plan'),
('SSO Integration', 'sso', 'Enable Single Sign-On', false, 'plan'),
('API Access', 'api_access', 'Enable API access', true, 'all'),
('Custom Domains', 'custom_domains', 'Enable custom domain support', false, 'plan'),
('Priority Support', 'priority_support', 'Enable priority support', false, 'plan'),
('Beta Features', 'beta_features', 'Enable beta features', false, 'whitelist');
```

### Step 1.3: Run Migration

```bash
psql -U postgres -d objecta-labs -f backend/src/migrations/013-create-settings-tables.sql
```

---

## 🏗️ Phase 2: Backend Entities (Day 1 - 1 hour)

### Create Entity Files

```bash
mkdir -p backend/src/modules/admin/entities/settings
touch backend/src/modules/admin/entities/settings/system-setting.entity.ts
touch backend/src/modules/admin/entities/settings/feature-flag.entity.ts
touch backend/src/modules/admin/entities/settings/organization-setting.entity.ts
touch backend/src/modules/admin/entities/settings/admin-preference.entity.ts
touch backend/src/modules/admin/entities/settings/settings-audit-log.entity.ts
```

### Entity Implementations

**File: `backend/src/modules/admin/entities/settings/system-setting.entity.ts`**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from '../platform-user.entity';

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
        return JSON.parse(this.value);
      case 'array':
        return JSON.parse(this.value);
      default:
        return this.value;
    }
  }
}
```

**File: `backend/src/modules/admin/entities/settings/feature-flag.entity.ts`**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformUser } from '../platform-user.entity';

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ name: 'rollout_percentage', type: 'integer', default: 0 })
  rolloutPercentage: number;

  @Column({ name: 'rollout_strategy', type: 'varchar', length: 50, default: 'all' })
  rolloutStrategy: 'all' | 'percentage' | 'whitelist' | 'plan';

  @Column({ name: 'target_plans', type: 'text', array: true, default: '{}' })
  targetPlans: string[];

  @Column({ name: 'target_orgs', type: 'uuid', array: true, default: '{}' })
  targetOrgs: string[];

  @Column({ type: 'jsonb', default: '{}' })
  conditions: any;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: any;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => PlatformUser, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: PlatformUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if feature is enabled for organization
  isEnabledForOrganization(orgId: string, plan?: string): boolean {
    if (!this.enabled) return false;

    switch (this.rolloutStrategy) {
      case 'all':
        return true;
      case 'whitelist':
        return this.targetOrgs.includes(orgId);
      case 'plan':
        return plan && this.targetPlans.includes(plan);
      case 'percentage':
        // Simple hash-based percentage rollout
        const hash = this.hashOrgId(orgId);
        return hash < this.rolloutPercentage;
      default:
        return false;
    }
  }

  private hashOrgId(orgId: string): number {
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}
```

**File: `backend/src/modules/admin/entities/settings/organization-setting.entity.ts`**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../../organizations/entities/organization.entity';
import { PlatformUser } from '../platform-user.entity';

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

  getTypedValue(): any {
    if (!this.settingValue) return null;

    switch (this.valueType) {
      case 'number':
        return parseFloat(this.settingValue);
      case 'boolean':
        return this.settingValue === 'true';
      case 'json':
        return JSON.parse(this.settingValue);
      case 'array':
        return JSON.parse(this.settingValue);
      default:
        return this.settingValue;
    }
  }
}
```

Continue in next document...

---

## 📝 Summary of Missing Config Components

### Database Layer ❌
- System settings table
- Feature flags table
- Organization overrides table
- Admin preferences table
- Settings audit log table

### Backend Layer ❌
- Settings entities (5 files)
- Settings DTOs (5 files)
- Settings service (CRUD operations)
- Feature flags service
- Configuration cache service
- Settings controller (API endpoints)

### Frontend Layer ❌
- Settings API client
- System settings UI (connected)
- Feature flags management UI
- Organization override UI
- Settings validation
- Audit log viewer

### Infrastructure ❌
- Redis caching for settings
- Hot reload mechanism
- Default settings seeder
- Migration scripts
- Documentation

**Total Estimate: 5-7 days** for complete implementation

---

Would you like me to continue with the full implementation (Backend Services, Controllers, DTOs, Frontend, etc.)?
