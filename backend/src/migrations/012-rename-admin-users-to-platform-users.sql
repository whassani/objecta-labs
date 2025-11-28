-- Migration: Rename admin_users to platform_users
-- This better reflects the purpose: internal platform team members

-- Rename the table
ALTER TABLE admin_users RENAME TO platform_users;

-- Rename the sequence
ALTER SEQUENCE IF EXISTS admin_users_id_seq RENAME TO platform_users_id_seq;

-- Add comment for clarity
COMMENT ON TABLE platform_users IS 'Internal platform team members (not customer users)';
COMMENT ON COLUMN platform_users.admin_role IS 'Platform role: super_admin, admin, support';

-- Update any foreign key constraints if they exist
-- (none currently, but good to document)

-- The table structure remains the same:
-- - id, email, password_hash, full_name
-- - admin_role, is_active, last_login_at
-- - created_at, updated_at
