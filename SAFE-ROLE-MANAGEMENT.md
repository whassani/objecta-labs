# Safe Role Management Guide

## Overview

This guide explains the **safe** approach to role management using TypeORM repositories instead of raw SQL queries. This ensures schema changes are automatically synchronized and type-safe.

## The Problem with Raw SQL Scripts

❌ **Old Approach** (Risky):
```typescript
// Direct SQL queries in scripts
await pool.query(`INSERT INTO user_role_assignments ...`);
```

**Issues:**
- Scripts break when entity schemas change
- No type safety
- Column names can get out of sync
- Difficult to maintain

## The Safe Solution

✅ **New Approach** (Safe):
```typescript
// Using TypeORM repositories
await roleAssignmentService.assignRole(userId, roleId, organizationId);
```

**Benefits:**
- ✅ Always uses current entity definitions
- ✅ Type-safe operations
- ✅ Automatic schema synchronization
- ✅ Validates relationships
- ✅ Better error messages

---

## Architecture

### 1. RoleAssignmentService

**Location:** `backend/src/modules/auth/services/role-assignment.service.ts`

A reusable service that provides type-safe role management operations:

```typescript
export class RoleAssignmentService {
  // Assign a role to a user
  async assignRole(userId: string, roleId: string, organizationId?: string)
  
  // Remove a role from a user
  async removeRole(userId: string, roleId: string, organizationId?: string)
  
  // Check if user has a role
  async hasRole(userId: string, roleName: string, organizationId?: string)
  
  // Get all roles for a user
  async getUserRoles(userId: string, organizationId?: string)
  
  // Get all permissions for a user
  async getUserPermissions(userId: string, organizationId?: string)
}
```

### 2. Safe Scripts

**Location:** `backend/scripts/`

Scripts that use the service instead of raw SQL:

- `assign-role-safe.js` - Assign roles safely (JavaScript)
- `check-permissions-safe.js` - Check user permissions safely (JavaScript)

---

## Usage

**Prerequisites:** Make sure the backend is built first:
```bash
cd backend
npm run build
```

### 1. Assign a Role to a User

```bash
# Using the safe script
node backend/scripts/assign-role-safe.js <user-email> <role-name> [organization-name]

# Examples:
node backend/scripts/assign-role-safe.js admin@example.com owner
node backend/scripts/assign-role-safe.js user@acme.com admin "Acme Corp"
node backend/scripts/assign-role-safe.js dev@test.com member "Test Org"
```

**What it does:**
1. ✅ Validates user exists
2. ✅ Validates role exists
3. ✅ Validates organization (if specified)
4. ✅ Checks for duplicate assignments
5. ✅ Creates the role assignment
6. ✅ Shows confirmation with all details

### 2. Check User Permissions

```bash
# Using the safe script
node backend/scripts/check-permissions-safe.js <user-email> [organization-name]

# Examples:
node backend/scripts/check-permissions-safe.js admin@example.com
node backend/scripts/check-permissions-safe.js user@acme.com "Acme Corp"
```

**What it shows:**
- User details
- All assigned roles
- All permissions
- Organization context

### 3. Using in Your Code

```typescript
import { RoleAssignmentService } from './modules/auth/services/role-assignment.service';

// In your service or controller
constructor(
  private readonly roleAssignmentService: RoleAssignmentService,
) {}

// Assign a role
await this.roleAssignmentService.assignRole(
  userId,
  roleId,
  organizationId // optional
);

// Check permissions
const permissions = await this.roleAssignmentService.getUserPermissions(
  userId,
  organizationId
);

// Check if user has specific role
const isAdmin = await this.roleAssignmentService.hasRole(
  userId,
  'ADMIN',
  organizationId
);
```

---

## Available Roles

| Role | Description | Default Permissions |
|------|-------------|---------------------|
| `OWNER` | Organization owner | All permissions |
| `ADMIN` | Administrator | Most permissions except billing |
| `MEMBER` | Regular member | Basic access |
| `VIEWER` | Read-only access | View-only permissions |
| `PLATFORM_ADMIN` | Platform-wide admin | System administration |

---

## Common Operations

### Create Admin User with Owner Role

```bash
# 1. Create user (if not exists)
# Via UI or API: POST /auth/register

# 2. Assign OWNER role
node backend/scripts/assign-role-safe.js admin@example.com owner
```

### Assign Organization-Specific Role

```bash
# User is admin in "Acme Corp" organization
node backend/scripts/assign-role-safe.js user@acme.com admin "Acme Corp"
```

### Verify User Permissions

```bash
# Check what the user can do
node backend/scripts/check-permissions-safe.js user@acme.com "Acme Corp"
```

---

## Migration from Old Scripts

If you have old scripts using raw SQL:

### Before (Unsafe):
```typescript
await pool.query(`
  INSERT INTO user_role_assignments (user_id, role_id, organization_id)
  VALUES ($1, $2, $3)
`, [userId, roleId, orgId]);
```

### After (Safe):
```typescript
await roleAssignmentService.assignRole(userId, roleId, orgId);
```

---

## Troubleshooting

### Issue: "User not found"
**Solution:** Make sure the user email is correct and the user exists in the database.

```bash
# Check if user exists
psql $DATABASE_URL -c "SELECT id, email, full_name FROM users WHERE email = 'user@example.com';"
```

### Issue: "Role not found"
**Solution:** Use one of the predefined roles: OWNER, ADMIN, MEMBER, VIEWER, PLATFORM_ADMIN

```bash
# List all available roles
psql $DATABASE_URL -c "SELECT id, name, description FROM roles;"
```

### Issue: "Organization not found"
**Solution:** Check the organization name spelling or omit for global roles.

```bash
# List all organizations
psql $DATABASE_URL -c "SELECT id, name FROM organizations;"
```

### Issue: "User already has this role"
**Result:** The script will skip and show a warning. This is safe.

---

## Benefits Summary

### Type Safety
- ✅ TypeScript validates all operations
- ✅ Autocomplete in IDEs
- ✅ Compile-time error checking

### Schema Synchronization
- ✅ Always uses current entity definitions
- ✅ Column name changes propagate automatically
- ✅ Relationship changes are handled

### Better Error Messages
- ✅ Clear validation errors
- ✅ Descriptive failure messages
- ✅ Helpful suggestions

### Maintainability
- ✅ Single source of truth (entities)
- ✅ Easier to test
- ✅ Consistent across codebase

---

## Best Practices

1. **Always use the service** - Don't write raw SQL for role operations
2. **Use scripts for admin tasks** - The safe scripts are perfect for one-off operations
3. **Use the service in code** - Import and inject RoleAssignmentService in your modules
4. **Test with the service** - Write tests using the service, not raw queries
5. **Keep entities updated** - If you change entity definitions, everything stays in sync

---

## Related Files

- **Service:** `backend/src/modules/auth/services/role-assignment.service.ts`
- **Scripts:** `backend/scripts/assign-role-safe.js`, `backend/scripts/check-permissions-safe.js`
- **Entities:** `backend/src/modules/auth/entities/`
- **Old Scripts (deprecated):** `backend/scripts/assign-role.js` (old version), `backend/scripts/check-user-permissions.js` (old version)

---

## Next Steps

1. ✅ RoleAssignmentService is now available in AuthModule
2. ✅ Safe scripts are ready to use
3. 📝 Consider deprecating old SQL-based scripts
4. 📝 Update any custom scripts to use the service
5. 📝 Add tests for role assignment operations

---

**Need help?** Check the inline documentation in the service file or run scripts with invalid parameters to see usage help.
