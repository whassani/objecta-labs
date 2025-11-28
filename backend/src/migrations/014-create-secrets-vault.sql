-- ============================================
-- Encrypted Secrets Vault
-- Migration: 014-create-secrets-vault.sql
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Secrets Vault Table
-- ============================================

CREATE TABLE IF NOT EXISTS secrets_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(200) NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  auth_tag VARCHAR(32) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  environment VARCHAR(20) DEFAULT 'production',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_platform_secret BOOLEAN DEFAULT false,
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES platform_users(id),
  updated_by UUID REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_platform_secret UNIQUE(key, organization_id, is_platform_secret)
);

-- ============================================
-- Secrets Access Audit Log
-- ============================================

CREATE TABLE IF NOT EXISTS secrets_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_key VARCHAR(200) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('read', 'write', 'update', 'delete', 'rotate')),
  accessed_by UUID REFERENCES platform_users(id),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Secrets Rotation History
-- ============================================

CREATE TABLE IF NOT EXISTS secrets_rotation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_key VARCHAR(200) NOT NULL,
  rotated_by UUID REFERENCES platform_users(id),
  old_value_hash VARCHAR(64),
  new_value_hash VARCHAR(64),
  rotation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_secrets_vault_key ON secrets_vault(key);
CREATE INDEX idx_secrets_vault_category ON secrets_vault(category);
CREATE INDEX idx_secrets_vault_environment ON secrets_vault(environment);
CREATE INDEX idx_secrets_vault_org_id ON secrets_vault(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_secrets_vault_platform ON secrets_vault(is_platform_secret) WHERE is_platform_secret = true;
CREATE INDEX idx_secrets_vault_expires ON secrets_vault(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_secrets_access_key ON secrets_access_log(secret_key);
CREATE INDEX idx_secrets_access_user ON secrets_access_log(accessed_by);
CREATE INDEX idx_secrets_access_created ON secrets_access_log(created_at DESC);
CREATE INDEX idx_secrets_access_action ON secrets_access_log(action);

CREATE INDEX idx_secrets_rotation_key ON secrets_rotation_history(secret_key);
CREATE INDEX idx_secrets_rotation_created ON secrets_rotation_history(created_at DESC);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE secrets_vault IS 'Encrypted storage for sensitive credentials and API keys (platform and per-organization)';
COMMENT ON TABLE secrets_access_log IS 'Audit log for all secret access operations';
COMMENT ON TABLE secrets_rotation_history IS 'History of secret rotation events';

COMMENT ON COLUMN secrets_vault.encrypted_value IS 'AES-256-GCM encrypted secret value';
COMMENT ON COLUMN secrets_vault.iv IS 'Initialization vector for encryption';
COMMENT ON COLUMN secrets_vault.auth_tag IS 'Authentication tag for GCM mode';
COMMENT ON COLUMN secrets_vault.category IS 'Category: stripe, smtp, llm, database, oauth, etc.';
COMMENT ON COLUMN secrets_vault.environment IS 'Environment: production, staging, development';
COMMENT ON COLUMN secrets_vault.organization_id IS 'NULL for platform secrets, set for organization-specific secrets';
COMMENT ON COLUMN secrets_vault.is_platform_secret IS 'TRUE for platform secrets, FALSE for organization secrets';

-- ============================================
-- Seed Default Secret Categories
-- ============================================

-- Note: These are just placeholders to show the structure
-- Real secrets should be added via the UI or API with proper encryption

-- Insert default category structure for platform secrets (encrypted values are dummy)
INSERT INTO secrets_vault (key, encrypted_value, iv, auth_tag, description, category, is_platform_secret, organization_id) VALUES
('stripe.secret_key.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform Stripe Secret Key (Replace via UI)', 'stripe', true, NULL),
('stripe.publishable_key.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform Stripe Publishable Key (Replace via UI)', 'stripe', true, NULL),
('stripe.webhook_secret.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform Stripe Webhook Secret (Replace via UI)', 'stripe', true, NULL),
('smtp.password.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform SMTP Password (Replace via UI)', 'smtp', true, NULL),
('openai.api_key.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform OpenAI API Key (Replace via UI)', 'llm', true, NULL),
('anthropic.api_key.placeholder', 'encrypted', '00000000000000000000000000000000', '00000000000000000000000000000000', 'Platform Anthropic API Key (Replace via UI)', 'llm', true, NULL)
ON CONFLICT ON CONSTRAINT unique_platform_secret DO NOTHING;

-- ============================================
-- Functions
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_secrets_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_secrets_vault_updated_at ON secrets_vault;
CREATE TRIGGER trigger_secrets_vault_updated_at
  BEFORE UPDATE ON secrets_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_secrets_vault_updated_at();

-- ============================================
-- Security Notes
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Secrets Vault tables created successfully!';
  RAISE NOTICE '🔐 IMPORTANT SECURITY NOTES:';
  RAISE NOTICE '   1. Set SECRETS_MASTER_KEY environment variable (32 bytes hex)';
  RAISE NOTICE '   2. Generate: node -e "console.log(require(''crypto'').randomBytes(32).toString(''hex''))"';
  RAISE NOTICE '   3. NEVER commit the master key to version control';
  RAISE NOTICE '   4. Use different keys for dev/staging/production';
  RAISE NOTICE '   5. Rotate master key periodically (requires re-encryption)';
  RAISE NOTICE '   6. Backup encrypted secrets before rotation';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Set SECRETS_MASTER_KEY in .env';
  RAISE NOTICE '   2. Restart backend server';
  RAISE NOTICE '   3. Access UI at /admin/secrets (for platform secrets)';
  RAISE NOTICE '   4. Users can add their own secrets at /dashboard/settings';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Two Types of Secrets:';
  RAISE NOTICE '   1. Platform Secrets (organization_id = NULL, is_platform_secret = true)';
  RAISE NOTICE '      - Used by the platform itself';
  RAISE NOTICE '      - Only admins can manage';
  RAISE NOTICE '   2. Organization Secrets (organization_id set, is_platform_secret = false)';
  RAISE NOTICE '      - Each customer has their own';
  RAISE NOTICE '      - Users can manage their own keys';
END $$;
