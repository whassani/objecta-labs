# Admin Login - Dual Table Support 🔐

## Issue

Admin login was only checking the `users` table, but admins can be in either:
1. **`admin_users` table** - Dedicated admin accounts (Method 2)
2. **`users` table** - Regular users with `isAdmin = true` (Method 1)

## Solution

Updated `AdminAuthService` to check **both tables** in priority order:

### Priority 1: Check `admin_users` table
- For dedicated admin accounts created via Method 2
- These admins are NOT associated with any organization

### Priority 2: Check `users` table
- For regular users with `isAdmin = true`
- These admins belong to an organization

---

## How It Works Now

```typescript
async validateAdmin(email: string, password: string) {
  // 1. Try admin_users table first
  const adminUser = await adminUserRepository.findOne({ email });
  if (adminUser) {
    // Validate password and return admin
  }

  // 2. Try users table with isAdmin flag
  const user = await userRepository.findOne({ email });
  if (user && user.isAdmin) {
    // Validate password and return admin
  }

  // 3. Not found in either
  throw new UnauthorizedException('Admin account not found');
}
```

---

## Which Method Are You Using?

### Method 1: Users with Admin Flag
**Created with:** `UPDATE users SET "isAdmin" = true WHERE email = '...'`

**Table:** `users`  
**Access:** Both user dashboard AND admin panel  
**Organization:** Has an organization  

**How to create:**
```bash
cd backend
bash scripts/create-admin-simple.sh
# This updates existing user
```

### Method 2: Dedicated Admin Accounts
**Created with:** `INSERT INTO admin_users (...) VALUES (...)`

**Table:** `admin_users`  
**Access:** Admin panel ONLY  
**Organization:** No organization affiliation  

**How to create:**
```bash
cd backend
bash scripts/create-admin.sh
# Select Method 2 when prompted
```

---

## Testing

### Test Method 1 (users table)
```sql
-- Check if user exists with admin flag
SELECT email, "isAdmin", "adminRole" FROM users WHERE email = 'your@email.com';

-- If not admin, grant access
UPDATE users SET "isAdmin" = true, "adminRole" = 'super_admin' WHERE email = 'your@email.com';
```

### Test Method 2 (admin_users table)
```sql
-- Check if admin user exists
SELECT email, admin_role, is_active FROM admin_users WHERE email = 'admin@example.com';

-- If doesn't exist, create one
INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)
VALUES (
  'admin@example.com',
  '$2b$10$YOUR_HASH_HERE',
  'Admin User',
  'super_admin',
  true
);
```

---

## Quick Fix for Your Issue

Since you created an admin in `admin_users` table, the login should now work!

### 1. Rebuild Backend
```bash
cd backend
npm run build
npm run start:dev
```

### 2. Test Login
```bash
# Login with your admin_users credentials
curl -X POST http://localhost:3001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

### 3. Or Use Frontend
Navigate to: `http://localhost:3000/admin/login`

---

## Verification

### Check Which Table Your Admin Is In

```sql
-- Method 1: Check users table
SELECT email, "isAdmin", "adminRole" FROM users WHERE email = 'your@email.com';

-- Method 2: Check admin_users table
SELECT email, admin_role, is_active FROM admin_users WHERE email = 'your@email.com';
```

---

## Recommendation

For most use cases, **use Method 1** (users with admin flag):

### Why Method 1?
- ✅ Simpler to set up
- ✅ Users can access both dashboards
- ✅ Easier to manage
- ✅ Works with existing users

**Use Method 2 only if:**
- You need admins completely separate from organizations
- You're building a multi-tenant platform with support staff
- You want maximum security isolation

---

## Files Updated

✅ `backend/src/modules/admin/admin-auth.service.ts`
- Now checks both `admin_users` and `users` tables
- Priority: admin_users first, then users
- Proper error handling for both cases

---

## Summary

✅ **Fixed:** Admin login now supports both tables  
✅ **Priority:** Checks `admin_users` first, then `users`  
✅ **Backward Compatible:** Existing admins still work  

**Your admin_users account should work now after rebuilding the backend!** 🎉
