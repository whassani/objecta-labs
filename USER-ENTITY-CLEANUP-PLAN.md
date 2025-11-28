# User Entity Cleanup Plan

## 🎯 Problem Statement

The User entity has **duplicate and conflicting role management systems**:
1. ❌ Legacy `role` field (old approach)
2. ❌ `isAdmin` and `adminRole` flags (conflicting with RBAC)
3. ✅ RBAC system with `user_role_assignments` table (correct approach)

Additionally:
- ❌ Using `firstName` + `lastName` but schema has `full_name`
- ⚠️ Missing useful fields from schema (email verification, password reset)

---

## 📊 Current State Analysis

### Current User Entity Fields

```typescript
// ❌ PROBLEMS:
firstName: string;              // Should be: fullName
lastName: string;               // Should be: fullName
role: string;                   // Conflicts with RBAC
isAdmin: boolean;               // Conflicts with RBAC
adminRole: string;              // Conflicts with RBAC

// ✅ CORRECT:
id: string;
organizationId: string;
email: string;
passwordHash: string;
isActive: boolean;
createdAt: Date;
updatedAt: Date;
```

### Database Schema (from architecture/database-schema.sql)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,        -- ✅ Single field
    role VARCHAR(50) DEFAULT 'member',       -- ❌ Legacy, should use RBAC
    email_verified BOOLEAN DEFAULT FALSE,    -- ✅ Missing in entity
    verification_token VARCHAR(255),         -- ✅ Missing in entity
    reset_token VARCHAR(255),                -- ✅ Missing in entity
    reset_token_expires TIMESTAMP,           -- ✅ Missing in entity
    last_login_at TIMESTAMP,                 -- ✅ Missing in entity
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, email)
);
```

### Files Using Legacy Fields

**Using `firstName` / `lastName`:**
- `backend/src/modules/admin/user-management.service.ts` (lines 31, 114, 124, 154-155, 208-209)
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/team/team.service.ts` (lines 39, 208-209, 226)

**Using `user.role`:**
- `backend/src/modules/admin/user-management.service.ts` (lines 45, 158, 296-298)
- `backend/src/modules/team/team.service.ts` (lines 39, 211, 252, 282)
- `backend/src/modules/auth/auth.service.ts` (line: role: user.role)

**Using `isAdmin` / `adminRole`:**
- `backend/src/modules/admin/admin-auth.service.ts`
- `backend/src/modules/admin/guards/admin.guard.ts`
- `backend/src/modules/admin/user-management.service.ts` (lines 159-160)

---

## ✅ Recommended Solution

### Strategy: **Gradual Migration with Backward Compatibility**

1. **Add new fields** to entity (fullName, email verification, etc.)
2. **Keep legacy fields** temporarily for backward compatibility
3. **Create migration script** to sync firstName+lastName → fullName
4. **Update services** to use new fields
5. **Deprecate and remove** legacy fields in future release

---

## 📝 Implementation Steps

### Step 1: Update User Entity

**File:** `backend/src/modules/auth/entities/user.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRoleAssignment } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { eager: true, nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  // ✅ NEW: Primary name field (matches schema)
  @Column({ name: 'full_name' })
  fullName: string;

  // ⚠️ DEPRECATED: Keep for backward compatibility, will be removed
  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  // ⚠️ DEPRECATED: Use RBAC system instead
  @Column({ default: 'member' })
  role?: string;

  // ⚠️ DEPRECATED: Use RBAC system instead
  @Column({ name: 'is_admin', default: false })
  isAdmin?: boolean;

  @Column({ name: 'admin_role', nullable: true })
  adminRole?: string;

  // ✅ NEW: Email verification
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken: string;

  // ✅ NEW: Password reset
  @Column({ name: 'reset_token', nullable: true })
  resetToken: string;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires: Date;

  // ✅ NEW: Activity tracking
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RBAC relationship
  @OneToMany(() => UserRoleAssignment, assignment => assignment.user)
  roleAssignments: UserRoleAssignment[];

  // Virtual property for roles (computed from roleAssignments)
  roles?: string[];
}
```

### Step 2: Create Migration Script

**File:** `backend/src/migrations/015-sync-user-names-to-fullname.sql`

```sql
-- Sync firstName + lastName to fullName
UPDATE users 
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL OR full_name = '';

-- Make full_name NOT NULL after sync
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Add comment
COMMENT ON COLUMN users.full_name IS 'Primary name field - use this instead of first_name/last_name';
COMMENT ON COLUMN users.first_name IS 'DEPRECATED - use full_name instead';
COMMENT ON COLUMN users.last_name IS 'DEPRECATED - use full_name instead';
COMMENT ON COLUMN users.role IS 'DEPRECATED - use RBAC system (user_role_assignments) instead';
COMMENT ON COLUMN users.is_admin IS 'DEPRECATED - use RBAC system instead';
COMMENT ON COLUMN users.admin_role IS 'DEPRECATED - use RBAC system instead';
```

### Step 3: Update Services to Use fullName

**File:** `backend/src/modules/admin/user-management.service.ts`

Changes needed:
1. Line 31: Update search query to use `fullName`
2. Line 114: Use `fullName` directly
3. Lines 154-155: Remove firstName/lastName, use fullName
4. Line 158: Remove role assignment (use RBAC instead)

**File:** `backend/src/modules/team/team.service.ts`

Changes needed:
1. Line 39: Update select to use `fullName`
2. Lines 208-209: Use `fullName` instead of firstName/lastName
3. Line 252: Remove direct role assignment (use RBAC service)

### Step 4: Update DTOs

**File:** `backend/src/modules/admin/dto/user-management.dto.ts`

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // ✅ NEW: Use fullName
  @IsString()
  fullName: string;

  // ⚠️ DEPRECATED: Keep for backward compatibility
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  // ... rest of fields
}
```

### Step 5: Create Helper Service for Name Handling

**File:** `backend/src/modules/auth/services/user-helper.service.ts`

```typescript
@Injectable()
export class UserHelperService {
  /**
   * Parse fullName from firstName and lastName (backward compatibility)
   */
  getFullName(user: { firstName?: string; lastName?: string; fullName?: string }): string {
    if (user.fullName) return user.fullName;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  /**
   * Get firstName from fullName (backward compatibility)
   */
  getFirstName(user: { firstName?: string; fullName?: string }): string {
    if (user.firstName) return user.firstName;
    return user.fullName?.split(' ')[0] || '';
  }

  /**
   * Get lastName from fullName (backward compatibility)
   */
  getLastName(user: { lastName?: string; fullName?: string }): string {
    if (user.lastName) return user.lastName;
    const parts = user.fullName?.split(' ') || [];
    return parts.slice(1).join(' ') || '';
  }
}
```

---

## 🚀 Migration Timeline

### Phase 1: Add New Fields (Week 1)
- ✅ Add `fullName`, email verification, password reset fields
- ✅ Make legacy fields optional
- ✅ Add migration script
- ✅ Deploy to staging

### Phase 2: Update Services (Week 2)
- ✅ Update all services to use `fullName`
- ✅ Add helper service for backward compatibility
- ✅ Update DTOs
- ✅ Test thoroughly

### Phase 3: Migrate to RBAC (Week 3-4)
- ✅ Update all role checks to use RBAC service
- ✅ Migrate existing role data to user_role_assignments
- ✅ Update guards and middleware
- ✅ Comprehensive testing

### Phase 4: Deprecation (Week 5)
- ⚠️ Mark legacy fields as deprecated
- ⚠️ Add deprecation warnings in logs
- ⚠️ Update documentation

### Phase 5: Removal (Future Release)
- ❌ Remove firstName, lastName columns
- ❌ Remove role, isAdmin, adminRole columns
- ❌ Clean up backward compatibility code

---

## ⚠️ Backward Compatibility Strategy

### For firstName / lastName
```typescript
// In services, provide both formats
return {
  ...user,
  fullName: user.fullName,
  // Backward compatibility
  firstName: user.fullName?.split(' ')[0],
  lastName: user.fullName?.split(' ').slice(1).join(' '),
};
```

### For role field
```typescript
// In JWT token or API response
return {
  ...user,
  // RBAC roles (new way)
  roles: await this.rbacService.getUserRoles(user.id),
  // Legacy role (for old clients)
  role: user.role || 'member',
};
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] User entity creates with fullName
- [ ] Helper service correctly parses names
- [ ] RBAC service returns correct roles
- [ ] Backward compatibility works

### Integration Tests
- [ ] User registration with fullName
- [ ] User update preserves data
- [ ] Role assignment via RBAC
- [ ] Team invitation flow

### E2E Tests
- [ ] Complete user lifecycle
- [ ] Admin panel user management
- [ ] Team management flows
- [ ] Authentication flows

---

## 📚 Related Files

### Entities
- `backend/src/modules/auth/entities/user.entity.ts`
- `backend/src/modules/auth/entities/user-role.entity.ts`
- `backend/src/modules/admin/entities/platform-user.entity.ts`

### Services
- `backend/src/modules/admin/user-management.service.ts`
- `backend/src/modules/team/team.service.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/services/rbac.service.ts`
- `backend/src/modules/auth/services/role-assignment.service.ts`

### Migrations
- `backend/src/migrations/001-create-rbac-tables.sql`
- `backend/src/migrations/015-sync-user-names-to-fullname.sql` (to create)

---

## 🎯 Success Criteria

1. ✅ All users have `fullName` populated
2. ✅ Services use `fullName` as primary field
3. ✅ RBAC system is used for all permission checks
4. ✅ Legacy fields work for backward compatibility
5. ✅ All tests pass
6. ✅ No breaking changes for existing clients
7. ✅ Clear deprecation path documented

---

## 💡 Recommendations

### DO:
1. ✅ **Gradual migration** - Don't break existing functionality
2. ✅ **Test thoroughly** - Especially user management flows
3. ✅ **Keep backward compatibility** - Until major version bump
4. ✅ **Use RBAC consistently** - For all authorization
5. ✅ **Document changes** - For frontend developers

### DON'T:
1. ❌ **Remove fields immediately** - Keep for compatibility
2. ❌ **Skip migration script** - Data must be synced
3. ❌ **Ignore existing integrations** - Could break clients
4. ❌ **Mix role systems** - Choose RBAC and stick with it

---

## 🔄 Next Steps

1. **Review this plan** with the team
2. **Create backup** of production database
3. **Implement Phase 1** on staging environment
4. **Test thoroughly** with real user flows
5. **Deploy to production** with rollback plan ready
6. **Monitor** for issues
7. **Iterate** based on feedback

---

**Questions? Need help?** Check `SAFE-ROLE-MANAGEMENT.md` for RBAC usage details.
