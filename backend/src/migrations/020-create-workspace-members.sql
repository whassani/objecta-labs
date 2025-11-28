-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

-- Create workspace_invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workspace_activity table for analytics
CREATE TABLE IF NOT EXISTS workspace_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL, -- agent_created, workflow_executed, document_uploaded, etc.
  entity_type VARCHAR(50), -- agent, workflow, document, etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_workspace ON workspace_activity(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_created ON workspace_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_type ON workspace_activity(activity_type);

-- Add trigger to automatically add creator as owner
CREATE OR REPLACE FUNCTION add_workspace_creator_as_owner()
RETURNS TRIGGER AS $$
DECLARE
  creator_user_id UUID;
BEGIN
  -- Get the user_id from the organization's owner or first user
  SELECT u.id INTO creator_user_id
  FROM users u
  WHERE u.organization_id = NEW.organization_id
  LIMIT 1;
  
  IF creator_user_id IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, creator_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_workspace_creator
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE FUNCTION add_workspace_creator_as_owner();
