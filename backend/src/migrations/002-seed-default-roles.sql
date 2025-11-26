-- Seed Default Roles

-- Insert Owner role
INSERT INTO roles (name, display_name, description, permissions, is_default, is_system, level)
VALUES (
    'owner',
    'Owner',
    'Full control over the organization including billing and user management',
    '["organizations:manage","organizations:read","organizations:update","organizations:delete","workspaces:manage","workspaces:create","workspaces:read","workspaces:update","workspaces:delete","users:manage","users:create","users:read","users:update","users:delete","settings:manage","settings:read","settings:update","api-keys:manage","api-keys:create","api-keys:read","api-keys:delete","agents:create","agents:read","agents:update","agents:delete","agents:deploy","conversations:create","conversations:read","conversations:update","conversations:delete","knowledge-base:create","knowledge-base:read","knowledge-base:update","knowledge-base:delete","documents:create","documents:read","documents:update","documents:delete","workflows:create","workflows:read","workflows:update","workflows:delete","workflows:execute","tools:create","tools:read","tools:update","tools:delete","tools:execute","fine-tuning:create","fine-tuning:read","fine-tuning:update","fine-tuning:delete","datasets:create","datasets:read","datasets:update","datasets:delete","jobs:create","jobs:read","jobs:update","jobs:delete"]'::jsonb,
    false,
    true,
    4
) ON CONFLICT (name) DO NOTHING;

-- Insert Admin role
INSERT INTO roles (name, display_name, description, permissions, is_default, is_system, level)
VALUES (
    'admin',
    'Administrator',
    'Can manage workspaces, users, and all resources',
    '["workspaces:read","workspaces:update","users:read","users:update","settings:read","settings:update","api-keys:create","api-keys:read","api-keys:delete","agents:create","agents:read","agents:update","agents:delete","agents:deploy","conversations:create","conversations:read","conversations:update","conversations:delete","knowledge-base:create","knowledge-base:read","knowledge-base:update","knowledge-base:delete","documents:create","documents:read","documents:update","documents:delete","workflows:create","workflows:read","workflows:update","workflows:delete","workflows:execute","tools:create","tools:read","tools:update","tools:delete","tools:execute","fine-tuning:create","fine-tuning:read","fine-tuning:update","fine-tuning:delete","datasets:create","datasets:read","datasets:update","datasets:delete","jobs:create","jobs:read","jobs:update","jobs:delete"]'::jsonb,
    false,
    true,
    3
) ON CONFLICT (name) DO NOTHING;

-- Insert Editor role
INSERT INTO roles (name, display_name, description, permissions, is_default, is_system, level)
VALUES (
    'editor',
    'Editor',
    'Can create and edit resources, execute workflows and tools',
    '["agents:create","agents:read","agents:update","conversations:create","conversations:read","conversations:update","knowledge-base:create","knowledge-base:read","knowledge-base:update","documents:create","documents:read","documents:update","workflows:create","workflows:read","workflows:update","workflows:execute","tools:create","tools:read","tools:update","tools:execute","fine-tuning:create","fine-tuning:read","fine-tuning:update","datasets:create","datasets:read","datasets:update","jobs:create","jobs:read","jobs:update"]'::jsonb,
    true,
    true,
    2
) ON CONFLICT (name) DO NOTHING;

-- Insert Viewer role
INSERT INTO roles (name, display_name, description, permissions, is_default, is_system, level)
VALUES (
    'viewer',
    'Viewer',
    'Read-only access to all resources',
    '["agents:read","conversations:read","knowledge-base:read","documents:read","workflows:read","tools:read","fine-tuning:read","datasets:read","jobs:read"]'::jsonb,
    false,
    true,
    1
) ON CONFLICT (name) DO NOTHING;

-- Assign owner role to first user in each organization
-- This should be run after initial setup or handled in application code
-- Example:
-- INSERT INTO user_role_assignments (user_id, role_id, organization_id, workspace_id)
-- SELECT u.id, r.id, u.organization_id, NULL
-- FROM users u
-- CROSS JOIN roles r
-- WHERE r.name = 'owner'
-- AND NOT EXISTS (
--     SELECT 1 FROM user_role_assignments ura 
--     WHERE ura.organization_id = u.organization_id 
--     AND ura.role_id = r.id
-- );
