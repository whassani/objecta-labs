# First-Time Setup Guide - Objecta Labs

## 🎯 Complete Database Setup from Scratch

This guide walks you through setting up the Objecta Labs database for the first time.

---

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Database credentials ready

---

## Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE objecta_labs;

# Create user (optional)
CREATE USER objecta_labs_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE objecta_labs TO objecta_labs_user;

# Exit
\q
```

---

## Step 2: Set Environment Variables

**File:** `backend/.env`

```bash
# Copy from example
cp backend/.env.example backend/.env

# Edit the file
nano backend/.env
```

**Required variables:**
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=objecta_labs
DATABASE_USER=objecta_labs_user
DATABASE_PASSWORD=your_secure_password
DATABASE_URL=postgresql://objecta_labs_user:your_secure_password@localhost:5432/objecta_labs

# JWT
JWT_SECRET=generate-a-secure-random-string-at-least-32-characters-long
JWT_EXPIRATION=7d

# App
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional: Qdrant (Vector DB)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Optional: Email (for invitations, password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## Step 3: Run All Migrations

The migrations must be run in order:

```bash
# Navigate to backend
cd backend

# Run migrations in order
psql $DATABASE_URL -f src/migrations/001-create-rbac-tables.sql
psql $DATABASE_URL -f src/migrations/002-seed-default-roles.sql
psql $DATABASE_URL -f src/migrations/003-create-api-keys-table.sql
psql $DATABASE_URL -f src/migrations/004-create-audit-logs-table.sql
psql $DATABASE_URL -f src/migrations/006-create-billing-tables.sql
psql $DATABASE_URL -f src/migrations/007-create-team-tables.sql
psql $DATABASE_URL -f src/migrations/008-create-analytics-tables.sql
psql $DATABASE_URL -f src/migrations/009-create-notifications-tables.sql
psql $DATABASE_URL -f src/migrations/010-create-admin-tables.sql
psql $DATABASE_URL -f src/migrations/011-make-organization-id-nullable.sql
psql $DATABASE_URL -f src/migrations/012-rename-admin-users-to-platform-users.sql
psql $DATABASE_URL -f src/migrations/013-create-settings-tables.sql
psql $DATABASE_URL -f src/migrations/014-create-secrets-vault.sql
psql $DATABASE_URL -f src/migrations/015-add-user-security-fields.sql
psql $DATABASE_URL -f src/migrations/create-workflows-tables.sql
psql $DATABASE_URL -f src/migrations/create-tool-executions-table.sql
psql $DATABASE_URL -f src/migrations/create-fine-tuning-tables.sql
psql $DATABASE_URL -f src/migrations/create-jobs-table.sql
psql $DATABASE_URL -f src/migrations/performance-indexes.sql
psql $DATABASE_URL -f src/migrations/add-source-path-to-documents.sql
```

**Or use this convenient script:**

```bash
# Create a setup script
cat > setup-database.sh << 'EOF'
#!/bin/bash

echo "🚀 Setting up Objecta Labs database..."
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable not set"
  echo "Please set it in your .env file or export it"
  exit 1
fi

MIGRATIONS=(
  "001-create-rbac-tables.sql"
  "002-seed-default-roles.sql"
  "003-create-api-keys-table.sql"
  "004-create-audit-logs-table.sql"
  "006-create-billing-tables.sql"
  "007-create-team-tables.sql"
  "008-create-analytics-tables.sql"
  "009-create-notifications-tables.sql"
  "010-create-admin-tables.sql"
  "011-make-organization-id-nullable.sql"
  "012-rename-admin-users-to-platform-users.sql"
  "013-create-settings-tables.sql"
  "014-create-secrets-vault.sql"
  "015-add-user-security-fields.sql"
  "create-workflows-tables.sql"
  "create-tool-executions-table.sql"
  "create-fine-tuning-tables.sql"
  "create-jobs-table.sql"
  "performance-indexes.sql"
  "add-source-path-to-documents.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "src/migrations/$migration" ]; then
    echo "▶️  Running $migration..."
    psql $DATABASE_URL -f "src/migrations/$migration" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ $migration completed"
    else
      echo "❌ $migration failed"
      exit 1
    fi
  else
    echo "⚠️  $migration not found, skipping..."
  fi
done

echo ""
echo "✨ Database setup complete!"
EOF

chmod +x setup-database.sh
./setup-database.sh
```

---

## Step 4: Verify Database Setup

```sql
-- Connect to database
psql $DATABASE_URL

-- Check tables
\dt

-- Expected tables:
-- organizations
-- users
-- roles
-- user_role_assignments
-- api_keys
-- audit_logs
-- subscriptions
-- invoices
-- usage_records
-- team_invitations
-- activity_logs
-- analytics_events
-- agent_metrics
-- daily_metrics
-- notifications
-- notification_preferences
-- platform_users
-- support_tickets
-- admin_audit_logs
-- system_settings
-- feature_flags
-- organization_settings
-- admin_preferences
-- settings_audit_logs
-- secret_vault
-- secrets_access_logs
-- secrets_rotation_history
-- workflows
-- workflow_executions
-- workflow_execution_steps
-- workflow_webhooks
-- workflow_secrets
-- workflow_templates
-- tool_executions
-- tools
-- tool_versions
-- tool_environments
-- fine_tuning_datasets
-- fine_tuning_jobs
-- fine_tuned_models
-- training_examples
-- fine_tuning_events
-- jobs

-- Check roles are seeded
SELECT * FROM roles;

-- Expected roles:
-- OWNER (level 100)
-- ADMIN (level 80)
-- EDITOR (level 60)
-- MEMBER (level 50)
-- VIEWER (level 30)
```

---

## Step 5: Create First Admin User

### Option A: Via API (Recommended)

```bash
# 1. Build backend
cd backend
npm install
npm run build

# 2. Start backend
npm run start:dev

# 3. Register first user (creates organization + user)
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "organizationName": "My Organization"
  }'

# 4. Get the user ID from response
# Then assign OWNER role using the script
node backend/scripts/assign-role-safe.js admin@example.com owner
```

### Option B: Direct SQL

```sql
-- 1. Create organization
INSERT INTO organizations (id, name, subdomain, plan, plan_status, is_active)
VALUES (
  gen_random_uuid(),
  'My Organization',
  'my-org-' || extract(epoch from now())::bigint,
  'starter',
  'trial',
  true
) RETURNING id;

-- 2. Create user (use the organization ID from above)
INSERT INTO users (
  id, 
  organization_id, 
  email, 
  password_hash,
  first_name,
  last_name,
  is_active,
  email_verified
)
VALUES (
  gen_random_uuid(),
  'YOUR_ORGANIZATION_ID_HERE',
  'admin@example.com',
  -- Password: "password123" (use bcrypt to hash your actual password)
  '$2b$10$rT8kqL4K9qvZ4KjL4K9qvZ4KjL4K9qvZ4KjL4K9qvZ4KjL4K9qvZu',
  'Admin',
  'User',
  true,
  true
) RETURNING id;

-- 3. Assign OWNER role (use the user ID from above)
INSERT INTO user_role_assignments (
  id,
  user_id,
  role_id,
  organization_id,
  granted_by
)
SELECT 
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',
  roles.id,
  'YOUR_ORGANIZATION_ID_HERE',
  'YOUR_USER_ID_HERE'
FROM roles 
WHERE roles.name = 'OWNER';
```

---

## Step 6: Start the Application

### Backend

```bash
cd backend

# Install dependencies
npm install

# Build
npm run build

# Start development server
npm run start:dev

# Or production
npm run start:prod
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run start
```

---

## Step 7: Verify Setup

### 1. Test Backend Health

```bash
curl http://localhost:4000/health

# Expected response:
# {
#   "status": "ok",
#   "info": { ... },
#   "error": {},
#   "details": { ... }
# }
```

### 2. Test Authentication

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'

# Should return JWT token
```

### 3. Access Frontend

Open browser: `http://localhost:3000`
- Should see login page
- Login with admin credentials
- Should access dashboard

---

## Common Issues & Solutions

### Issue: Cannot connect to database

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue: Migration fails

```bash
# Check which tables exist
psql $DATABASE_URL -c "\dt"

# Drop database and start fresh (⚠️ DANGER)
psql -U postgres -c "DROP DATABASE objecta_labs;"
psql -U postgres -c "CREATE DATABASE objecta_labs;"

# Re-run migrations
```

### Issue: User registration fails

```bash
# Check if organizations table exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM organizations;"

# Check if roles are seeded
psql $DATABASE_URL -c "SELECT * FROM roles;"

# Re-run seed migration if needed
psql $DATABASE_URL -f backend/src/migrations/002-seed-default-roles.sql
```

---

## Quick Start Script

Save this as `quick-start.sh`:

```bash
#!/bin/bash

echo "🚀 Objecta Labs - Quick Start Setup"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
echo "✅ Prerequisites OK"
echo ""

# Create database
echo "Creating database..."
psql -U postgres -c "CREATE DATABASE objecta_labs;" 2>/dev/null
echo "✅ Database created (or already exists)"
echo ""

# Setup .env
echo "Setting up environment..."
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo "⚠️  Please edit backend/.env with your configuration"
  exit 1
fi
echo "✅ Environment configured"
echo ""

# Run migrations
echo "Running migrations..."
cd backend
source .env
./setup-database.sh
echo "✅ Migrations complete"
echo ""

# Install and build
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "Building..."
npm run build
echo "✅ Build complete"
echo ""

# Done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && npm run start:dev"
echo "2. Create admin user: node scripts/assign-role-safe.js admin@example.com owner"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Visit: http://localhost:3000"
echo ""
```

---

## Summary Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `objecta_labs` created
- [ ] Environment variables configured (`backend/.env`)
- [ ] All migrations run successfully
- [ ] Backend dependencies installed
- [ ] Backend builds successfully
- [ ] First admin user created
- [ ] Backend starts without errors
- [ ] Frontend dependencies installed
- [ ] Frontend starts without errors
- [ ] Can login via frontend

---

## Next Steps After Setup

1. **Configure Email** - For password reset and invitations
2. **Setup Qdrant** - For vector search (optional)
3. **Configure Stripe** - For billing (optional)
4. **Create More Users** - Via admin panel or registration
5. **Configure RBAC** - Assign roles and permissions
6. **Customize Settings** - In admin panel

---

## Getting Help

- **Backend errors:** Check `backend/logs/`
- **Database issues:** Use `psql $DATABASE_URL` to inspect
- **Migration issues:** Review migration files in `backend/src/migrations/`
- **Documentation:** See `README.md` and other guides

---

**Ready to go!** 🚀
