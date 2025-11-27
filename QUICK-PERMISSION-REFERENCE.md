# Quick Permission Reference Card 🔐

## Role Hierarchy (Quick View)

```
👑 OWNER (Level 4)
   └─ Everything (billing, org deletion, all users)

🛡️ ADMIN (Level 3)
   └─ Manage users & resources (no billing, no org deletion)

✏️ EDITOR (Level 2) [DEFAULT]
   └─ Create & edit resources (no user management)

👁️ VIEWER (Level 1)
   └─ Read-only access
```

---

## Quick Commands

### Make Someone Admin (SQL)
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u, roles r
WHERE u.email = 'newadmin@example.com' AND r.name = 'admin';
```

### Make Someone Owner (SQL)
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u, roles r
WHERE u.email = 'owner@example.com' AND r.name = 'owner';
```

### Remove Role (SQL)
```sql
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
AND role_id = (SELECT id FROM roles WHERE name = 'admin');
```

### Check User's Roles (SQL)
```sql
SELECT u.email, r.display_name as role, o.name as organization
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
WHERE u.email = 'user@example.com';
```

### List All Admins (SQL)
```sql
SELECT u.email, u.full_name, r.display_name
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
WHERE r.name IN ('owner', 'admin')
ORDER BY r.level DESC;
```

---

## Permission Categories

### ✅ Owner Can Do
- ✅ Everything below PLUS:
- ✅ Manage billing & subscriptions
- ✅ Delete organization
- ✅ Manage all users (including owners)
- ✅ Access sensitive settings

### ✅ Admin Can Do
- ✅ Everything below PLUS:
- ✅ Manage users (create, edit, delete)
- ✅ Manage workspaces
- ✅ View/edit settings
- ✅ Manage API keys
- ❌ Cannot manage billing
- ❌ Cannot delete organization

### ✅ Editor Can Do (Default)
- ✅ Create agents, workflows, tools
- ✅ Edit their own resources
- ✅ Upload documents to knowledge base
- ✅ Run workflows and tools
- ✅ Start conversations
- ✅ Create fine-tuning jobs
- ❌ Cannot manage users
- ❌ Cannot access settings

### ✅ Viewer Can Do
- ✅ View everything
- ❌ Cannot create anything
- ❌ Cannot edit anything
- ❌ Cannot run workflows

---

## Common Scenarios

### New Employee
→ Assign **Editor** role (default)

### Team Lead / Manager
→ Assign **Admin** role

### External Consultant
→ Assign **Viewer** role

### Contractor (Temporary)
→ Assign **Editor** with expiration:
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by, expires_at)
SELECT u.id, r.id, u.organization_id, admin.id, NOW() + INTERVAL '30 days'
FROM users u, roles r, users admin
WHERE u.email = 'contractor@example.com' 
AND r.name = 'editor'
AND admin.email = 'admin@example.com';
```

---

## Database Quick Access

### Connect to Database
```bash
psql -U your_username -d your_database
```

### View All Roles
```sql
SELECT name, display_name, level FROM roles ORDER BY level DESC;
```

### View Permissions for a Role
```sql
SELECT name, jsonb_pretty(permissions) 
FROM roles 
WHERE name = 'admin';
```

---

## Current Admin Features

### Available Now ✅
- Admin dashboard (`/admin/dashboard`)
- Customer management (`/admin/customers`)
- Support tickets (`/admin/tickets`)
- Audit logs (via API)

### Not Yet Available ❌
- Role management UI (needs to be created)
- Permission assignment UI (needs to be created)
- User role visualization (needs to be created)

---

## Quick Troubleshooting

### "Permission Denied"
1. Check user's role: See SQL commands above
2. Verify role has permission: Check role's permissions
3. Log out and log in again (refresh JWT token)

### "User has no roles"
```sql
-- Assign default Editor role
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u, roles r
WHERE u.email = 'user@example.com' AND r.name = 'editor';
```

### "Need to check who has admin access"
```sql
-- List all admins and owners
SELECT u.email, r.display_name, o.name as org
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
WHERE r.name IN ('owner', 'admin')
ORDER BY o.name, r.level DESC;
```

---

## Files Reference

- **Full Guide:** `ADMIN-PERMISSION-MANAGEMENT-GUIDE.md`
- **This Card:** `QUICK-PERMISSION-REFERENCE.md`
- **RBAC Service:** `backend/src/modules/auth/services/rbac.service.ts`
- **Permissions Enum:** `backend/src/modules/auth/enums/permission.enum.ts`
- **Roles Enum:** `backend/src/modules/auth/enums/role.enum.ts`

---

## Create Permission UI (TODO)

To create a UI for managing roles:
1. Add endpoints to `AdminController`
2. Create frontend page at `/admin/roles`
3. Add to sidebar navigation

See `ADMIN-PERMISSION-MANAGEMENT-GUIDE.md` for detailed instructions.

---

**Quick Help:** For any permission issue, check user's role first!

```sql
-- Your go-to command:
SELECT u.email, r.name, r.level, r.permissions
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id  
JOIN roles r ON r.id = ura.role_id
WHERE u.email = 'USER_EMAIL_HERE';
```

---

**Need to manage permissions right now?**

Use SQL commands above directly in your database!

**Want a UI?**

See `ADMIN-PERMISSION-MANAGEMENT-GUIDE.md` → "Creating a Permission Management UI" section.
