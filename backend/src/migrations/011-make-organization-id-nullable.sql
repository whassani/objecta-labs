-- Migration: Make organization_id nullable in users table
-- This allows platform team members to exist without an organization

-- Make organization_id nullable
ALTER TABLE users 
ALTER COLUMN organization_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN users.organization_id IS 'Organization ID - NULL for platform team members, required for customer users';

-- Create index for better query performance when filtering by null organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization_id_null 
ON users (organization_id) 
WHERE organization_id IS NULL;

-- Create index for non-null organization_ids
CREATE INDEX IF NOT EXISTS idx_users_organization_id_not_null 
ON users (organization_id) 
WHERE organization_id IS NOT NULL;
