# Troubleshooting 403 Permission Errors

## 🎯 Problem

Getting `403 Forbidden` when accessing `/api/agents` even as owner.

---

## 🔍 Common Causes

### 1. No Role Assigned
User exists but doesn't have OWNER role assigned.

### 2. Old JWT Token
JWT token was created before role was assigned (doesn't have permissions).

### 3. Role Name Mismatch
Role in database is `'owner'` (lowercase) but code expects `'OWNER'` (uppercase).

### 4. Permissions Not in Token
JWT token doesn't include permissions array.

---

## 🛠️ Diagnosis Steps

### Step 1: Check User's Roles

```bash
cd backend
node scripts/diagnose-permissions.js your-email@example.com
```

This will show:
- ✅ If user exists
- ✅ What roles are assigned
- ✅ What permissions they have
- ✅ If `agents:read` permission is present

### Step 2: Assign OWNER Role (if needed)

```bash
node scripts/assign-role-safe.js your-email@example.com owner
```

### Step 3: Log Out and Log Back In

**This is critical!** The JWT token is generated at login time with the user's current permissions. If you assigned a role after login, you need to get a new token.

1. Log out of the application
2. Log back in
3. Try accessing `/api/agents` again

### Step 4: Check JWT Token

Open browser developer console and check the token:

```javascript
// Get token from localStorage or cookies
const token = localStorage.getItem('token');

// Decode it (don't need to verify signature for inspection)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('JWT Payload:', payload);
console.log('Permissions:', payload.permissions);
console.log('Roles:', payload.roles);
```

The token should have:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "organizationId": "org-id",
  "roles": ["owner"],
  "permissions": [
    "agents:read",
    "agents:create",
    "agents:update",
    "agents:delete",
    ...
  ]
}
```

---

## ✅ Solutions

### Solution 1: Assign OWNER Role

```bash
# Make sure backend is built
cd backend
npm run build

# Assign OWNER role
node scripts/assign-role-safe.js your-email@example.com owner

# Output should show:
# ✅ Role assigned successfully!
```

### Solution 2: Log Out and Back In

After assigning the role:
1. Click logout
2. Clear browser cache/localStorage (or just refresh)
3. Log back in
4. New JWT token will include permissions

### Solution 3: Verify Database Roles

```sql
-- Check if roles exist
SELECT name, level, permissions FROM roles;

-- Check user's role assignments
SELECT 
  u.email,
  r.name as role_name,
  r.level,
  ura.created_at
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.id
WHERE u.email = 'your-email@example.com';
```

### Solution 4: Re-seed Roles (if corrupted)

```bash
cd backend
psql $DATABASE_URL -f src/migrations/002-seed-default-roles.sql
```

This re-inserts default roles (uses ON CONFLICT DO NOTHING, so it's safe).

---

## 🧪 Testing

### Test 1: Can Get Agents

```bash
# Get your JWT token (from login response or browser)
TOKEN="your-jwt-token-here"

# Test the endpoint
curl http://localhost:4000/agents \
  -H "Authorization: Bearer $TOKEN"

# Should return agents array, not 403
```

### Test 2: Check Permissions Endpoint

```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should show your roles and permissions
```

---

## 📋 Quick Fix Checklist

- [ ] Backend is running (`npm run start:dev`)
- [ ] User exists in database
- [ ] OWNER role is assigned (run `diagnose-permissions.js`)
- [ ] Logged out and back in (to get fresh JWT)
- [ ] JWT token includes permissions array
- [ ] JWT token includes `agents:read` permission
- [ ] Browser cache cleared (if needed)

---

## 🎯 Most Common Fix

**90% of the time, the issue is:**
1. Role was assigned after login
2. Old JWT token doesn't have permissions
3. Need to log out and log back in

**Quick fix:**
```bash
# 1. Assign role
node scripts/assign-role-safe.js your-email@example.com owner

# 2. In browser: Log out and log back in
# 3. Done!
```

---

## 🔧 Advanced Debugging

### Check Backend Logs

The backend should log permission errors:

```bash
cd backend
npm run start:dev

# Watch for errors like:
# [PermissionsGuard] Insufficient permissions. Missing: agents:read
```

### Enable Debug Logging

In `backend/src/modules/auth/guards/permissions.guard.ts`, add logging:

```typescript
canActivate(context: ExecutionContext): boolean {
  const user = request.user;
  
  // Add this for debugging
  console.log('User permissions:', user.permissions);
  console.log('Required permissions:', requiredPermissions);
  
  // ...
}
```

### Check RBAC Service

Test if RBAC service returns correct permissions:

```bash
node -e "
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const rbacService = app.get('RbacService');
  
  const perms = await rbacService.getUserPermissions('YOUR_USER_ID', 'YOUR_ORG_ID');
  console.log('Permissions:', perms);
  
  await app.close();
})();
"
```

---

## 📚 Related Documentation

- **Role Management:** `SAFE-ROLE-MANAGEMENT.md`
- **Quick Reference:** `ROLE-MANAGEMENT-QUICK-REFERENCE.md`
- **Setup Guide:** `FIRST-TIME-SETUP-GUIDE.md`

---

## 💡 Prevention

To avoid this in the future:

1. **Always assign roles immediately** after user creation
2. **Document role assignments** in your setup process
3. **Include role assignment** in user registration flow
4. **Test with new users** regularly

---

## ❓ Still Not Working?

1. Run the diagnostic script: `node scripts/diagnose-permissions.js your-email@example.com`
2. Check the output carefully
3. Verify JWT token payload
4. Check backend logs for specific error messages
5. Ensure you logged out and back in after assigning role

---

**Most likely fix: Log out and log back in to get fresh JWT token with permissions!** 🔑
