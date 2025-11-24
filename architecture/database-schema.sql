-- AgentForge Database Schema
-- PostgreSQL 15+ with Multi-Tenant Support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MULTI-TENANT ARCHITECTURE
-- ============================================================================
-- Organizations table (Tenants)
-- Each organization is an isolated tenant with their own data
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL, -- For subdomain: {slug}.agentforge.com
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, starter, professional, business, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, canceled
    settings JSONB DEFAULT '{}', -- Tenant-specific settings
    limits JSONB DEFAULT '{
        "maxAgents": 1,
        "maxMessages": 1000,
        "maxUsers": 1,
        "maxStorage": 104857600
    }', -- Resource limits based on plan
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_status ON organizations(status);

-- Users table (belongs to an organization/tenant)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, email) -- Email unique per tenant
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Agents table (multi-tenant with organization_id)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    welcome_message TEXT,
    personality VARCHAR(50) DEFAULT 'professional',
    model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 512,
    is_active BOOLEAN DEFAULT TRUE,
    widget_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CRITICAL: Index on organization_id for tenant isolation
CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- Documents table (knowledge base with tenant isolation)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    error_message TEXT,
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_agent_id ON documents(agent_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Document chunks (for vector search)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    vector_id VARCHAR(255), -- ID in vector database (Pinecone)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_vector_id ON document_chunks(vector_id);

-- Conversations table (multi-tenant)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    user_identifier VARCHAR(255), -- Email, user ID, or anonymous ID
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}', -- User agent, location, etc.
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);

-- Messages table (multi-tenant for complete isolation)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model_used VARCHAR(50),
    response_time_ms INTEGER,
    sources JSONB, -- Referenced documents/chunks
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Subscriptions table (one per organization/tenant)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan VARCHAR(50) NOT NULL, -- 'free', 'starter', 'professional', 'business', 'enterprise'
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id) -- One subscription per organization
);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Usage tracking table (per organization/tenant)
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    messages_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    conversations_count INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, agent_id, period_start)
);

CREATE INDEX idx_usage_organization_id ON usage_tracking(organization_id);
CREATE INDEX idx_usage_period_start ON usage_tracking(period_start);

-- API keys table (for future API access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'usage_warning', 'payment_failed', 'agent_error', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    type VARCHAR(50), -- 'helpful', 'not_helpful', 'bug', 'suggestion'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_message_id ON feedback(message_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for analytics

-- Daily usage summary
CREATE VIEW daily_usage_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT conversation_id) as conversations,
    COUNT(*) as messages,
    SUM(tokens_used) as total_tokens,
    AVG(response_time_ms) as avg_response_time
FROM messages
WHERE role = 'assistant'
GROUP BY DATE(created_at);

-- Agent performance
CREATE VIEW agent_performance AS
SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.user_id,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    AVG(m.response_time_ms) as avg_response_time,
    SUM(m.tokens_used) as total_tokens
FROM agents a
LEFT JOIN conversations c ON a.id = c.agent_id
LEFT JOIN messages m ON c.id = m.conversation_id AND m.role = 'assistant'
GROUP BY a.id, a.name, a.user_id;

-- User activity
CREATE VIEW user_activity AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    s.plan,
    COUNT(DISTINCT a.id) as agent_count,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_activity
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN agents a ON u.id = a.user_id
LEFT JOIN conversations c ON a.id = c.agent_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id, u.email, u.full_name, s.plan;

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) - Enable for tenant isolation
-- ============================================================================
-- Enable RLS on all tenant tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies to enforce tenant isolation
-- These policies ensure queries automatically filter by organization_id
CREATE POLICY tenant_isolation_policy ON agents
    USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON documents
    USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON conversations
    USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON messages
    USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON usage_tracking
    USING (organization_id = current_setting('app.current_tenant')::uuid);

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT (optional)
-- ============================================================================
/*
-- Insert sample organization (tenant)
INSERT INTO organizations (slug, name, plan, limits) 
VALUES (
    'demo-corp',
    'Demo Corporation',
    'professional',
    '{
        "maxAgents": 10,
        "maxMessages": 50000,
        "maxUsers": 5,
        "maxStorage": 10737418240
    }'
);

-- Insert sample user (owner)
INSERT INTO users (organization_id, email, password_hash, full_name, role, email_verified) 
VALUES (
    (SELECT id FROM organizations WHERE slug = 'demo-corp'),
    'demo@democorp.com',
    '$2b$12$sample_hash',
    'Demo User',
    'owner',
    TRUE
);

-- Insert sample subscription
INSERT INTO subscriptions (organization_id, plan, status)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'demo-corp'),
    'professional',
    'active'
);
*/
