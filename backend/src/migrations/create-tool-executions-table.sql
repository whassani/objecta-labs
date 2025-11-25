-- Create tool_executions table for test history
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id UUID NOT NULL REFERENCES agent_tools(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  user_id UUID,
  input JSONB,
  output JSONB,
  request JSONB,
  response JSONB,
  success BOOLEAN DEFAULT true,
  error TEXT,
  execution_time INTEGER NOT NULL,
  retry_count INTEGER DEFAULT 0,
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_id ON tool_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_organization_id ON tool_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_is_test ON tool_executions(is_test);
CREATE INDEX IF NOT EXISTS idx_tool_executions_created_at ON tool_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_org ON tool_executions(tool_id, organization_id);
