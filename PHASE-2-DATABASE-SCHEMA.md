# Phase 2: Database Schema

## Overview

Complete database schema for Phase 2 features including billing, team collaboration, analytics, notifications, and admin platform.

---

## New Tables

### 1. Billing Tables

#### Subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### Invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  invoice_pdf TEXT,
  due_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

#### Payment Methods
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE,
  type VARCHAR(50) NOT NULL,
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_organization_id ON payment_methods(organization_id);
```

#### Usage Records
```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  metric_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_records_organization_id ON usage_records(organization_id);
CREATE INDEX idx_usage_records_period ON usage_records(period_start, period_end);
CREATE INDEX idx_usage_records_metric_type ON usage_records(metric_type);
```

### 2. Team Collaboration Tables

#### Team Invitations
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_organization_id ON team_invitations(organization_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
```

#### Activity Logs
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  resource_name VARCHAR(255),
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
```

### 3. Analytics Tables

#### Analytics Events
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_org_created ON analytics_events(organization_id, created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_resource ON analytics_events(resource_type, resource_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
```

#### Daily Metrics (Aggregated)
```sql
CREATE TABLE daily_metrics (
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

CREATE INDEX idx_daily_metrics_organization_id ON daily_metrics(organization_id);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
```

#### Agent Metrics
```sql
CREATE TABLE agent_metrics (
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

CREATE INDEX idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX idx_agent_metrics_date ON agent_metrics(date);
```

### 4. Notifications Tables

#### Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### Notification Preferences
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_frequency VARCHAR(50) DEFAULT 'immediate',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
```

### 5. Admin Platform Tables

#### Admin Users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  admin_role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
```

#### Support Tickets
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_support_tickets_organization_id ON support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
```

#### Support Ticket Comments
```sql
CREATE TABLE support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type VARCHAR(50) NOT NULL,
  author_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket_id ON support_ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON support_ticket_comments(created_at);
```

#### Admin Audit Logs
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action_type ON admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
```

---

## Modified Existing Tables

### Users Table - Add Columns
```sql
ALTER TABLE users
ADD COLUMN last_active_at TIMESTAMP,
ADD COLUMN avatar_url TEXT,
ADD COLUMN job_title VARCHAR(255),
ADD COLUMN preferences JSONB DEFAULT '{}';

CREATE INDEX idx_users_last_active_at ON users(last_active_at);
```

### Organizations Table - Add Columns
```sql
ALTER TABLE organizations
ADD COLUMN max_users INTEGER DEFAULT 1,
ADD COLUMN max_agents INTEGER DEFAULT 1,
ADD COLUMN max_messages INTEGER DEFAULT 1000,
ADD COLUMN max_storage BIGINT DEFAULT 104857600;
```

---

## Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_messages_org_created ON messages(organization_id, created_at DESC);
CREATE INDEX idx_conversations_org_status ON conversations(organization_id, status);
CREATE INDEX idx_agents_org_active ON agents(organization_id, is_active);

-- Partial indexes for active records
CREATE INDEX idx_subscriptions_active ON subscriptions(organization_id) 
  WHERE status = 'active';
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = FALSE;
```

---

## Views for Common Queries

### Organization Summary View
```sql
CREATE VIEW organization_summary AS
SELECT 
  o.id,
  o.name,
  o.subdomain,
  o.plan,
  o.plan_status,
  s.status as subscription_status,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT a.id) as agent_count,
  COUNT(DISTINCT c.id) as conversation_count
FROM organizations o
LEFT JOIN subscriptions s ON o.id = s.organization_id
LEFT JOIN users u ON o.id = u.organization_id
LEFT JOIN agents a ON o.id = a.organization_id
LEFT JOIN conversations c ON o.id = c.organization_id
GROUP BY o.id, o.name, o.subdomain, o.plan, o.plan_status, s.status;
```

### User Activity Summary View
```sql
CREATE VIEW user_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  u.organization_id,
  u.last_active_at,
  COUNT(DISTINCT a.id) as agents_created,
  COUNT(DISTINCT al.id) as activities_count
FROM users u
LEFT JOIN agents a ON u.id = a.user_id
LEFT JOIN activity_logs al ON u.id = al.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.organization_id, u.last_active_at;
```

---

## Migration Script

### Phase 2 Complete Migration
```sql
-- Start transaction
BEGIN;

-- 1. Create billing tables
-- [Insert all billing table creation statements]

-- 2. Create team collaboration tables
-- [Insert all team table creation statements]

-- 3. Create analytics tables
-- [Insert all analytics table creation statements]

-- 4. Create notifications tables
-- [Insert all notifications table creation statements]

-- 5. Create admin tables
-- [Insert all admin table creation statements]

-- 6. Modify existing tables
-- [Insert all ALTER TABLE statements]

-- 7. Create indexes
-- [Insert all CREATE INDEX statements]

-- 8. Create views
-- [Insert all CREATE VIEW statements]

-- 9. Create triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
```

---

## Data Retention Policies

### Analytics Events
- Keep detailed events for 90 days
- Aggregate to daily metrics
- Archive older events to cold storage

```sql
-- Cleanup job (run daily)
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Activity Logs
- Keep for 1 year
- Critical actions: permanent

```sql
-- Archive old activity logs
CREATE TABLE activity_logs_archive (LIKE activity_logs INCLUDING ALL);

INSERT INTO activity_logs_archive
SELECT * FROM activity_logs
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM activity_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Notifications
- Keep read notifications for 30 days
- Keep unread notifications indefinitely

```sql
-- Cleanup old read notifications
DELETE FROM notifications 
WHERE is_read = TRUE 
  AND read_at < NOW() - INTERVAL '30 days';
```

---

## Backup Strategy

### Critical Tables (Daily Backup)
- `subscriptions`
- `invoices`
- `payment_methods`
- `organizations`
- `users`

### Analytics Tables (Weekly Backup)
- `analytics_events`
- `daily_metrics`
- `agent_metrics`

### Activity Tables (Weekly Backup)
- `activity_logs`
- `admin_audit_logs`

---

## Performance Tuning

### Partitioning Large Tables

```sql
-- Partition analytics_events by month
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

### Materialized Views for Expensive Queries

```sql
-- Refresh nightly
CREATE MATERIALIZED VIEW mv_organization_metrics AS
SELECT 
  organization_id,
  COUNT(DISTINCT user_id) as user_count,
  SUM(total_messages) as total_messages,
  AVG(avg_response_time) as avg_response_time
FROM daily_metrics
WHERE date >= NOW() - INTERVAL '30 days'
GROUP BY organization_id;

CREATE UNIQUE INDEX ON mv_organization_metrics(organization_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_metrics;
```

---

## Testing Data

See `PHASE-2-SEED-DATA.sql` for sample data to populate development databases.

---

## Next Steps

1. Review schema with team
2. Run migration on staging
3. Test all queries
4. Optimize slow queries
5. Deploy to production
