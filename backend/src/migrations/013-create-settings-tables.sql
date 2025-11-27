-- ============================================
-- Configuration Management System
-- Migration: 013-create-settings-tables.sql
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- System Settings Table
-- ============================================

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

-- ============================================
-- Feature Flags Table
-- ============================================

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

-- ============================================
-- Organization Settings Table
-- ============================================

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

-- ============================================
-- Admin Preferences Table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_admin_prefs UNIQUE(admin_id)
);

-- ============================================
-- Settings Audit Log Table
-- ============================================

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

COMMENT ON COLUMN system_settings.is_public IS 'If true, setting can be accessed by frontend without authentication';
COMMENT ON COLUMN system_settings.is_sensitive IS 'If true, value should be masked in logs and UI';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users to enable feature for (0-100)';
COMMENT ON COLUMN feature_flags.rollout_strategy IS 'Strategy for rolling out feature: all, percentage, whitelist, plan';

-- ============================================
-- Seed Default Settings
-- ============================================

-- Platform Branding
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('platform', 'name', 'ObjectaLabs', 'string', 'Platform name displayed in UI', true),
('platform', 'tagline', 'Build AI Agents Without Code', 'string', 'Platform tagline', true),
('platform', 'logo_url', '/logo.png', 'string', 'Logo URL', true),
('platform', 'favicon_url', '/favicon.ico', 'string', 'Favicon URL', true),
('platform', 'primary_color', '#3B82F6', 'string', 'Primary brand color (hex)', true),
('platform', 'secondary_color', '#10B981', 'string', 'Secondary brand color (hex)', true)
ON CONFLICT (category, key) DO NOTHING;

-- Contact Information
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('contact', 'support_email', 'support@objecta-labs.com', 'string', 'Support email address', true),
('contact', 'sales_email', 'sales@objecta-labs.com', 'string', 'Sales email address', true),
('contact', 'phone', '+1-555-0123', 'string', 'Support phone number', true),
('contact', 'website', 'https://objecta-labs.com', 'string', 'Company website', true),
('contact', 'address', '123 AI Street, Tech City, TC 12345', 'string', 'Company address', true)
ON CONFLICT (category, key) DO NOTHING;

-- Default Limits
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('limits', 'max_users_per_org', '10', 'number', 'Maximum users per organization (default)', false),
('limits', 'max_agents_per_org', '5', 'number', 'Maximum agents per organization (default)', false),
('limits', 'max_conversations_per_org', '100', 'number', 'Maximum conversations per organization (default)', false),
('limits', 'max_storage_gb', '5', 'number', 'Maximum storage per organization in GB (default)', false),
('limits', 'max_api_calls_per_month', '10000', 'number', 'Maximum API calls per month (default)', false),
('limits', 'max_knowledge_base_docs', '100', 'number', 'Maximum knowledge base documents (default)', false),
('limits', 'max_workflows_per_org', '10', 'number', 'Maximum workflows per organization (default)', false)
ON CONFLICT (category, key) DO NOTHING;

-- Security Policies
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('security', 'session_timeout_minutes', '60', 'number', 'User session timeout in minutes', false),
('security', 'admin_session_timeout_minutes', '480', 'number', 'Admin session timeout in minutes (8 hours)', false),
('security', 'require_2fa', 'false', 'boolean', 'Require two-factor authentication for all users', false),
('security', 'require_admin_2fa', 'true', 'boolean', 'Require 2FA for admin users', false),
('security', 'password_min_length', '8', 'number', 'Minimum password length', false),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase letter in password', false),
('security', 'password_require_lowercase', 'true', 'boolean', 'Require lowercase letter in password', false),
('security', 'password_require_number', 'true', 'boolean', 'Require number in password', false),
('security', 'password_require_special', 'true', 'boolean', 'Require special character in password', false),
('security', 'max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', false),
('security', 'lockout_duration_minutes', '15', 'number', 'Account lockout duration in minutes', false),
('security', 'password_expiry_days', '90', 'number', 'Password expiry in days (0 = never)', false)
ON CONFLICT (category, key) DO NOTHING;

-- Billing Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('billing', 'trial_length_days', '14', 'number', 'Trial period length in days', false),
('billing', 'default_plan', 'free', 'string', 'Default subscription plan for new signups', false),
('billing', 'grace_period_days', '3', 'number', 'Payment grace period in days', false),
('billing', 'auto_suspend_on_failure', 'false', 'boolean', 'Automatically suspend account on payment failure', false),
('billing', 'send_payment_reminders', 'true', 'boolean', 'Send payment reminder emails', false),
('billing', 'invoice_due_days', '30', 'number', 'Invoice due date in days', false)
ON CONFLICT (category, key) DO NOTHING;

-- Maintenance Mode
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('maintenance', 'enabled', 'false', 'boolean', 'Maintenance mode enabled', true),
('maintenance', 'message', 'We are performing scheduled maintenance. We will be back shortly.', 'string', 'Maintenance message displayed to users', true),
('maintenance', 'start_time', '', 'string', 'Scheduled maintenance start time (ISO 8601)', true),
('maintenance', 'end_time', '', 'string', 'Scheduled maintenance end time (ISO 8601)', true),
('maintenance', 'allow_admin_access', 'true', 'boolean', 'Allow admin users to access during maintenance', false)
ON CONFLICT (category, key) DO NOTHING;

-- API Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('api', 'rate_limit_per_minute', '100', 'number', 'API rate limit per minute (default)', false),
('api', 'rate_limit_per_hour', '5000', 'number', 'API rate limit per hour (default)', false),
('api', 'timeout_seconds', '30', 'number', 'API timeout in seconds', false),
('api', 'max_request_size_mb', '10', 'number', 'Maximum request size in MB', false),
('api', 'allowed_origins', '["*"]', 'json', 'Allowed CORS origins', false)
ON CONFLICT (category, key) DO NOTHING;

-- Analytics Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('analytics', 'enabled', 'true', 'boolean', 'Analytics tracking enabled', false),
('analytics', 'retention_days', '90', 'number', 'Analytics data retention period in days', false),
('analytics', 'track_user_activity', 'true', 'boolean', 'Track detailed user activity', false),
('analytics', 'anonymize_data', 'false', 'boolean', 'Anonymize analytics data for privacy', false)
ON CONFLICT (category, key) DO NOTHING;

-- Email Configuration
INSERT INTO system_settings (category, key, value, value_type, description, is_public, is_sensitive) VALUES
('email', 'smtp_host', 'smtp.sendgrid.net', 'string', 'SMTP server host', false, false),
('email', 'smtp_port', '587', 'number', 'SMTP server port', false, false),
('email', 'smtp_secure', 'true', 'boolean', 'Use TLS/SSL for SMTP', false, false),
('email', 'smtp_user', '', 'string', 'SMTP username', false, true),
('email', 'smtp_password', '', 'string', 'SMTP password', false, true),
('email', 'from_address', 'noreply@objecta-labs.com', 'string', 'Default from email address', false, false),
('email', 'from_name', 'ObjectaLabs', 'string', 'Default from name', false, false),
('email', 'reply_to', 'support@objecta-labs.com', 'string', 'Reply-to email address', false, false)
ON CONFLICT (category, key) DO NOTHING;

-- Notification Settings
INSERT INTO system_settings (category, key, value, value_type, description, is_public) VALUES
('notifications', 'email_enabled', 'true', 'boolean', 'Email notifications enabled', false),
('notifications', 'push_enabled', 'true', 'boolean', 'Push notifications enabled', false),
('notifications', 'sms_enabled', 'false', 'boolean', 'SMS notifications enabled', false),
('notifications', 'digest_enabled', 'true', 'boolean', 'Daily digest emails enabled', false),
('notifications', 'digest_time', '09:00', 'string', 'Daily digest send time (HH:MM)', false)
ON CONFLICT (category, key) DO NOTHING;

-- ============================================
-- Default Feature Flags
-- ============================================

INSERT INTO feature_flags (name, key, description, enabled, rollout_strategy, metadata) VALUES
('Workflow Automation', 'workflow_automation', 'Enable workflow automation features', true, 'all', '{"category": "core"}'),
('Fine Tuning', 'fine_tuning', 'Enable LLM fine-tuning features', true, 'all', '{"category": "core"}'),
('Knowledge Base', 'knowledge_base', 'Enable knowledge base and RAG features', true, 'all', '{"category": "core"}'),
('Advanced Analytics', 'advanced_analytics', 'Enable advanced analytics dashboard', false, 'plan', '{"category": "premium", "plans": ["professional", "enterprise"]}'),
('White Label', 'white_label', 'Enable white-label customization', false, 'plan', '{"category": "premium", "plans": ["enterprise"]}'),
('SSO Integration', 'sso', 'Enable Single Sign-On integration', false, 'plan', '{"category": "premium", "plans": ["enterprise"]}'),
('API Access', 'api_access', 'Enable API access for programmatic control', true, 'all', '{"category": "core"}'),
('Custom Domains', 'custom_domains', 'Enable custom domain support', false, 'plan', '{"category": "premium", "plans": ["professional", "enterprise"]}'),
('Priority Support', 'priority_support', 'Enable priority support features', false, 'plan', '{"category": "premium", "plans": ["professional", "enterprise"]}'),
('Beta Features', 'beta_features', 'Enable beta features for testing', false, 'whitelist', '{"category": "experimental"}'),
('Team Collaboration', 'team_collaboration', 'Enable team collaboration features', true, 'all', '{"category": "core"}'),
('Webhooks', 'webhooks', 'Enable webhook integrations', true, 'all', '{"category": "core"}'),
('Data Export', 'data_export', 'Enable bulk data export functionality', true, 'all', '{"category": "core"}'),
('Advanced Security', 'advanced_security', 'Enable advanced security features (IP whitelisting, audit logs)', false, 'plan', '{"category": "premium", "plans": ["enterprise"]}')
ON CONFLICT (key) DO NOTHING;

-- Update target_plans for plan-based features
UPDATE feature_flags 
SET target_plans = ARRAY['professional', 'enterprise']
WHERE rollout_strategy = 'plan' AND key IN ('advanced_analytics', 'custom_domains', 'priority_support');

UPDATE feature_flags 
SET target_plans = ARRAY['enterprise']
WHERE rollout_strategy = 'plan' AND key IN ('white_label', 'sso', 'advanced_security');

-- ============================================
-- Completion Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuration tables created successfully!';
  RAISE NOTICE '✅ Default settings seeded!';
  RAISE NOTICE '✅ Default feature flags created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the backend entities and services';
  RAISE NOTICE '2. Start the backend server';
  RAISE NOTICE '3. Test the settings API endpoints';
END $$;
