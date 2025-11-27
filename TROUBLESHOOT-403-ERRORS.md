# 🔧 Troubleshooting 403 Forbidden Errors

## 🎯 Quick Diagnosis

If you're getting **403 Forbidden** errors even as an admin, follow these steps:

---

## Step 1: Check Your User's Permissions

```bash
cd backend
node scripts/check-user-permissions.js YOUR_EMAIL@example.com
```

**Expected Output**:
```
✅ User found
📋 Assigned Roles: Admin, Member, etc.
🔑 All Permissions: agents:read, agents:create, etc.
```

**If you see**:
- ❌ No roles assigned → **FIX**: Assign a role (see Step 2)
- ❌ Missing agents:read → **FIX**: Update role permissions (see Step 3)

---

## Step 2: Assign a Role to Your User

### Option A: Assign Admin Role (Recommended)

```bash
cd backend

# Replace YOUR_EMAIL with your actual email
psql $DATABASE_URL -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.\"organizationId\", u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin' AND u.email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;
"
```

### Option B: Assign Member Role (Default)

```bash
psql $DATABASE_URL -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.\"organizationId\", u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'member' AND u.email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;
"
```

### Option C: Use Quick Script

```bash
./QUICK-ASSIGN-OWNER-ROLE.sh
# Enter your email when prompted
```

---

## Step 3: Verify Roles Exist

Check if system roles are in the database:

```bash
cd backend
psql $DATABASE_URL -c "
SELECT name, \"displayName\", level, \"isSystem\", 
       jsonb_array_length(permissions) as perm_count
FROM roles
ORDER BY level DESC;
"
```

**Expected Output**:
```
name    | displayName   | level | isSystem | perm_count
--------|---------------|-------|----------|------------
owner   | Owner         | 100   | t        | 62
admin   | Administrator | 80    | t        | 44
member  | Member        | 50    | t        | 28
viewer  | Viewer        | 20    | t        | 9
```

**If you see 0 rows**, roles haven't been seeded yet:

```bash
cd backend
node scripts/seed-roles.js
```

---

## Step 4: Check Specific Permission

Verify the admin role has the correct permissions:

```bash
cd backend
psql $DATABASE_URL -c "
SELECT name, permissions 
FROM roles 
WHERE name = 'admin';
"
```

**Should contain**:
```json
["agents:read", "agents:create", "agents:update", "agents:delete", ...]
```

---

## Step 5: Restart Backend

After making database changes:

```bash
# Kill existing backend
pkill -f "npm run start:dev"

# Restart
cd backend
npm run start:dev
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "No roles assigned to this user"

**Cause**: User exists but has no role assigned

**Solution**:
```bash
cd backend
node scripts/check-user-permissions.js YOUR_EMAIL@example.com
# Then follow the instructions to assign a role
```

### Issue 2: "User does not have agents:read permission"

**Cause**: Role doesn't have the required permission

**Solution**: Update the role's permissions or assign a different role

```bash
# Assign admin role which has all permissions
psql $DATABASE_URL -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.\"organizationId\", u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin' AND u.email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;
"
```

### Issue 3: "Roles table is empty"

**Cause**: Database hasn't been seeded with system roles

**Solution**:
```bash
cd backend
node scripts/seed-roles.js
```

### Issue 4: "Still getting 403 after assigning role"

**Possible Causes**:
1. Backend not restarted
2. Token needs refresh (logout and login again)
3. Multiple role assignments conflicting

**Solution**:
```bash
# 1. Restart backend
pkill -f "npm run start:dev"
cd backend && npm run start:dev

# 2. In frontend: Logout and login again to get new JWT token

# 3. Check for conflicting assignments
psql $DATABASE_URL -c "
SELECT u.email, r.name, r.level
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE u.email = 'YOUR_EMAIL@example.com'
ORDER BY r.level DESC;
"
```

---

## 🎯 Quick Fix (All-in-One)

If you just want to fix it quickly:

```bash
cd backend

# 1. Seed roles if not done
node scripts/seed-roles.js

# 2. Assign admin role to yourself
psql $DATABASE_URL -c "
INSERT INTO user_role_assignments (user_id, role_id, organization_id, granted_by)
SELECT u.id, r.id, u.\"organizationId\", u.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'admin' AND u.email = 'YOUR_EMAIL@example.com'
ON CONFLICT DO NOTHING;
"

# 3. Restart backend
pkill -f "npm run start:dev"
npm run start:dev &

# 4. In browser: Logout and login again
```

---

## 📊 Permission Requirements by Endpoint

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/agents` | GET | `agents:read` |
| `/api/agents` | POST | `agents:create` |
| `/api/agents/:id` | PUT | `agents:update` |
| `/api/agents/:id` | DELETE | `agents:delete` |
| `/api/workflows` | GET | `workflows:read` |
| `/api/workflows` | POST | `workflows:create` |
| `/api/conversations` | GET | `conversations:read` |
| `/api/v1/permissions/roles` | GET | (none - public) |
| `/api/v1/permissions/roles` | POST | `users:manage` |

---

## 🔐 Role Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| agents:read | ✅ | ✅ | ✅ | ✅ |
| agents:create | ✅ | ✅ | ✅ | ❌ |
| agents:update | ✅ | ✅ | ✅ | ❌ |
| agents:delete | ✅ | ✅ | ❌ | ❌ |
| users:manage | ✅ | ❌ | ❌ | ❌ |

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Run `node scripts/check-user-permissions.js YOUR_EMAIL`
- [ ] See your assigned roles (Admin, Member, etc.)
- [ ] See `agents:read` in permissions list
- [ ] Backend restarted
- [ ] Logout and login in browser
- [ ] Test `/api/agents` endpoint (should return 200)
- [ ] Test `/dashboard/agents` page (should load)

---

## 📞 Still Having Issues?

1. Check backend logs: `tail -f backend/logs/*.log`
2. Check browser console for errors
3. Verify JWT token is valid: Check LocalStorage in DevTools
4. Database connection: `psql $DATABASE_URL -c "SELECT 1;"`

---

**Quick Diagnostic Command**:
```bash
cd backend && node scripts/check-user-permissions.js $(whoami)@example.com
```

Replace `$(whoami)@example.com` with your actual email address.
