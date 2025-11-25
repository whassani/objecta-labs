-- Workflow Automation Engine - Database Schema
-- Phase 1: Foundation

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}', -- Node graph definition
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, archived
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- schedule, webhook, manual, event
  trigger_config JSONB DEFAULT '{}', -- Trigger-specific configuration
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_executed_at TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event', 'database', 'email', 'form'))
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, cancelled, pending
  trigger_data JSONB DEFAULT '{}', -- Input data from trigger
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_ms INTEGER,
  error TEXT,
  context JSONB DEFAULT '{}', -- Execution context and variables
  CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Workflow execution steps table
CREATE TABLE workflow_execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL, -- Node ID from workflow definition
  node_type VARCHAR(100) NOT NULL, -- trigger, action, condition, etc.
  node_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, skipped
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  CONSTRAINT valid_step_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped'))
);

-- Workflow templates table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  definition JSONB NOT NULL,
  icon VARCHAR(255),
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow secrets table (encrypted)
CREATE TABLE workflow_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL, -- Encrypted using AES-256
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  UNIQUE(organization_id, name)
);

-- Workflow webhooks table
CREATE TABLE workflow_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  webhook_url VARCHAR(255) UNIQUE NOT NULL,
  secret_token VARCHAR(255), -- For webhook verification
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_workspace ON workflows(workspace_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);

CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_executions_start_time ON workflow_executions(start_time DESC);

CREATE INDEX idx_execution_steps_execution ON workflow_execution_steps(execution_id);
CREATE INDEX idx_execution_steps_status ON workflow_execution_steps(status);
CREATE INDEX idx_execution_steps_node ON workflow_execution_steps(node_id);

CREATE INDEX idx_templates_category ON workflow_templates(category);
CREATE INDEX idx_templates_public ON workflow_templates(is_public);

CREATE INDEX idx_secrets_org ON workflow_secrets(organization_id);
CREATE INDEX idx_webhooks_workflow ON workflow_webhooks(workflow_id);
CREATE INDEX idx_webhooks_url ON workflow_webhooks(webhook_url);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE workflows IS 'Stores workflow definitions and metadata';
COMMENT ON TABLE workflow_executions IS 'Tracks workflow execution instances';
COMMENT ON TABLE workflow_execution_steps IS 'Tracks individual step executions within a workflow';
COMMENT ON TABLE workflow_templates IS 'Pre-built workflow templates';
COMMENT ON TABLE workflow_secrets IS 'Encrypted secrets for workflow integrations';
COMMENT ON TABLE workflow_webhooks IS 'Webhook endpoints for workflow triggers';
