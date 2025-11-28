-- Migration: Add security fields to users table
-- Uses first_name and last_name (no full_name column)

-- Ensure first_name and last_name exist and are NOT NULL
DO $$ 
BEGIN
  -- first_name should already exist, but ensure it's NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name' AND is_nullable = 'YES'
  ) THEN
    -- Set empty values to a default
    UPDATE users SET first_name = 'User' WHERE first_name IS NULL OR first_name = '';
    ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
  END IF;

  -- last_name should already exist, ensure it's NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name' AND is_nullable = 'YES'
  ) THEN
    -- Set empty values to empty string (last name can be empty)
    UPDATE users SET last_name = '' WHERE last_name IS NULL;
    ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
  END IF;
END $$;

-- Add email verification fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
  END IF;
END $$;

-- Add password reset fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'reset_token'
  ) THEN
    ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'reset_token_expires'
  ) THEN
    ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
  END IF;
END $$;

-- Add activity tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
  END IF;
END $$;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Add helpful comments
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration time for password reset token';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last successful login';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 015 completed: Added security fields to users table';
END $$;
