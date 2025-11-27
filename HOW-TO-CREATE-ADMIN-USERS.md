# How to Create Admin Users 👨‍💼

There are **two ways** to create admin users in this system:

## 📋 Table of Contents
1. [Method 1: Grant Admin Access to Existing User](#method-1-grant-admin-access-to-existing-user) ⭐ **Recommended**
2. [Method 2: Create Dedicated Admin Account](#method-2-create-dedicated-admin-account)
3. [Comparison of Methods](#comparison-of-methods)
4. [Managing Admin Roles](#managing-admin-roles)
5. [Troubleshooting](#troubleshooting)

---

## Method 1: Grant Admin Access to Existing User

### ✅ Best for: Making existing users administrators

This method gives admin privileges to a regular user account. The user can access both the regular dashboard AND the admin panel.

### Quick Method: Use the Script ⭐ **RECOMMENDED**

```bash
cd backend
bash scripts/create-admin-simple.sh
```

This script will:
- ✅ Auto-detect your database connection
- ✅ Prompt for email and password
- ✅ Execute SQL automatically
- ✅ Verify the admin was created
- ✅ Show you next steps

**📖 See [ADMIN-SCRIPTS-GUIDE.md](./ADMIN-SCRIPTS-GUIDE.md) for detailed script documentation**

### Manual Method: SQL Commands

#### Step 1: Connect to Database

```bash
# Using Docker Compose
docker-compose exec postgres psql -U postgres -d objecta-labs

# OR using psql directly
psql -h localhost -U postgres -d objecta-labs
```

#### Step 2: Grant Admin Access

```sql
-- Grant admin access to an existing user
UPDATE users 
SET "isAdmin" = true, "adminRole" = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, "fullName", "isAdmin", "adminRole" 
FROM users 
WHERE email = 'your-email@example.com';
```

### Step 3: Logout and Login

**Important:** You MUST logout and login again to refresh the JWT token with admin privileges.

1. Logout from the application
2. Login with the same email
3. Navigate to `http://localhost:3000/admin/dashboard`

### Available Admin Roles

```sql
-- Super Admin (full access)
UPDATE users SET "adminRole" = 'super_admin' WHERE email = 'user@example.com';

-- Regular Admin (most features)
UPDATE users SET "adminRole" = 'admin' WHERE email = 'user@example.com';

-- Support Admin (tickets only)
UPDATE users SET "adminRole" = 'support' WHERE email = 'user@example.com';
```

### View All Admin Users

```sql
-- List all users with admin access
SELECT 
  id, 
  email, 
  "fullName", 
  "adminRole", 
  "isAdmin",
  "createdAt"
FROM users 
WHERE "isAdmin" = true
ORDER BY "createdAt" DESC;
```

### Revoke Admin Access

```sql
-- Remove admin privileges
UPDATE users 
SET "isAdmin" = false, "adminRole" = NULL 
WHERE email = 'user@example.com';
```

---

## Method 2: Create Dedicated Admin Account

### ✅ Best for: Separate admin-only accounts (not connected to any organization)

This method creates a dedicated admin account in the `admin_users` table. These admins are completely separate from regular users.

### Step 1: Connect to Database

```bash
# Using Docker Compose
docker-compose exec postgres psql -U postgres -d objecta-labs

# OR using psql directly
psql -h localhost -U postgres -d objecta-labs
```

### Step 2: Create Admin User

```sql
-- Create a dedicated admin user
-- Note: You need to hash the password first (see below)
INSERT INTO admin_users (
  email, 
  password_hash, 
  full_name, 
  admin_role, 
  is_active
) VALUES (
  'admin@objecta-labs.com',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',  -- See password hashing below
  'Admin Name',
  'super_admin',  -- super_admin, admin, or support
  true
);
```

### Step 3: Hash the Password

You need to generate a bcrypt hash for the password. Here are several methods:

#### Option A: Using Node.js (Recommended)

```bash
# In the backend directory
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(console.log);"
```

#### Option B: Using Online Tool

1. Go to: https://bcrypt-generator.com/
2. Enter your password
3. Set rounds to: **10**
4. Copy the generated hash
5. Use in the SQL INSERT statement above

#### Option C: Using Backend Script

Create a script: `backend/scripts/hash-password.js`

```javascript
const bcrypt = require('bcrypt');

const password = process.argv[2];
if (!password) {
  console.log('Usage: node hash-password.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('Password hash:', hash);
  console.log('\nSQL command:');
  console.log(`INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)`);
  console.log(`VALUES ('admin@example.com', '${hash}', 'Admin Name', 'super_admin', true);`);
});
```

Run it:
```bash
cd backend
node scripts/hash-password.js yourpassword
```

### Step 4: Verify Admin User Created

```sql
-- List all admin users
SELECT 
  id, 
  email, 
  full_name, 
  admin_role, 
  is_active,
  created_at
FROM admin_users
ORDER BY created_at DESC;
```

### Default Admin Account

⚠️ **Security Warning:** The migration creates a default admin account. **CHANGE THIS PASSWORD IMMEDIATELY!**

```
Email: admin@objecta-labs.local
Password: admin123
Role: super_admin
```

To change the default password:

```sql
-- Change default admin password
UPDATE admin_users 
SET password_hash = '$2b$10$YOUR_NEW_HASH_HERE'
WHERE email = 'admin@objecta-labs.local';

-- Or delete the default account
DELETE FROM admin_users WHERE email = 'admin@objecta-labs.local';
```

---

## Comparison of Methods

| Feature | Method 1: User with Admin Flag | Method 2: Dedicated Admin Account |
|---------|-------------------------------|-----------------------------------|
| **Access** | Regular dashboard + Admin panel | Admin panel only |
| **Organization** | Belongs to an organization | No organization affiliation |
| **Login URL** | `/login` (same as users) | `/login` (same as users) |
| **Use Case** | Org owners who need admin tools | Dedicated support/admin staff |
| **Database Table** | `users` table | `admin_users` table |
| **JWT Token** | Contains `userId` + `isAdmin` | Contains `adminUserId` only |
| **Complexity** | ✅ Simple | ❌ More complex |

### Which Method Should I Use?

**Use Method 1 if:**
- ✅ You want existing users to have admin privileges
- ✅ Admins need to manage their own organization too
- ✅ You want simpler implementation
- ✅ You're just getting started

**Use Method 2 if:**
- ✅ You need dedicated admin-only accounts
- ✅ Admins should NOT be part of any organization
- ✅ You want separation between admins and regular users
- ✅ You're building an enterprise SaaS with support staff

---

## Managing Admin Roles

### Role Hierarchy

```
super_admin (highest)
    ↓
admin
    ↓
support (lowest)
```

### Role Permissions

| Permission | super_admin | admin | support |
|-----------|-------------|-------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Customers | ✅ | ✅ | ❌ |
| Suspend Accounts | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ |
| Manage Tickets | ✅ | ✅ | ✅ |
| System Settings | ✅ | ❌ | ❌ |
| Create Admins | ✅ | ❌ | ❌ |

### Change Admin Role

```sql
-- For Method 1 (users table)
UPDATE users 
SET "adminRole" = 'admin'  -- or 'super_admin', 'support'
WHERE email = 'user@example.com';

-- For Method 2 (admin_users table)
UPDATE admin_users 
SET admin_role = 'admin'  -- or 'super_admin', 'support'
WHERE email = 'admin@example.com';
```

### Deactivate Admin (Without Deleting)

```sql
-- For Method 1
UPDATE users 
SET "isAdmin" = false
WHERE email = 'user@example.com';

-- For Method 2
UPDATE admin_users 
SET is_active = false
WHERE email = 'admin@example.com';
```

---

## Complete Examples

### Example 1: Make Organization Owner an Admin

```sql
-- Find the user
SELECT id, email, "fullName" FROM users WHERE email = 'owner@company.com';

-- Grant super admin access
UPDATE users 
SET "isAdmin" = true, "adminRole" = 'super_admin' 
WHERE email = 'owner@company.com';

-- Verify
SELECT email, "isAdmin", "adminRole" FROM users WHERE email = 'owner@company.com';
```

### Example 2: Create Support Staff Admin

```bash
# 1. Generate password hash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Support123!', 10).then(console.log);"
# Output: $2b$10$abcd1234...
```

```sql
-- 2. Create support admin account
INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)
VALUES (
  'support@objecta-labs.com',
  '$2b$10$abcd1234...',  -- Use the hash from step 1
  'Support Staff',
  'support',
  true
);

-- 3. Verify
SELECT * FROM admin_users WHERE email = 'support@objecta-labs.com';
```

### Example 3: Bulk Create Multiple Admins

```sql
-- Grant admin access to multiple users at once
UPDATE users 
SET "isAdmin" = true, "adminRole" = 'admin'
WHERE email IN (
  'admin1@company.com',
  'admin2@company.com',
  'admin3@company.com'
);

-- Verify
SELECT email, "isAdmin", "adminRole" 
FROM users 
WHERE "isAdmin" = true;
```

---

## Troubleshooting

### Issue: Can't Access Admin Panel After Granting Access

**Solution:**
1. Make sure you logged out and logged back in
2. Check localStorage in browser console: `localStorage.getItem('user')`
3. Verify the JWT token includes `isAdmin: true`
4. Clear browser cache and cookies

### Issue: "Admin access required" Error

**Checklist:**
```sql
-- 1. Verify isAdmin flag is set
SELECT email, "isAdmin", "adminRole" FROM users WHERE email = 'your-email@example.com';

-- 2. Should return isAdmin = true
-- If not, run:
UPDATE users SET "isAdmin" = true, "adminRole" = 'super_admin' WHERE email = 'your-email@example.com';

-- 3. Logout and login again
```

### Issue: Password Hash Not Working (Method 2)

**Common mistakes:**
- ❌ Using plain text password instead of bcrypt hash
- ❌ Hash not starting with `$2b$10$`
- ❌ Hash copied incorrectly (missing characters)

**Solution:**
```bash
# Generate fresh hash
cd backend
npm install bcrypt  # if not installed
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword', 10).then(h => console.log('Hash:', h));"
```

### Issue: Can't Login with Dedicated Admin Account

**Possible causes:**
1. Admin authentication not implemented in backend
2. Login form doesn't check `admin_users` table
3. Need to implement separate admin login flow

**Quick fix:** Use Method 1 (user with admin flag) instead

### Issue: How to Check Which Method is Active?

```sql
-- Check if you're using Method 1 (users with admin flag)
SELECT COUNT(*) as admin_users_count 
FROM users 
WHERE "isAdmin" = true;

-- Check if you're using Method 2 (dedicated admin accounts)
SELECT COUNT(*) as dedicated_admins_count 
FROM admin_users 
WHERE is_active = true;
```

---

## Security Best Practices

### ✅ Do's

1. **Use strong passwords** for admin accounts
2. **Change default passwords** immediately
3. **Use unique admin emails** (not the same as user accounts)
4. **Regularly audit** admin access
5. **Deactivate** instead of deleting (for audit trail)
6. **Limit super_admin** role to only necessary people
7. **Review audit logs** regularly

### ❌ Don'ts

1. **Don't share** admin credentials
2. **Don't use** simple passwords like "admin123"
3. **Don't leave** default admin account active in production
4. **Don't give** everyone super_admin role
5. **Don't store** plain text passwords
6. **Don't skip** the logout/login step after granting admin access

---

## Quick Reference Commands

### Create Admin (Method 1 - Recommended)
```sql
UPDATE users SET "isAdmin" = true, "adminRole" = 'super_admin' WHERE email = 'user@example.com';
```

### List All Admins (Method 1)
```sql
SELECT email, "fullName", "adminRole", "isAdmin" FROM users WHERE "isAdmin" = true;
```

### Remove Admin Access (Method 1)
```sql
UPDATE users SET "isAdmin" = false, "adminRole" = NULL WHERE email = 'user@example.com';
```

### Create Admin (Method 2)
```bash
# Generate hash first
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('password', 10).then(console.log);"
```
```sql
INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)
VALUES ('admin@example.com', '$2b$10$...', 'Admin Name', 'super_admin', true);
```

### List All Admins (Method 2)
```sql
SELECT email, full_name, admin_role, is_active FROM admin_users WHERE is_active = true;
```

### Deactivate Admin (Method 2)
```sql
UPDATE admin_users SET is_active = false WHERE email = 'admin@example.com';
```

---

## Testing Your Admin Account

After creating an admin account:

### 1. Verify Database Entry
```sql
-- Method 1
SELECT * FROM users WHERE email = 'your-email@example.com' AND "isAdmin" = true;

-- Method 2
SELECT * FROM admin_users WHERE email = 'admin@example.com';
```

### 2. Test Login
1. Go to `http://localhost:3000/login`
2. Login with your admin credentials
3. Should be redirected to dashboard

### 3. Test Admin Access
1. Navigate to `http://localhost:3000/admin/dashboard`
2. Should see the admin panel
3. Sidebar should show admin navigation

### 4. Test API Access
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}' \
  | jq -r '.token')

# Test admin endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/admin/dashboard
```

---

## Summary

### For Quick Setup (Recommended)
Use **Method 1**: Grant admin access to existing user

```sql
UPDATE users SET "isAdmin" = true, "adminRole" = 'super_admin' WHERE email = 'your-email@example.com';
```

Then logout, login, and go to `/admin/dashboard`

### For Enterprise Setup
Use **Method 2**: Create dedicated admin accounts

1. Generate password hash
2. Insert into `admin_users` table
3. Implement admin authentication flow
4. Manage separate from regular users

---

**Questions?** Check the troubleshooting section or refer to the main admin documentation in `ADMIN-PANEL-QUICK-START.md`
