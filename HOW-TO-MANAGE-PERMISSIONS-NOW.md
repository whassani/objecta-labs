# How to Manage Permissions RIGHT NOW 🚀

## Quick Start: Most Common Tasks

---

## 1️⃣ Make Someone an Admin

### Step 1: Connect to Database
```bash
psql -U your_username -d your_database
```

### Step 2: Run This Command
```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'newadmin@example.com' 
AND r.name = 'admin';
```

### Step 3: User Must Log Out and Log In
This refreshes their JWT token with the new role.

✅ Done! User is now an admin.

---

## 2️⃣ Make Someone an Owner

```sql
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'owner@example.com' 
AND r.name = 'owner';
```

⚠️ **Warning:** Owners have full control including billing and organization deletion!

---

## 3️⃣ Remove Admin Access

```sql
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'former-admin@example.com')
AND role_id = (SELECT id FROM roles WHERE name = 'admin')
AND organization_id = (SELECT organization_id FROM users WHERE email = 'former-admin@example.com');
```

Then the user must log out and log in again.

---

## 4️⃣ Check Who Has Admin Access

```sql
SELECT 
  u.email,
  u.full_name,
  r.display_name as role,
  r.level,
  o.name as organization,
  ura.created_at
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
WHERE r.name IN ('owner', 'admin')
ORDER BY o.name, r.level DESC, u.email;
```

---

## 5️⃣ Check What Roles a User Has

```sql
SELECT 
  u.email,
  r.display_name as role,
  r.level,
  o.name as organization,
  w.name as workspace,
  ura.created_at,
  ura.expires_at
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN organizations o ON o.id = ura.organization_id
LEFT JOIN workspaces w ON w.id = ura.workspace_id
WHERE u.email = 'user@example.com'
ORDER BY r.level DESC;
```

---

## 6️⃣ Give Temporary Access (e.g., Contractor)

```sql
-- Assign Editor role for 30 days
INSERT INTO user_role_assignments (
  user_id, 
  role_id, 
  organization_id, 
  granted_by, 
  expires_at
)
SELECT 
  u.id,
  r.id,
  u.organization_id,
  admin.id,
  NOW() + INTERVAL '30 days'
FROM users u
CROSS JOIN roles r
CROSS JOIN users admin
WHERE u.email = 'contractor@example.com' 
AND r.name = 'editor'
AND admin.email = 'admin@example.com';
```

---

## 7️⃣ View All Permissions for a Role

```sql
SELECT 
  name,
  display_name,
  level,
  jsonb_pretty(permissions) as permissions
FROM roles
WHERE name = 'admin';
```

---

## 8️⃣ Assign Role at Workspace Level

```sql
-- Give someone Editor access to specific workspace only
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
  w.organization_id,
  w.id,
  admin.id
FROM users u
CROSS JOIN roles r
CROSS JOIN workspaces w
CROSS JOIN users admin
WHERE u.email = 'user@example.com' 
AND r.name = 'editor'
AND w.name = 'Project Alpha'
AND admin.email = 'admin@example.com';
```

---

## 🎯 Role Reference

| Role | Level | Can Do | Cannot Do |
|------|-------|--------|-----------|
| 👑 **Owner** | 4 | Everything | Nothing restricted |
| 🛡️ **Admin** | 3 | Manage users & resources | Billing, org deletion |
| ✏️ **Editor** | 2 | Create & edit resources | Manage users, settings |
| 👁️ **Viewer** | 1 | Read everything | Create, edit, delete |

---

## 🚨 Emergency: Remove All Access

```sql
-- Remove ALL role assignments for a user
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

⚠️ **Warning:** User won't be able to access anything after this!

---

## 🔍 Audit: Who Changed Roles?

```sql
SELECT 
  target.email as "User Affected",
  r.display_name as "Role",
  granter.email as "Granted By",
  ura.created_at as "When"
FROM user_role_assignments ura
JOIN users target ON target.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
JOIN users granter ON granter.id = ura.granted_by
WHERE ura.created_at > NOW() - INTERVAL '30 days'
ORDER BY ura.created_at DESC;
```

---

## 📋 Pre-Flight Checklist

Before assigning roles:

- [ ] Verify user's email is correct
- [ ] Confirm organization context
- [ ] Choose appropriate role level
- [ ] Set expiration if temporary
- [ ] Document why (in audit log or notes)
- [ ] Inform the user
- [ ] Tell them to log out and log in

---

## 🐛 Troubleshooting

### Issue: "User still can't access after role assignment"

**Solution:**
1. Verify role was assigned:
   ```sql
   SELECT * FROM user_role_assignments 
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
   ```

2. Check if role is expired:
   ```sql
   SELECT expires_at FROM user_role_assignments 
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
   AND (expires_at IS NULL OR expires_at > NOW());
   ```

3. **User MUST log out and log back in!**
   - This refreshes the JWT token
   - New permissions won't work until token is refreshed

### Issue: "Cannot assign role - constraint violation"

**Cause:** Role already assigned

**Solution:** Update instead of insert, or delete first:
```sql
-- Delete existing
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
AND organization_id = (SELECT organization_id FROM users WHERE email = 'user@example.com');

-- Then assign new role
-- (Use INSERT command from above)
```

### Issue: "No roles table found"

**Solution:** Run migrations:
```bash
cd backend
psql -U your_username -d your_database < src/migrations/001-create-rbac-tables.sql
psql -U your_username -d your_database < src/migrations/002-seed-default-roles.sql
```

---

## 📝 Template: Standard Role Assignment

Copy and modify this:

```sql
-- TEMPLATE: Assign [ROLE] to [USER]
-- Date: [TODAY'S DATE]
-- Reason: [WHY THIS ROLE IS NEEDED]
-- Granted by: [YOUR EMAIL]
-- Expires: [DATE OR "Never"]

INSERT INTO user_role_assignments (
  user_id, 
  role_id, 
  organization_id, 
  granted_by,
  expires_at  -- Remove this line if permanent
)
SELECT 
  u.id,
  r.id,
  u.organization_id,
  admin.id,
  NOW() + INTERVAL '90 days'  -- Remove this line if permanent
FROM users u
CROSS JOIN roles r
CROSS JOIN users admin
WHERE u.email = 'TARGET_USER_EMAIL' 
AND r.name = 'ROLE_NAME'  -- owner, admin, editor, or viewer
AND admin.email = 'YOUR_EMAIL';

-- Verify assignment
SELECT 
  u.email,
  r.display_name,
  ura.created_at,
  ura.expires_at
FROM user_role_assignments ura
JOIN users u ON u.id = ura.user_id
JOIN roles r ON r.id = ura.role_id
WHERE u.email = 'TARGET_USER_EMAIL';
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Assign minimum necessary role
- Set expiration dates for temporary access
- Document why roles are granted
- Review role assignments quarterly
- Use workspace-level roles when possible
- Audit admin access monthly

### ❌ DON'T:
- Make everyone an owner
- Grant admin access "just in case"
- Forget to set expiration for contractors
- Share owner credentials
- Assign roles without documentation

---

## 💡 Common Use Cases

### New Employee Joins
```sql
-- Assign default Editor role
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, u.id
FROM users u, roles r
WHERE u.email = 'newemployee@example.com' AND r.name = 'editor';
```

### Employee Promoted to Manager
```sql
-- Upgrade to Admin
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.organization_id, admin.id
FROM users u, roles r, users admin
WHERE u.email = 'promoted@example.com' 
AND r.name = 'admin'
AND admin.email = 'hr@example.com';
```

### Employee Leaves Company
```sql
-- Remove all access
DELETE FROM user_role_assignments
WHERE user_id = (SELECT id FROM users WHERE email = 'former@example.com');

-- Optionally: deactivate user account
UPDATE users 
SET is_active = false 
WHERE email = 'former@example.com';
```

### External Auditor (Read-Only, Temporary)
```sql
-- Assign Viewer role for 14 days
INSERT INTO user_role_assignments (
  user_id, role_id, organization_id, granted_by, expires_at
)
SELECT u.id, r.id, u.organization_id, admin.id, NOW() + INTERVAL '14 days'
FROM users u, roles r, users admin
WHERE u.email = 'auditor@external.com' 
AND r.name = 'viewer'
AND admin.email = 'compliance@example.com';
```

---

## 📞 Need More Help?

- **Full documentation:** See `ADMIN-PERMISSION-MANAGEMENT-GUIDE.md`
- **Quick reference:** See `QUICK-PERMISSION-REFERENCE.md`
- **Code reference:** See `backend/src/modules/auth/services/rbac.service.ts`

---

## ✅ Quick Checklist After Assigning Role

- [ ] Role assignment successful (no SQL errors)
- [ ] Verified with SELECT query
- [ ] User notified of new permissions
- [ ] User instructed to log out and log in
- [ ] Documented in audit log or notes
- [ ] Added calendar reminder if temporary
- [ ] Tested user can access new features

---

**Remember:** Users MUST log out and log back in after role changes! 🔄

The JWT token contains their roles and won't update until they get a new token.

---

**Status:** Ready to use immediately
**Date:** December 2024
