-- Phase 2 Week 3: Analytics & Insights Tables
-- Migration: 008-create-analytics-tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_created ON analytics_events(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_resource ON analytics_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);

-- Daily metrics table (aggregated data)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10,2) DEFAULT 0,
  agent_count INTEGER DEFAULT 0,
  workflow_executions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Indexes for daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_organization_id ON daily_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);

-- Agent metrics table
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  conversation_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10,2) DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  satisfaction_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

-- Indexes for agent_metrics
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(date);

-- Function to aggregate daily metrics (to be called by cron)
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE)
RETURNS void AS $$
BEGIN
  -- This is a placeholder for the aggregation logic
  -- In production, you would aggregate from raw events
  -- For now, we'll just ensure the structure exists
  
  RAISE NOTICE 'Aggregation function ready for date: %', target_date;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE analytics_events IS 'Raw analytics events for tracking';
COMMENT ON TABLE daily_metrics IS 'Aggregated daily metrics per organization';
COMMENT ON TABLE agent_metrics IS 'Agent-specific performance metrics';
COMMENT ON FUNCTION aggregate_daily_metrics IS 'Aggregate raw events into daily metrics';
