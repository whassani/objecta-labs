# JavaScript Scripts Migration - Complete

## Overview

✅ Successfully converted TypeScript scripts to JavaScript for easier execution without ts-node dependency.

---

## Changes Made

### 1. Converted Scripts to JavaScript

**Old (TypeScript):**
- ❌ `backend/scripts/assign-role-safe.ts` (deleted)
- ❌ `backend/scripts/check-permissions-safe.ts` (deleted)

**New (JavaScript):**
- ✅ `backend/scripts/assign-role-safe.js`
- ✅ `backend/scripts/check-permissions-safe.js`

### 2. Benefits of JavaScript Version

#### Before (TypeScript):
```bash
# Required ts-node
npx ts-node backend/scripts/assign-role-safe.ts admin@example.com owner
```

**Issues:**
- ⚠️ Requires ts-node installation
- ⚠️ Slower execution (compiles on-the-fly)
- ⚠️ Extra dependency

#### After (JavaScript):
```bash
# Just needs Node.js (after building)
node backend/scripts/assign-role-safe.js admin@example.com owner
```

**Benefits:**
- ✅ No ts-node required
- ✅ Faster execution (uses pre-compiled code)
- ✅ Simpler dependency chain
- ✅ Works in production environments

---

## How It Works

### Architecture

```
JavaScript Script
    ↓
Requires compiled modules from dist/src/
    ↓
Uses TypeORM repositories (type-safe)
    ↓
Database operations
```

### Build Process

1. **TypeScript source** → Compiled to `dist/src/`
2. **JavaScript scripts** → Require from `dist/src/`
3. **Type safety** → Maintained through compiled code

---

## Usage

### Prerequisites

Build the backend first (only needed once, or after code changes):

```bash
cd backend
npm run build
```

### Assign Role Script

```bash
# Show help
node backend/scripts/assign-role-safe.js

# Assign global role
node backend/scripts/assign-role-safe.js admin@example.com owner

# Assign organization-specific role
node backend/scripts/assign-role-safe.js user@acme.com admin "Acme Corp"
```

**Output:**
```
ℹ️  Starting role assignment process...
ℹ️  User: admin@example.com
ℹ️  Role: OWNER

ℹ️  Looking up user...
✅ User found: Admin User (123e4567-e89b-12d3-a456-426614174000)

ℹ️  Looking up role...
✅ Role found: OWNER (Level: 100)

ℹ️  Assigning role...

✅ Role assigned successfully!

Assignment Details:
  User:         admin@example.com
  Role:         OWNER (Level: 100)
  Organization: Global
  Granted At:   2024-01-15T10:30:00.000Z

✅ ✨ Done!
```

### Check Permissions Script

```bash
# Show help
node backend/scripts/check-permissions-safe.js

# Check user permissions
node backend/scripts/check-permissions-safe.js admin@example.com

# Check organization-specific permissions
node backend/scripts/check-permissions-safe.js user@acme.com "Acme Corp"
```

**Output:**
```
🔍 Checking permissions for: admin@example.com

✅ User found:
   ID: 123e4567-e89b-12d3-a456-426614174000
   Email: admin@example.com
   Name: Admin User
   Organization: Acme Corp

📋 Assigned Roles (1):

   🔒 OWNER
      Description: Organization owner with full permissions
      Level: 100
      Granted: 2024-01-15

🔑 Total Unique Permissions: 50

📋 Permissions by Resource:

   agents:
      create, delete, execute, read, update

   workflows:
      create, delete, execute, read, update

   ...

✅ ✨ Done!
```

---

## Technical Details

### Path Resolution

The scripts use the correct path to compiled modules:

```javascript
// Correct path after NestJS build
const { AppModule } = require('../dist/src/app.module');
const { RoleAssignmentService } = require('../dist/src/modules/auth/services/role-assignment.service');
```

### Error Handling

Both scripts include:
- ✅ Colored output for better readability
- ✅ Clear error messages
- ✅ Usage help when arguments are missing
- ✅ Graceful shutdown

### Features

1. **Type Safety**: Scripts use compiled TypeScript code, maintaining type safety
2. **Validation**: All inputs are validated before operations
3. **Pretty Output**: ANSI colors for better UX
4. **Help Text**: Automatic usage information
5. **Error Recovery**: Clean error messages and exit codes

---

## Migration Path

### For Developers

**Before:**
```bash
# Old way
npx ts-node backend/scripts/assign-role-safe.ts user@example.com admin
```

**After:**
```bash
# New way - build once
cd backend && npm run build

# Then use JavaScript scripts
node backend/scripts/assign-role-safe.js user@example.com admin
```

### For CI/CD

**Before:**
```yaml
- name: Assign role
  run: npx ts-node backend/scripts/assign-role-safe.ts admin@example.com owner
```

**After:**
```yaml
- name: Build backend
  run: cd backend && npm run build

- name: Assign role
  run: node backend/scripts/assign-role-safe.js admin@example.com owner
```

---

## Advantages Over TypeScript Scripts

| Feature | TypeScript (.ts) | JavaScript (.js) |
|---------|------------------|------------------|
| **Requires ts-node** | ✅ Yes | ❌ No |
| **Execution Speed** | Slower (compile on-the-fly) | Faster (pre-compiled) |
| **Production Ready** | ⚠️ Needs extra deps | ✅ Yes |
| **Build Required** | ❌ No | ✅ Yes (one-time) |
| **Type Safety** | ✅ Direct | ✅ Via compiled code |
| **Simplicity** | ⚠️ Extra tooling | ✅ Plain Node.js |

---

## When to Rebuild

You need to rebuild the backend when:

1. ✏️ Entity definitions change
2. ✏️ Service code changes
3. ✏️ Module configurations change
4. ✏️ Any TypeScript code changes

**Quick rebuild:**
```bash
cd backend && npm run build
```

**During development:**
```bash
# Watch mode automatically rebuilds
cd backend && npm run start:dev
```

---

## Troubleshooting

### Issue: "Cannot find module '../dist/src/app.module'"

**Solution:** Build the backend first
```bash
cd backend && npm run build
```

### Issue: "User not found"

**Solution:** Check the email address and verify user exists
```bash
# Verify user exists in database
psql $DATABASE_URL -c "SELECT id, email FROM users WHERE email = 'user@example.com';"
```

### Issue: "Role not found"

**Solution:** Use one of the predefined roles (case-insensitive)
- `owner` or `OWNER`
- `admin` or `ADMIN`
- `member` or `MEMBER`
- `viewer` or `VIEWER`
- `platform_admin` or `PLATFORM_ADMIN`

### Issue: Scripts show old behavior after code changes

**Solution:** Rebuild to pick up changes
```bash
cd backend && npm run build
```

---

## Files Overview

### Created
- ✅ `backend/scripts/assign-role-safe.js` - JavaScript role assignment script
- ✅ `backend/scripts/check-permissions-safe.js` - JavaScript permissions check script
- ✅ `JAVASCRIPT-SCRIPTS-MIGRATION.md` - This document

### Deleted
- ❌ `backend/scripts/assign-role-safe.ts` - Old TypeScript version
- ❌ `backend/scripts/check-permissions-safe.ts` - Old TypeScript version

### Updated
- ✅ `SAFE-ROLE-MANAGEMENT.md` - Updated with JavaScript examples
- ✅ `RESOURCE-SYNCHRONIZATION-IMPROVEMENT.md` - Updated with JavaScript examples

### Unchanged (Original deprecated scripts)
- ⚠️ `backend/scripts/assign-role.js` - Old raw SQL version (deprecated)
- ⚠️ `backend/scripts/check-user-permissions.js` - Old raw SQL version (deprecated)

---

## Best Practices

### ✅ DO:
1. **Build before running** - Always ensure `npm run build` has been run
2. **Use these scripts** - They're safer than raw SQL
3. **Check help first** - Run without arguments to see usage
4. **Rebuild after changes** - If you modify entity/service code

### ❌ DON'T:
1. **Don't use ts-node** - The JavaScript versions are better
2. **Don't use old scripts** - The raw SQL versions are deprecated
3. **Don't skip building** - Scripts require compiled code
4. **Don't manually edit dist/** - Always rebuild from source

---

## Summary

✅ **Scripts converted from TypeScript to JavaScript**
- No more ts-node dependency
- Faster execution
- Production-ready
- Maintains type safety via compiled code

✅ **Documentation updated**
- All guides now show JavaScript examples
- Build prerequisites clearly documented
- Migration path explained

✅ **Better developer experience**
- Simple `node` command
- Clear colored output
- Helpful error messages

---

## Related Documentation

- **Main Guide:** `SAFE-ROLE-MANAGEMENT.md`
- **Improvement Details:** `RESOURCE-SYNCHRONIZATION-IMPROVEMENT.md`
- **Scripts:** `backend/scripts/assign-role-safe.js`, `backend/scripts/check-permissions-safe.js`

---

**Migration Complete!** 🎉 The scripts are now easier to use and production-ready.
