-- Phase 3: Advanced Configuration Tables

-- Add new columns to agent_tools table
ALTER TABLE agent_tools 
ADD COLUMN IF NOT EXISTS retry_config JSONB,
ADD COLUMN IF NOT EXISTS response_transform JSONB,
ADD COLUMN IF NOT EXISTS current_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create tool_environments table
CREATE TABLE IF NOT EXISTS tool_environments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id UUID NOT NULL REFERENCES agent_tools(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tool_versions table
CREATE TABLE IF NOT EXISTS tool_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id UUID NOT NULL REFERENCES agent_tools(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by UUID,
  changelog TEXT,
  changed_fields TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tool_environments
CREATE INDEX IF NOT EXISTS idx_tool_environments_tool_id ON tool_environments(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_environments_org_id ON tool_environments(organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_environments_active ON tool_environments(is_active);
CREATE INDEX IF NOT EXISTS idx_tool_environments_tool_org ON tool_environments(tool_id, organization_id);

-- Create indexes for tool_versions
CREATE INDEX IF NOT EXISTS idx_tool_versions_tool_id ON tool_versions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_versions_org_id ON tool_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_versions_version ON tool_versions(version DESC);
CREATE INDEX IF NOT EXISTS idx_tool_versions_tool_version ON tool_versions(tool_id, version);

-- Comments
COMMENT ON TABLE tool_environments IS 'Environment-specific configurations for tools (dev, staging, prod)';
COMMENT ON TABLE tool_versions IS 'Version history for tools with snapshots';
COMMENT ON COLUMN agent_tools.retry_config IS 'Configuration for automatic retry logic';
COMMENT ON COLUMN agent_tools.response_transform IS 'JSONPath or JavaScript transformation for responses';
COMMENT ON COLUMN agent_tools.current_environment IS 'Currently active environment name';
COMMENT ON COLUMN agent_tools.version IS 'Current version number of the tool';
