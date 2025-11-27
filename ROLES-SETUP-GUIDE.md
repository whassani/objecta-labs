# 🔐 Roles & Permissions Setup Guide

## 📋 Overview

Your system has 4 default system roles that need to be seeded into the database:
- **Owner** - Full control (Level 100)
- **Admin** - Organization management (Level 80)
- **Member** - Content creation and editing (Level 50) 
- **Viewer** - Read-only access (Level 20)

---

## 🎯 System Roles Explained

### 1. 👑 Owner (Level 100)
**Description**: Full control over the organization including billing and user management

**Can Do**:
- ✅ Everything an Admin can do, plus:
- ✅ Manage organization settings
- ✅ Manage billing and subscriptions
- ✅ Delete the organization
- ✅ Transfer ownership
- ✅ Full user management (create, update, delete)

**Permissions** (30+):
```
organizations:*, workspaces:*, users:*, settings:*, api-keys:*
agents:*, conversations:*, knowledge-base:*, documents:*
workflows:*, tools:*, fine-tuning:*, datasets:*, jobs:*
```

**Use Case**: Company founder, CEO, primary account owner

---

### 2. 🛡️ Admin (Level 80)
**Description**: Can manage workspaces, users, and all resources

**Can Do**:
- ✅ Manage workspaces and users
- ✅ Create, read, update, delete all resources
- ✅ Deploy agents and workflows
- ✅ Manage API keys
- ✅ Update settings
- ❌ Cannot manage billing
- ❌ Cannot delete organization

**Permissions** (25+):
```
workspaces:read, workspaces:update
users:read, users:update
settings:read, settings:update
api-keys:*, agents:*, conversations:*, knowledge-base:*
documents:*, workflows:*, tools:*, fine-tuning:*, datasets:*, jobs:*
```

**Use Case**: Technical lead, team manager, project administrator

---

### 3. 👥 Member (Level 50) - **Default Role**
**Description**: Can create and edit resources, execute workflows and tools

**Can Do**:
- ✅ Create and edit agents
- ✅ Have conversations with agents
- ✅ Manage knowledge base and documents
- ✅ Create and execute workflows
- ✅ Use tools
- ✅ Create fine-tuning jobs
- ❌ Cannot manage users
- ❌ Cannot manage organization settings
- ❌ Cannot delete critical resources

**Permissions** (15+):
```
agents:create, agents:read, agents:update
conversations:*, knowledge-base:create/read/update
documents:create/read/update, workflows:create/read/update/execute
tools:create/read/update/execute, fine-tuning:create/read/update
datasets:create/read/update, jobs:create/read
```

**Use Case**: Regular team member, content creator, data scientist

**Note**: This is the **default role** assigned to new users

---

### 4. 👁️ Viewer (Level 20)
**Description**: Read-only access to all resources

**Can Do**:
- ✅ View all resources
- ✅ Read agents and conversations
- ✅ Browse knowledge base
- ✅ View workflows and tools
- ❌ Cannot create or edit anything
- ❌ Cannot execute workflows or tools

**Permissions** (9):
```
agents:read, conversations:read, knowledge-base:read
documents:read, workflows:read, tools:read
fine-tuning:read, datasets:read, jobs:read
```

**Use Case**: Stakeholder, auditor, external consultant, observer

---

## 🚀 Setup Instructions

### Option 1: Run Seed Script (Recommended)

```bash
cd backend
node scripts/seed-roles.js
```

**Expected Output**:
```
🌱 Seeding default roles...

✅ Created role: Owner (30 permissions)
✅ Created role: Administrator (25 permissions)
✅ Created role: Member (15 permissions)
✅ Created role: Viewer (9 permissions)

🎉 Role seeding completed!

📊 Current Roles:

Name          Display Name       Level  Default  Permissions
─────────────────────────────────────────────────────────────
owner         Owner              100    No       30
admin         Administrator      80     No       25
member        Member             50     Yes      15
viewer        Viewer             20     No       9
```

### Option 2: Run SQL Migration

```bash
cd backend
psql $DATABASE_URL -f src/migrations/002-seed-default-roles.sql
```

### Option 3: Manual SQL

```sql
-- Connect to your database and run:
\i backend/src/migrations/002-seed-default-roles.sql
```

---

## ✅ Verify Roles Were Created

### Check in Database
```sql
SELECT name, display_name, level, is_default, 
       jsonb_array_length(permissions) as permission_count 
FROM roles 
ORDER BY level DESC;
```

### Check via API
```bash
curl http://localhost:3001/api/v1/permissions/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check in UI
1. Navigate to: http://localhost:3000/dashboard/permissions
2. You should see 4 roles in the list:
   - Owner (System)
   - Administrator (System)
   - Member (System, Default)
   - Viewer (System)

---

## 👤 Assigning Roles to Users

### Default Behavior
- New users automatically get the **Member** role (marked as `is_default: true`)

### Assign Role Manually

#### Via API
```bash
# Assign Admin role to a user
curl -X POST http://localhost:3001/api/v1/permissions/users/:userId/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "roleId": "admin-role-uuid"
  }'
```

#### Via Team Page
1. Go to http://localhost:3000/dashboard/team
2. Click on a team member
3. Select their role from the dropdown
4. Save changes

#### Via Database
```sql
-- Assign Owner role to first user in organization
INSERT INTO user_role_assignments (user_id, role_id, organization_id, workspace_id, granted_by)
SELECT 
  u.id as user_id,
  r.id as role_id,
  u.organization_id,
  NULL as workspace_id,
  u.id as granted_by
FROM users u
CROSS JOIN roles r
WHERE r.name = 'owner'
  AND u.email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
```

---

## 🎯 Common Scenarios

### Scenario 1: Make Yourself Owner
```bash
# Run seed script first
node backend/scripts/seed-roles.js

# Then assign owner role
psql $DATABASE_URL -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, workspace_id, granted_by)
SELECT 
  u.id, r.id, u.organization_id, NULL, u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'owner'
  AND u.email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;
"
```

### Scenario 2: Create Department Roles
After seeding system roles, create custom roles:

**Marketing Team**:
```json
{
  "name": "marketing",
  "displayName": "Marketing Team",
  "description": "Marketing team with agent access",
  "permissions": ["agents:read", "conversations:create", "conversations:read"],
  "level": 30
}
```

**Developer Team**:
```json
{
  "name": "developer",
  "displayName": "Developer",
  "description": "Developers with full technical access",
  "permissions": ["agents:manage", "workflows:manage", "tools:manage", "api-keys:create"],
  "level": 60
}
```

### Scenario 3: Audit Who Has What
```sql
-- See all user role assignments
SELECT 
  u.email,
  r.display_name as role,
  r.level,
  ura.granted_at,
  granter.email as granted_by
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
LEFT JOIN users granter ON ura.granted_by = granter.id
ORDER BY r.level DESC, u.email;
```

---

## 🔍 Troubleshooting

### Issue: "No roles showing in UI"
**Solution**: Run the seed script
```bash
cd backend && node scripts/seed-roles.js
```

### Issue: "User can't access permission page"
**Solution**: This is now fixed - all authenticated users can view permissions

### Issue: "User can't create roles"
**Solution**: User needs `users:manage` permission (Admin or Owner role)

### Issue: "Member vs Editor confusion"
**Note**: We renamed "Editor" to "Member" as the default role. The old migration file still says "Editor" but the script uses "Member".

### Issue: "Need to reset roles"
```sql
-- WARNING: This deletes all role assignments!
TRUNCATE user_role_assignments CASCADE;
DELETE FROM roles WHERE is_system = true;
-- Then run seed script again
```

---

## 📊 Permission Matrix

| Resource | Owner | Admin | Member | Viewer |
|----------|-------|-------|--------|--------|
| Organizations | ✅ Manage | ❌ | ❌ | ❌ |
| Users | ✅ Manage | ✅ Read/Update | ❌ | ❌ |
| Workspaces | ✅ Manage | ✅ Read/Update | ❌ | ❌ |
| Settings | ✅ Manage | ✅ Read/Update | ❌ | ❌ |
| API Keys | ✅ Manage | ✅ Manage | ❌ | ❌ |
| Agents | ✅ All | ✅ All | ✅ Create/Read/Update | ✅ Read |
| Conversations | ✅ All | ✅ All | ✅ Create/Read/Update | ✅ Read |
| Knowledge Base | ✅ All | ✅ All | ✅ Create/Read/Update | ✅ Read |
| Documents | ✅ All | ✅ All | ✅ Create/Read/Update | ✅ Read |
| Workflows | ✅ All + Deploy | ✅ All | ✅ Create/Read/Update/Execute | ✅ Read |
| Tools | ✅ All | ✅ All | ✅ Create/Read/Update/Execute | ✅ Read |
| Fine-tuning | ✅ All | ✅ Create/Read/Update | ✅ Create/Read/Update | ✅ Read |
| Datasets | ✅ All | ✅ Create/Read/Update | ✅ Create/Read/Update | ✅ Read |
| Jobs | ✅ All | ✅ Create/Read | ✅ Create/Read | ✅ Read |

---

## 🎉 Summary

**System Roles** (Cannot be modified or deleted):
1. **Owner** (Level 100) - Full control
2. **Admin** (Level 80) - Organization management
3. **Member** (Level 50) - Default role for new users
4. **Viewer** (Level 20) - Read-only

**Setup Steps**:
1. ✅ Run: `node backend/scripts/seed-roles.js`
2. ✅ Verify roles in UI: `/dashboard/permissions`
3. ✅ Assign Owner role to yourself via SQL
4. ✅ Create custom roles as needed

**Access**:
- UI: http://localhost:3000/dashboard/permissions
- API: http://localhost:3001/api/v1/permissions

---

Need help? Check the troubleshooting section or contact support.
