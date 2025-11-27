-- Phase 2 Week 5: Admin Platform Tables
-- Migration: 010-create-admin-tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  admin_role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_organization_id ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

-- Admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);

-- Create a default super admin (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)
VALUES (
  'admin@objecta-labs.local',
  '$2b$10$rKvVJvHzPzFpEGWVU9p3JuO4LqJhEY3KhYhZyW/yYXe.YXXwYxYxY',
  'Super Admin',
  'super_admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Comments
COMMENT ON TABLE admin_users IS 'Admin users for internal platform management';
COMMENT ON TABLE support_tickets IS 'Customer support tickets';
COMMENT ON TABLE admin_audit_logs IS 'Audit log of all admin actions';

-- Create view for ticket summary
CREATE OR REPLACE VIEW ticket_summary AS
SELECT 
  t.id,
  t.subject,
  t.status,
  t.priority,
  t.created_at,
  o.name as organization_name,
  u.email as user_email,
  a.full_name as assigned_admin_name
FROM support_tickets t
LEFT JOIN organizations o ON t.organization_id = o.id
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN admin_users a ON t.assigned_to = a.id;

COMMENT ON VIEW ticket_summary IS 'Denormalized view of support tickets with related data';
