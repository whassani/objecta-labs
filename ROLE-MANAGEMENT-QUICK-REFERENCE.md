# Role Management Quick Reference

> **One-page cheat sheet for safe role management**

---

## 🚀 Prerequisites

```bash
cd backend && npm run build
```

---

## 📝 Assign Role

```bash
node backend/scripts/assign-role-safe.js <email> <role> [org-name]
```

### Examples
```bash
# Global owner
node backend/scripts/assign-role-safe.js admin@example.com owner

# Organization admin
node backend/scripts/assign-role-safe.js user@company.com admin "Company Name"

# Regular member
node backend/scripts/assign-role-safe.js dev@startup.com member "My Startup"
```

---

## 🔍 Check Permissions

```bash
node backend/scripts/check-permissions-safe.js <email> [org-name]
```

### Examples
```bash
# Check global permissions
node backend/scripts/check-permissions-safe.js admin@example.com

# Check organization permissions
node backend/scripts/check-permissions-safe.js user@company.com "Company Name"
```

---

## 👥 Available Roles

| Role | Command | Level | Use Case |
|------|---------|-------|----------|
| Owner | `owner` | 100 | Full control |
| Admin | `admin` | 80 | Most permissions |
| Member | `member` | 50 | Basic access |
| Viewer | `viewer` | 30 | Read-only |
| Platform Admin | `platform_admin` | 100 | System admin |

---

## 💻 Use in Code

### Import
```typescript
import { RoleAssignmentService } from './modules/auth/services/role-assignment.service';

constructor(
  private readonly roleAssignmentService: RoleAssignmentService,
) {}
```

### Assign Role
```typescript
await this.roleAssignmentService.assignRole(userId, roleId, orgId);
```

### Check Permission
```typescript
const permissions = await this.roleAssignmentService.getUserPermissions(userId, orgId);
const canExecute = permissions.includes('workflows:execute');
```

### Check Role
```typescript
const isAdmin = await this.roleAssignmentService.hasRole(userId, 'ADMIN', orgId);
```

---

## 🔧 Common Tasks

### Create Admin User
```bash
# 1. Register via UI/API
# 2. Assign role:
node backend/scripts/assign-role-safe.js admin@example.com owner
```

### Grant Organization Access
```bash
node backend/scripts/assign-role-safe.js user@company.com admin "Company Name"
```

### Verify Access
```bash
node backend/scripts/check-permissions-safe.js user@company.com "Company Name"
```

---

## 🚨 Troubleshooting

| Error | Solution |
|-------|----------|
| `Cannot find module` | Run `npm run build` |
| `User not found` | Check email spelling |
| `Role not found` | Use: owner, admin, member, viewer, platform_admin |
| `Organization not found` | Check org name (case-sensitive) |

---

## 📚 Full Documentation

- **Complete Guide:** `SAFE-ROLE-MANAGEMENT.md`
- **Technical Details:** `RESOURCE-SYNCHRONIZATION-IMPROVEMENT.md`
- **Summary:** `ROLE-MANAGEMENT-COMPLETE-SUMMARY.md`

---

## ✅ Key Points

- ✅ Build backend first: `npm run build`
- ✅ Role names are case-insensitive
- ✅ Scripts use TypeORM (not raw SQL)
- ✅ Type-safe operations
- ✅ Automatic schema sync

---

**Need help?** Run scripts without arguments to see usage information.
