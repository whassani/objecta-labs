# 🎯 Role Management Scripts

## 📋 Overview

Three powerful scripts to manage user roles:
1. **`assign-role.js`** - Assign a role to a user
2. **`remove-role.js`** - Remove a role from a user
3. **`check-user-permissions.js`** - Check what roles/permissions a user has

---

## 🚀 Quick Start

### 1. Assign a Role

```bash
cd backend

# Command line mode
node scripts/assign-role.js user@example.com admin

# Or interactive mode (asks for email and role)
node scripts/assign-role.js
```

### 2. Check Permissions

```bash
node scripts/check-user-permissions.js user@example.com
```

### 3. Remove a Role

```bash
node scripts/remove-role.js user@example.com admin
```

---

## 📖 Script Details

### `assign-role.js` - Assign Role to User

**Purpose**: Assign a system or custom role to a user

**Usage**:
```bash
node scripts/assign-role.js <email> <role>
```

**Examples**:
```bash
# Assign admin role
node scripts/assign-role.js john@example.com admin

# Assign owner role
node scripts/assign-role.js sarah@example.com owner

# Assign member role
node scripts/assign-role.js bob@example.com member

# Interactive mode (no arguments)
node scripts/assign-role.js
```

**Features**:
- ✅ Validates user exists
- ✅ Validates role exists
- ✅ Checks for existing assignment
- ✅ Shows available roles if role not found
- ✅ Displays permission summary after assignment
- ✅ Interactive mode with prompts
- ✅ Color-coded output

**Output Example**:
```
═══════════════════════════════════════════════════
           ASSIGN ROLE TO USER                    
═══════════════════════════════════════════════════

📧 User Email: john@example.com
👤 Role: admin

🔍 Checking if role exists...
✅ Role found: Administrator (Level 80, 44 permissions)

🔍 Checking if user exists...
✅ User found: john@example.com
   Organization ID: org-123

✨ Assigning role to user...

═══════════════════════════════════════════════════
             ✅ SUCCESS!                          
═══════════════════════════════════════════════════

✅ Role "Administrator" assigned to john@example.com

📊 Updated Role Summary:

   Role                Level  Permissions
   ──────────────────────────────────────
   Administrator       80     44

🔑 Total Permissions: 44

📋 Permissions by Resource:
   agents: read, create, update, delete
   workflows: read, create, update, execute
   ...

⚡ Next Steps:

   1. User should logout and login again to refresh JWT token
   2. Test access to protected resources
   3. Verify permissions in UI
```

---

### `check-user-permissions.js` - Check User Permissions

**Purpose**: Diagnose what roles and permissions a user has

**Usage**:
```bash
node scripts/check-user-permissions.js <email>
```

**Example**:
```bash
node scripts/check-user-permissions.js john@example.com
```

**Features**:
- ✅ Shows user info
- ✅ Lists all assigned roles
- ✅ Shows permission count per role
- ✅ Lists all permissions grouped by resource
- ✅ Checks key permissions (agents:read, etc.)
- ✅ Provides solutions if no roles found

**Output Example**:
```
🔍 Checking permissions for: john@example.com

✅ User found:
   ID: user-123
   Email: john@example.com
   Organization ID: org-abc

📋 Assigned Roles (2):

   🔒 Administrator (admin)
      Level: 80
      Permissions: 44
      Granted: 2024-01-15

   ✏️ Custom Developer (developer)
      Level: 60
      Permissions: 20
      Granted: 2024-01-20

🔑 All Permissions (64):

   agents:
      read, create, update, delete
   workflows:
      read, create, update, execute
   ...

🎯 Key Permissions Check:

   agents:read       ✅ YES
   agents:create     ✅ YES
   workflows:read    ✅ YES
   users:read        ✅ YES
   users:manage      ❌ NO
```

---

### `remove-role.js` - Remove Role from User

**Purpose**: Remove a role assignment from a user

**Usage**:
```bash
node scripts/remove-role.js <email> <role>
```

**Examples**:
```bash
# Remove admin role
node scripts/remove-role.js john@example.com admin

# Remove custom role
node scripts/remove-role.js sarah@example.com developer
```

**Features**:
- ✅ Validates user and role exist
- ✅ Checks if assignment exists
- ✅ Shows remaining roles after removal
- ✅ Warns if user has no roles left

**Output Example**:
```
═══════════════════════════════════════════════════
           REMOVE ROLE FROM USER                  
═══════════════════════════════════════════════════

📧 User Email: john@example.com
👤 Role to Remove: admin

✅ User found: john@example.com

✅ Role removed successfully!

📋 Remaining roles:
   • Member (Level 50)

💡 User should logout and login to refresh JWT token
```

---

## 🎯 Common Workflows

### Workflow 1: Setup New Admin

```bash
# 1. Check current state
node scripts/check-user-permissions.js admin@example.com

# 2. Assign owner role
node scripts/assign-role.js admin@example.com owner

# 3. Verify
node scripts/check-user-permissions.js admin@example.com
```

### Workflow 2: Fix 403 Errors

```bash
# 1. Diagnose the issue
node scripts/check-user-permissions.js user@example.com

# 2. If no roles, assign appropriate role
node scripts/assign-role.js user@example.com member

# 3. Verify assignment
node scripts/check-user-permissions.js user@example.com

# 4. User: Logout and login in browser
```

### Workflow 3: Change User Role

```bash
# 1. Remove old role
node scripts/remove-role.js user@example.com member

# 2. Assign new role
node scripts/assign-role.js user@example.com admin

# 3. Verify
node scripts/check-user-permissions.js user@example.com
```

### Workflow 4: Assign Multiple Roles

```bash
# Users can have multiple roles!
node scripts/assign-role.js user@example.com admin
node scripts/assign-role.js user@example.com developer

# Check combined permissions
node scripts/check-user-permissions.js user@example.com
```

---

## 📊 Available Roles

### System Roles (Cannot be deleted)

| Role | Level | Permissions | Description |
|------|-------|-------------|-------------|
| **owner** | 100 | 62 | Full control including billing |
| **admin** | 80 | 44 | Organization management |
| **member** | 50 | 28 | Content creation (default) |
| **viewer** | 20 | 9 | Read-only access |

### Custom Roles

You can also assign custom roles you've created:
```bash
# List all roles (including custom)
psql $DATABASE_URL -c "SELECT name, \"displayName\", level FROM roles ORDER BY level DESC;"

# Assign custom role
node scripts/assign-role.js user@example.com developer
```

---

## ⚠️ Important Notes

### 1. JWT Token Refresh Required
After assigning/removing roles, users **must logout and login** to refresh their JWT token with new permissions.

### 2. Multiple Roles
Users can have multiple roles. The system combines permissions from all assigned roles.

### 3. Organization Scoping
Roles are scoped to organizations. A user can have different roles in different organizations.

### 4. No Roles = No Access
If a user has no roles assigned, they will get 403 Forbidden errors on all protected endpoints.

---

## 🔧 Troubleshooting

### Issue: "User not found"
**Solution**: Check available users
```bash
psql $DATABASE_URL -c "SELECT email FROM users LIMIT 10;"
```

### Issue: "Role not found"
**Solution**: Check available roles
```bash
psql $DATABASE_URL -c "SELECT name, \"displayName\" FROM roles;"
```

### Issue: "Database connection failed"
**Solution**: Check .env configuration
```bash
# Verify database credentials in backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=objecta-labs
```

### Issue: "User already has this role"
**Solution**: This is not an error - the role is already assigned. Use `check-user-permissions.js` to see all roles.

---

## 🎨 Script Features

### Color-Coded Output
- 🔵 **Blue**: Headers and info
- 🟢 **Green**: Success messages
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors
- 🔷 **Cyan**: Data and details

### Interactive Mode
When called without arguments, `assign-role.js` enters interactive mode:
- Shows available roles
- Prompts for email
- Prompts for role name
- Validates inputs
- Provides feedback

### Detailed Feedback
All scripts provide:
- ✅ Step-by-step progress
- ✅ Validation results
- ✅ Clear error messages
- ✅ Next steps guidance
- ✅ Permission summaries

---

## 📚 Related Documentation

- **Database Schema**: `DATABASE-RBAC-SCHEMA-EXPLAINED.md`
- **Troubleshooting**: `TROUBLESHOOT-403-ERRORS.md`
- **Role Setup**: `ROLES-SETUP-GUIDE.md`
- **Permission Management**: `PERMISSION-MANAGEMENT-QUICK-START.md`

---

## 🎯 Quick Reference

```bash
# Assign role (command line)
node scripts/assign-role.js EMAIL ROLE

# Assign role (interactive)
node scripts/assign-role.js

# Check permissions
node scripts/check-user-permissions.js EMAIL

# Remove role
node scripts/remove-role.js EMAIL ROLE

# Available roles
owner, admin, member, viewer
```

---

## ✅ Summary

**Three powerful scripts for role management**:
1. ✅ **assign-role.js** - Quick and easy role assignment
2. ✅ **check-user-permissions.js** - Comprehensive permission diagnosis
3. ✅ **remove-role.js** - Clean role removal

**Features**:
- ✅ Interactive and command-line modes
- ✅ Comprehensive validation
- ✅ Color-coded output
- ✅ Detailed feedback
- ✅ Next steps guidance

**Use these scripts to**:
- Fix 403 Forbidden errors
- Setup new admin accounts
- Manage team member permissions
- Diagnose permission issues
- Audit user access

---

Ready to use! Start with:
```bash
cd backend
node scripts/assign-role.js YOUR_EMAIL@example.com admin
```
