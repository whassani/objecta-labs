# 🗄️ Database RBAC Schema Explained

## 📊 Overview

Your system uses a **separate junction table** for role assignments, following best practices for many-to-many relationships.

---

## 🏗️ Database Tables

### 1. **`users` Table** - Application Users
Stores regular application users who belong to organizations.

```sql
Table: users
├── id (uuid, primary key)
├── email (string, unique)
├── password (hashed string)
├── organizationId (uuid, foreign key) ← Links to organization
├── created_at (timestamp)
└── updated_at (timestamp)

NOTE: No direct role column!
```

**Purpose**: Regular users who use the application (customers, team members)

---

### 2. **`platform_users` Table** - Platform Admins
Stores platform administrators (separate from regular users).

```sql
Table: platform_users
├── id (uuid, primary key)
├── username (string, unique)
├── email (string, unique)
├── password (hashed string)
├── created_at (timestamp)
└── updated_at (timestamp)

NOTE: No direct role column here either!
```

**Purpose**: Platform-level admins who manage the entire system (not tied to any organization)

---

### 3. **`roles` Table** - Role Definitions
Defines available roles and their permissions.

```sql
Table: roles
├── id (uuid, primary key)
├── name (string, unique) ← e.g., 'admin', 'member', 'viewer'
├── displayName (string) ← e.g., 'Administrator', 'Member'
├── description (text)
├── permissions (jsonb) ← Array of permissions ["agents:read", ...]
├── level (integer) ← Hierarchy level (0-100)
├── isSystem (boolean) ← Cannot be modified if true
├── isDefault (boolean) ← Assigned to new users if true
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Example Rows**:
```
id    | name   | displayName   | level | permissions
------|--------|---------------|-------|-------------
uuid1 | owner  | Owner         | 100   | [62 permissions]
uuid2 | admin  | Administrator | 80    | [44 permissions]
uuid3 | member | Member        | 50    | [28 permissions]
uuid4 | viewer | Viewer        | 20    | [9 permissions]
```

---

### 4. **`user_role_assignments` Table** - Junction Table ⭐
**This is the key table** that connects users to roles!

```sql
Table: user_role_assignments
├── id (uuid, primary key)
├── user_id (uuid, foreign key → users.id) ← Which user
├── role_id (uuid, foreign key → roles.id) ← Which role
├── organization_id (uuid) ← Scope to organization
├── workspace_id (uuid, nullable) ← Scope to workspace (optional)
├── granted_by (uuid, foreign key → users.id) ← Who granted the role
├── granted_at (timestamp)
├── expires_at (timestamp, nullable) ← Optional expiration
└── UNIQUE(user_id, role_id, organization_id, workspace_id)
```

**Example Rows**:
```
id    | user_id | role_id | organization_id | workspace_id | granted_by
------|---------|---------|-----------------|--------------|------------
uuid1 | john123 | admin   | org1           | NULL         | john123
uuid2 | jane456 | member  | org1           | NULL         | john123
uuid3 | bob789  | viewer  | org1           | ws1          | john123
```

---

## 🔗 How They Connect

```
┌──────────────┐         ┌──────────────────────────┐         ┌──────────────┐
│    users     │         │ user_role_assignments    │         │    roles     │
├──────────────┤         ├──────────────────────────┤         ├──────────────┤
│ id (PK)      │◄───────┤ user_id (FK)             │         │ id (PK)      │
│ email        │         │ role_id (FK)             ├────────►│ name         │
│ organization │         │ organization_id          │         │ displayName  │
└──────────────┘         │ workspace_id             │         │ permissions  │
                         │ granted_by               │         │ level        │
                         └──────────────────────────┘         └──────────────┘

Many-to-Many Relationship
A user can have multiple roles
A role can be assigned to multiple users
```

---

## 🎯 Why This Design?

### Advantages:
✅ **Flexibility**: Users can have multiple roles
✅ **Scoping**: Roles can be organization or workspace-specific
✅ **Auditing**: Track who granted the role and when
✅ **Expiration**: Optional time-limited permissions
✅ **Separation**: Clean separation between user data and authorization

### Example Use Cases:
- User can be **Admin** in organization1 and **Member** in organization2
- User can be **Admin** globally but **Viewer** in a specific workspace
- Temporary **Owner** role that expires after 30 days

---

## 📝 How to Query User Roles

### Get all roles for a user:
```sql
SELECT 
  u.email,
  r.name as role,
  r.displayName,
  r.level,
  r.permissions,
  ura.organization_id,
  ura.workspace_id,
  ura.granted_at
FROM users u
JOIN user_role_assignments ura ON u.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Get all permissions for a user:
```sql
SELECT DISTINCT jsonb_array_elements_text(r.permissions) as permission
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Get all users with a specific role:
```sql
SELECT 
  u.email,
  r.displayName as role,
  ura.granted_at
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE r.name = 'admin'
ORDER BY ura.granted_at DESC;
```

---

## 🔧 How to Assign Roles

### Method 1: Direct SQL
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT 
  u.id as user_id,
  r.id as role_id,
  u."organizationId",
  u.id as granted_by
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@example.com'
  AND r.name = 'admin'
ON CONFLICT DO NOTHING;
```

### Method 2: Using the API
```bash
POST /api/v1/permissions/users/:userId/assign
{
  "userId": "user-uuid",
  "roleId": "role-uuid",
  "organizationId": "org-uuid",
  "workspaceId": null
}
```

### Method 3: Using the Script
```bash
cd backend
node scripts/check-user-permissions.js user@example.com
# Follow the instructions
```

---

## 🎨 Visual Example

### Scenario: John, Jane, and Bob in Organization ABC

```
users table:
┌────────┬─────────────────────┬──────────────┐
│ id     │ email               │ organization │
├────────┼─────────────────────┼──────────────┤
│ john1  │ john@example.com    │ org-abc      │
│ jane2  │ jane@example.com    │ org-abc      │
│ bob3   │ bob@example.com     │ org-abc      │
└────────┴─────────────────────┴──────────────┘

roles table:
┌────────┬────────┬───────────────┬───────┐
│ id     │ name   │ displayName   │ level │
├────────┼────────┼───────────────┼───────┤
│ role1  │ owner  │ Owner         │ 100   │
│ role2  │ admin  │ Administrator │ 80    │
│ role3  │ member │ Member        │ 50    │
└────────┴────────┴───────────────┴───────┘

user_role_assignments table:
┌───────┬─────────┬─────────┬──────────────┐
│ id    │ user_id │ role_id │ organization │
├───────┼─────────┼─────────┼──────────────┤
│ ura1  │ john1   │ role1   │ org-abc      │  ← John is Owner
│ ura2  │ jane2   │ role2   │ org-abc      │  ← Jane is Admin
│ ura3  │ bob3    │ role3   │ org-abc      │  ← Bob is Member
└───────┴─────────┴─────────┴──────────────┘
```

**Result**:
- John has **Owner** role → 62 permissions (full access)
- Jane has **Admin** role → 44 permissions (can manage resources)
- Bob has **Member** role → 28 permissions (can create/edit content)

---

## ❓ Common Questions

### Q: Why not just add a `role` column to the users table?

**A**: Because:
1. Users can have multiple roles
2. Roles can be scoped to organization or workspace
3. Need to track who granted the role and when
4. Need to support role expiration
5. Separation of concerns (user data vs authorization)

### Q: Do platform_users use the same role system?

**A**: Currently, `platform_users` are separate and don't use this role system. They're platform admins with full access. However, you could extend the system to support them too.

### Q: What if a user has no role assigned?

**A**: They will have **no permissions** and get 403 errors. The system is secure by default - permissions must be explicitly granted.

### Q: Can a user have multiple roles?

**A**: Yes! A user can have:
- Admin role at organization level
- Viewer role in a specific workspace
- Multiple custom roles

The system combines all permissions from all assigned roles.

### Q: What's the difference between `users` and `platform_users`?

**A**: 
- **`users`**: Regular application users (belong to organizations)
- **`platform_users`**: Platform administrators (manage the entire system, no organization)

---

## 🔍 Checking Current State

### See all role assignments:
```sql
SELECT 
  u.email,
  r.name as role,
  r.displayName,
  ura.organization_id,
  ura.granted_at
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
ORDER BY u.email, r.level DESC;
```

### Count users per role:
```sql
SELECT 
  r.displayName as role,
  COUNT(ura.user_id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.id = ura.role_id
GROUP BY r.id, r.displayName, r.level
ORDER BY r.level DESC;
```

### Find users without any role:
```sql
SELECT u.email
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE ura.id IS NULL;
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Check user permissions | `node scripts/check-user-permissions.js EMAIL` |
| Assign admin role | SQL INSERT into `user_role_assignments` |
| List all roles | `SELECT * FROM roles ORDER BY level DESC` |
| See who has what role | JOIN `users`, `user_role_assignments`, `roles` |
| Remove role from user | `DELETE FROM user_role_assignments WHERE ...` |

---

## ✅ Summary

**Key Takeaways**:
1. ✅ Roles are NOT in the `users` or `platform_users` table
2. ✅ Roles are defined in the `roles` table
3. ✅ Role assignments are in the `user_role_assignments` table
4. ✅ This is a many-to-many relationship via junction table
5. ✅ Users can have multiple roles with different scopes
6. ✅ The system is secure by default (no role = no permissions)

**To give yourself admin access**:
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u."organizationId", u.id
FROM users u CROSS JOIN roles r
WHERE u.email = 'YOUR_EMAIL' AND r.name = 'admin'
ON CONFLICT DO NOTHING;
```

Then logout and login to refresh your JWT token!
