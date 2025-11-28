# Admin Permission Management Guide 🔐

Complete guide for managing user roles and permissions as an administrator.

---

## Table of Contents
1. [Understanding the Permission System](#understanding-the-permission-system)
2. [Role Hierarchy](#role-hierarchy)
3. [Available Permissions](#available-permissions)
4. [Managing Roles (Backend)](#managing-roles-backend)
5. [Managing Roles (Database)](#managing-roles-database)
6. [Creating a Permission Management UI](#creating-a-permission-management-ui)
7. [Common Tasks](#common-tasks)
8. [API Reference](#api-reference)

---

## Understanding the Permission System

### Architecture
The system uses **Role-Based Access Control (RBAC)**:
- **Roles** contain sets of permissions
- **Users** are assigned roles at organization or workspace level
- **Permissions** control access to specific features/actions

### Key Concepts

**Organization-level roles:**
- Apply across entire organization
- Highest precedence
- Example: Organization owner, admin

**Workspace-level roles:**
- Apply to specific workspace only
- More granular control
- Example: Workspace editor, viewer

**Permission inheritance:**
- Higher roles include permissions of lower roles
- Owner > Admin > Editor > Viewer

---

## Role Hierarchy

### 1. Owner (Level 4) 👑
**Full control over everything**

```
Permissions: ALL
- Organization management (create, update, delete)
- Billing and subscription management
- User management (all levels)
- All workspace permissions
- All resource permissions
```

**Use cases:**
- CEO, Founder
- Organization creator
- Billing administrator

### 2. Admin (Level 3) 🛡️
**Manage resources and users**

```
Permissions:
✅ Workspace management (read, update)
✅ User management (read, update)
✅ Settings management
✅ API keys management
✅ All resource operations (agents, workflows, etc.)
❌ Cannot delete organization
❌ Cannot manage billing
❌ Cannot change owner
```

**Use cases:**
- IT administrators
- Team leads
- Department managers

### 3. Editor (Level 2) ✏️
**Create and modify resources** (Default role)

```
Permissions:
✅ Create, read, update resources
✅ Execute workflows and tools
✅ Manage conversations
✅ Manage knowledge base
✅ Run fine-tuning jobs
❌ Cannot manage users
❌ Cannot access settings
❌ Cannot delete resources
```

**Use cases:**
- Developers
- Content creators
- Data scientists

### 4. Viewer (Level 1) 👁️
**Read-only access**

```
Permissions:
✅ Read all resources
✅ View conversations
✅ View workflows
✅ View knowledge base
❌ Cannot create anything
❌ Cannot edit anything
❌ Cannot execute workflows
```

**Use cases:**
- Stakeholders
- Auditors
- External consultants

---

## Available Permissions

### Organization Permissions
```typescript
organizations:manage    // Full control
organizations:read      // View organization
organizations:update    // Modify settings
organizations:delete    // Delete organization
```

### Workspace Permissions
```typescript
workspaces:manage      // Full control
workspaces:create      // Create workspaces
workspaces:read        // View workspaces
workspaces:update      // Modify workspaces
workspaces:delete      // Delete workspaces
```

### User Permissions
```typescript
users:manage          // Full user management
users:create          // Add users
users:read            // View users
users:update          // Modify users
users:delete          // Remove users
```

### Settings & Security
```typescript
settings:manage       // Full settings control
settings:read         // View settings
settings:update       // Modify settings
api-keys:manage       // Full API key control
api-keys:create       // Generate API keys
api-keys:read         // View API keys
api-keys:delete       // Revoke API keys
```

### Agent Permissions
```typescript
agents:create         // Create new agents
agents:read           // View agents
agents:update         // Modify agents
agents:delete         // Delete agents
agents:deploy         // Deploy to production
```

### Conversation Permissions
```typescript
conversations:create  // Start conversations
conversations:read    // View conversations
conversations:update  // Edit conversations
conversations:delete  // Delete conversations
```

### Knowledge Base Permissions
```typescript
knowledge-base:create // Create collections
knowledge-base:read   // View knowledge base
knowledge-base:update // Modify collections
knowledge-base:delete // Delete collections
documents:create      // Upload documents
documents:read        // View documents
documents:update      // Modify documents
documents:delete      // Delete documents
```

### Workflow Permissions
```typescript
workflows:create      // Create workflows
workflows:read        // View workflows
workflows:update      // Modify workflows
workflows:delete      // Delete workflows
workflows:execute     // Run workflows
```

### Tool Permissions
```typescript
tools:create          // Create tools
tools:read            // View tools
tools:update          // Modify tools
tools:delete          // Delete tools
tools:execute         // Run tools
```

### Fine-Tuning Permissions
```typescript
fine-tuning:create    // Start fine-tuning
fine-tuning:read      // View jobs
fine-tuning:update    // Modify jobs
fine-tuning:delete    // Cancel jobs
datasets:create       // Upload datasets
datasets:read         // View datasets
datasets:update       // Modify datasets
datasets:delete       // Delete datasets
```

### Job Permissions
```typescript
jobs:create           // Create background jobs
jobs:read             // View jobs
jobs:update           // Modify jobs
jobs:delete           // Cancel jobs
```

---

## Managing Roles (Backend)

### Using the RBAC Service

The backend provides `RbacService` for programmatic role management.

#### Get User Roles
```typescript
// In your controller/service
constructor(private rbacService: RbacService) {}

// Get user's roles
const roles = await this.rbacService.getUserRoles(
  userId,
  organizationId,
  workspaceId // optional
);

// Get user's permissions
const permissions = await this.rbacService.getUserPermissions(
  userId,
  organizationId,
  workspaceId // optional
);
```

#### Check Permissions
```typescript
// Check if user has specific role
const isAdmin = await this.rbacService.hasRole(
  userId,
  organizationId,
  UserRole.ADMIN
);

// Check if user has specific permission
const canDelete = await this.rbacService.hasPermission(
  userId,
  organizationId,
  Permission.AGENTS_DELETE
);
```

#### Assign Role
```typescript
// Assign role to user
await this.rbacService.assignRole(
  userId,           // User to assign to
  roleId,           // Role ID from roles table
  organizationId,   // Organization context
  null,             // workspace ID (null = org-level)
  grantedByUserId,  // Who granted the role
  expiresAt         // Optional expiration date
);
```

#### Remove Role
```typescript
// Remove role from user
await this.rbacService.removeRole(
  userId,
  roleId,
  organizationId,
  workspaceId // optional
);
```

---

## Managing Roles (Database)

### Direct SQL Commands

#### View All Roles
```sql
SELECT 
  name,
  display_name,
  description,
  level,
  jsonb_array_length(permissions) as permission_count
FROM roles
ORDER BY level DESC;
```

#### View User's Roles
```sql
SELECT 
  u.email,
  r.display_name as role,
  o.name as organization,
  w.name as workspace,
  ura.created_at,
  ura.expires_at
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
LEFT JOIN workspaces w ON w.id = ura.workspace_id
WHERE u.email = 'user@example.com';
```

#### Assign Owner Role
```sql
-- Assign owner role to user
INSERT INTO user_role_assignments (
  user_id,
  role_id,
  organization_id,
  workspace_id,
  granted_by
)
SELECT 
  u.id,
  r.id,
  u.organization_id,
  NULL,
  u.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@example.com'
AND r.name = 'owner';
```

#### Assign Admin Role
```sql
-- Assign admin role to user
INSERT INTO user_role_assignments (
  user_id,
  role_id,
  organization_id,
  workspace_id,
  granted_by
)
SELECT 
  u.id,
  r.id,
  u.organization_id,
  NULL,
  (SELECT id FROM users WHERE email = 'admin@example.com')
FROM users u
CROSS JOIN roles r
WHERE u.email = 'newadmin@example.com'
AND r.name = 'admin';
```

#### Remove Role
```sql
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
AND role_id = (SELECT id FROM roles WHERE name = 'admin')
AND organization_id = (SELECT organization_id FROM users WHERE email = 'user@example.com');
```

#### View All Permissions for a Role
```sql
SELECT 
  name,
  display_name,
  jsonb_pretty(permissions) as permissions
FROM roles
WHERE name = 'admin';
```

---

## Creating a Permission Management UI

Currently, the system doesn't have a UI for managing permissions. Here's how to create one:

### Step 1: Create Backend Endpoints

Add to `backend/src/modules/admin/admin.controller.ts`:

```typescript
@Get('roles')
@ApiOperation({ summary: 'Get all roles' })
async getRoles() {
  return this.rbacService.getAllRoles();
}

@Get('users/:userId/roles')
@ApiOperation({ summary: 'Get user roles' })
async getUserRoles(
  @Param('userId') userId: string,
  @Query('organizationId') organizationId: string,
) {
  return this.rbacService.getUserRoles(userId, organizationId);
}

@Post('users/:userId/roles')
@ApiOperation({ summary: 'Assign role to user' })
async assignRole(
  @Param('userId') userId: string,
  @Body() dto: { roleId: string; organizationId: string; workspaceId?: string },
  @Request() req,
) {
  return this.rbacService.assignRole(
    userId,
    dto.roleId,
    dto.organizationId,
    dto.workspaceId || null,
    req.user.userId,
  );
}

@Delete('users/:userId/roles/:roleId')
@ApiOperation({ summary: 'Remove role from user' })
async removeRole(
  @Param('userId') userId: string,
  @Param('roleId') roleId: string,
  @Query('organizationId') organizationId: string,
) {
  return this.rbacService.removeRole(userId, roleId, organizationId);
}
```

### Step 2: Create Frontend Page

Create `frontend/src/app/(admin)/admin/roles/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function RolesManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/customers'), // Gets organizations/users
        api.get('/admin/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId, roleId, organizationId) => {
    try {
      await api.post(`/admin/users/${userId}/roles`, {
        roleId,
        organizationId,
      });
      alert('Role assigned successfully! ✅');
      loadData();
    } catch (error) {
      alert(`Failed to assign role: ${error.response?.data?.message || error.message}`);
    }
  };

  // ... UI implementation
}
```

---

## Common Tasks

### Make a User an Admin

**Option 1: Using SQL**
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT 
  u.id,
  (SELECT id FROM roles WHERE name = 'admin'),
  u.organization_id,
  u.id
FROM users u
WHERE u.email = 'user@example.com';
```

**Option 2: Using API** (once endpoints are created)
```bash
curl -X POST http://localhost:3001/api/v1/admin/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ADMIN_ROLE_ID",
    "organizationId": "ORG_ID"
  }'
```

### Remove Admin Access
```sql
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
AND role_id = (SELECT id FROM roles WHERE name = 'admin');
```

### Grant Temporary Access
```sql
INSERT INTO user_role_assignments (
  user_id, role_id, organization_id, granted_by, expires_at
)
SELECT 
  u.id,
  (SELECT id FROM roles WHERE name = 'editor'),
  u.organization_id,
  (SELECT id FROM users WHERE email = 'admin@example.com'),
  NOW() + INTERVAL '7 days'
FROM users u
WHERE u.email = 'contractor@example.com';
```

### List All Admins
```sql
SELECT 
  u.email,
  u.full_name,
  r.display_name as role,
  o.name as organization
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
WHERE r.name IN ('owner', 'admin')
ORDER BY r.level DESC, u.email;
```

---

## API Reference

### Current Endpoints

**Admin Dashboard**
```
GET /api/v1/admin/dashboard
```

**Customer Management**
```
GET /api/v1/admin/customers
GET /api/v1/admin/customers/:id
PATCH /api/v1/admin/customers/:id
POST /api/v1/admin/customers/:id/suspend
```

**Audit Logs**
```
GET /api/v1/admin/audit-logs
```

### Needed Endpoints (To Be Created)

**Role Management**
```
GET /api/v1/admin/roles
GET /api/v1/admin/users/:userId/roles
POST /api/v1/admin/users/:userId/roles
DELETE /api/v1/admin/users/:userId/roles/:roleId
```

---

## Security Best Practices

### 1. Principle of Least Privilege
- Assign minimum necessary permissions
- Start with Viewer, upgrade as needed
- Regular audits of role assignments

### 2. Use Temporary Access
- Set expiration dates for contractors
- Automatic revocation prevents forgotten access
- Review expired assignments monthly

### 3. Audit Trail
- All role changes are logged
- Track who granted permissions
- Review audit logs regularly

### 4. Separation of Duties
- Don't make everyone an owner
- Use admin for day-to-day management
- Reserve owner for critical operations

### 5. Workspace-Level Roles
- Use for project-specific access
- More granular than org-level
- Easier to revoke when project ends

---

## Troubleshooting

### User Can't Access Feature

**Check role assignment:**
```sql
SELECT r.name, r.permissions
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
WHERE ura.user_id = 'USER_ID'
AND ura.organization_id = 'ORG_ID';
```

**Check if role has permission:**
```sql
SELECT permissions
FROM roles
WHERE name = 'editor'
AND permissions::jsonb ? 'workflows:execute';
```

### Permission Denied Errors

1. **Check JWT token** has organizationId
2. **Verify role assignment** exists
3. **Check role permissions** include required permission
4. **Check expiration** date hasn't passed
5. **Review guards** are properly configured

### Role Not Working

1. **Clear cache** (if using)
2. **Log out and log in** to refresh token
3. **Check database** for assignment
4. **Verify migrations** ran successfully

---

## Quick Reference

### Role Levels
```
4 = Owner   (Full control)
3 = Admin   (Manage resources & users)
2 = Editor  (Create & edit)
1 = Viewer  (Read-only)
```

### Assigning Roles (SQL Quick)
```sql
-- Make admin
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u, roles r
WHERE u.email = 'USER_EMAIL' AND r.name = 'admin';

-- Make owner
-- (Replace 'admin' with 'owner' in above query)

-- Remove role
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL')
AND role_id = (SELECT id FROM roles WHERE name = 'ROLE_NAME');
```

---

## Next Steps

### To Create Full Permission UI:

1. **Create endpoints** in AdminController
2. **Create frontend page** at `/admin/roles`
3. **Add to sidebar** navigation
4. **Test thoroughly** with different roles
5. **Document usage** for team

---

**Status:** ✅ System functional, UI creation needed
**Date:** December 2024

Need help implementing the UI? Let me know!
