-- Link subscriptions to subscription_plans table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscription_plan 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Update existing subscriptions to link to plans based on tier
UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'free' LIMIT 1)
WHERE plan = 'free' AND plan_id IS NULL;

UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'pro' LIMIT 1)
WHERE plan = 'starter' AND plan_id IS NULL;

UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'pro' LIMIT 1)
WHERE plan = 'professional' AND plan_id IS NULL;

UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'pro_max' LIMIT 1)
WHERE plan = 'enterprise' AND plan_id IS NULL;

-- Set default plan_id for any remaining subscriptions without one
UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'free' LIMIT 1)
WHERE plan_id IS NULL;

-- Add billing cycle column
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
-- Values: 'monthly', 'yearly'

-- Add usage tracking columns
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_tokens_current_period INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create subscription usage history table
CREATE TABLE IF NOT EXISTS subscription_usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  workflow_executions INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_history_subscription ON subscription_usage_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_period ON subscription_usage_history(period_start, period_end);

-- Create organization limits cache table for performance
CREATE TABLE IF NOT EXISTS organization_limits_cache (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  limits JSONB NOT NULL,
  features JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add subscription notes for admin
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add discount tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP;

COMMENT ON COLUMN subscriptions.plan_id IS 'References the subscription_plans table';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'monthly or yearly billing cycle';
COMMENT ON COLUMN subscriptions.usage_tokens_current_period IS 'Token usage in current billing period';
COMMENT ON COLUMN subscriptions.discount_percentage IS 'Discount percentage applied (0-100)';
