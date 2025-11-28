-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  tier VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) DEFAULT 0,
  price_yearly DECIMAL(10, 2) DEFAULT 0,
  limits JSONB NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tier for faster lookups
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);

-- Insert default plans
INSERT INTO subscription_plans (name, tier, description, price_monthly, price_yearly, limits, features, is_active, is_popular, sort_order)
VALUES 
  -- Free Plan
  (
    'Free',
    'free',
    'Perfect for getting started with AI agents',
    0,
    0,
    '{
      "maxAgents": 2,
      "maxConversations": 50,
      "maxWorkflows": 2,
      "maxTools": 5,
      "maxDataSources": 1,
      "maxDocuments": 10,
      "maxTeamMembers": 1,
      "monthlyTokenLimit": 100000,
      "dailyTokenLimit": 5000,
      "maxTokensPerRequest": 2000,
      "maxDocumentSizeMB": 5,
      "maxKnowledgeBaseSizeMB": 50,
      "maxWorkflowExecutionsPerDay": 10,
      "maxApiCallsPerDay": 100,
      "maxFineTuningJobs": 0,
      "maxFineTuningDatasets": 0,
      "maxTrainingExamplesPerDataset": 0
    }'::jsonb,
    '{
      "basicAgents": true,
      "advancedAgents": false,
      "customModels": false,
      "fineTuning": false,
      "workflows": true,
      "advancedWorkflows": false,
      "knowledgeBase": true,
      "semanticSearch": true,
      "hybridSearch": false,
      "teamCollaboration": false,
      "roleBasedAccess": false,
      "auditLogs": false,
      "apiAccess": true,
      "webhooks": false,
      "customIntegrations": false,
      "basicAnalytics": true,
      "advancedAnalytics": false,
      "customReports": false,
      "realTimeMonitoring": false,
      "emailSupport": true,
      "prioritySupport": false,
      "dedicatedSupport": false,
      "slaDays": 7,
      "sso": false,
      "customDomain": false,
      "dataRetentionDays": 30,
      "backupFrequencyHours": 168
    }'::jsonb,
    true,
    false,
    1
  ),
  -- Pro Plan
  (
    'Pro',
    'pro',
    'For professionals and growing teams',
    49,
    490,
    '{
      "maxAgents": 20,
      "maxConversations": -1,
      "maxWorkflows": 50,
      "maxTools": 100,
      "maxDataSources": 10,
      "maxDocuments": 1000,
      "maxTeamMembers": 10,
      "monthlyTokenLimit": 5000000,
      "dailyTokenLimit": 200000,
      "maxTokensPerRequest": 8000,
      "maxDocumentSizeMB": 50,
      "maxKnowledgeBaseSizeMB": 1000,
      "maxWorkflowExecutionsPerDay": 500,
      "maxApiCallsPerDay": 10000,
      "maxFineTuningJobs": 5,
      "maxFineTuningDatasets": 10,
      "maxTrainingExamplesPerDataset": 10000
    }'::jsonb,
    '{
      "basicAgents": true,
      "advancedAgents": true,
      "customModels": true,
      "fineTuning": true,
      "workflows": true,
      "advancedWorkflows": true,
      "knowledgeBase": true,
      "semanticSearch": true,
      "hybridSearch": true,
      "teamCollaboration": true,
      "roleBasedAccess": true,
      "auditLogs": true,
      "apiAccess": true,
      "webhooks": true,
      "customIntegrations": true,
      "basicAnalytics": true,
      "advancedAnalytics": true,
      "customReports": false,
      "realTimeMonitoring": true,
      "emailSupport": true,
      "prioritySupport": true,
      "dedicatedSupport": false,
      "slaDays": 2,
      "sso": false,
      "customDomain": false,
      "dataRetentionDays": 90,
      "backupFrequencyHours": 24
    }'::jsonb,
    true,
    true,
    2
  ),
  -- Pro Max Plan
  (
    'Pro Max',
    'pro_max',
    'For enterprises with advanced needs',
    199,
    1990,
    '{
      "maxAgents": -1,
      "maxConversations": -1,
      "maxWorkflows": -1,
      "maxTools": -1,
      "maxDataSources": -1,
      "maxDocuments": -1,
      "maxTeamMembers": -1,
      "monthlyTokenLimit": -1,
      "dailyTokenLimit": -1,
      "maxTokensPerRequest": 32000,
      "maxDocumentSizeMB": 500,
      "maxKnowledgeBaseSizeMB": -1,
      "maxWorkflowExecutionsPerDay": -1,
      "maxApiCallsPerDay": -1,
      "maxFineTuningJobs": -1,
      "maxFineTuningDatasets": -1,
      "maxTrainingExamplesPerDataset": -1
    }'::jsonb,
    '{
      "basicAgents": true,
      "advancedAgents": true,
      "customModels": true,
      "fineTuning": true,
      "workflows": true,
      "advancedWorkflows": true,
      "knowledgeBase": true,
      "semanticSearch": true,
      "hybridSearch": true,
      "teamCollaboration": true,
      "roleBasedAccess": true,
      "auditLogs": true,
      "apiAccess": true,
      "webhooks": true,
      "customIntegrations": true,
      "basicAnalytics": true,
      "advancedAnalytics": true,
      "customReports": true,
      "realTimeMonitoring": true,
      "emailSupport": true,
      "prioritySupport": true,
      "dedicatedSupport": true,
      "slaDays": 1,
      "sso": true,
      "customDomain": true,
      "dataRetentionDays": 365,
      "backupFrequencyHours": 1
    }'::jsonb,
    true,
    false,
    3
  );

-- Update subscriptions table to reference subscription_plans
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- Migrate existing plans to use plan references
UPDATE subscriptions 
SET plan_id = (SELECT id FROM subscription_plans WHERE tier = 'free') 
WHERE plan = 'free';
