# Admin Platform User Management - Implementation Plan 🔐

## Overview

Super admins need the ability to:
- ✅ View all platform users (across all organizations)
- ✅ Create new users
- ✅ Edit user details
- ✅ Suspend/activate users
- ✅ Delete users
- ✅ Reset passwords
- ✅ Change user roles
- ✅ View user activity
- ✅ Assign users to organizations

## Features to Implement

### 1. User Management Page (`/admin/users`)
- List all platform users
- Search and filter capabilities
- Pagination
- Bulk actions
- Quick actions per user

### 2. Create User Modal
- Email, name, password fields
- Organization selection
- Role assignment
- Auto-generate password option
- Email invitation

### 3. Edit User Modal
- Update user details
- Change organization
- Change role
- Update status

### 4. User Actions
- Suspend/Activate
- Reset password
- Delete user
- Impersonate user (optional)
- View audit log

### 5. Permissions
- Only super_admin can create/delete users
- Regular admin can view and edit
- Support can only view

---

## Implementation Steps

### Backend
1. Create UserManagementController
2. Create UserManagementService
3. Add CRUD endpoints
4. Add permission checks
5. Add audit logging

### Frontend
1. Create /admin/users page
2. Create UserListTable component
3. Create CreateUserModal component
4. Create EditUserModal component
5. Add action buttons and confirmations

---

## API Endpoints

### User Management
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/:id` - Get user details
- `POST /api/v1/admin/users` - Create new user
- `PATCH /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `POST /api/v1/admin/users/:id/suspend` - Suspend user
- `POST /api/v1/admin/users/:id/activate` - Activate user
- `POST /api/v1/admin/users/:id/reset-password` - Reset password

### Statistics
- `GET /api/v1/admin/users/stats` - User statistics

---

## Database Schema

### Users Table (existing)
```sql
- id
- email
- password_hash
- first_name
- last_name
- organization_id
- role
- is_active
- is_admin
- admin_role
- created_at
- updated_at
```

---

## Implementation Files

### Backend Files to Create
1. `backend/src/modules/admin/user-management.controller.ts`
2. `backend/src/modules/admin/user-management.service.ts`
3. `backend/src/modules/admin/dto/user-management.dto.ts`

### Frontend Files to Create
1. `frontend/src/app/(admin)/admin/users/page.tsx`
2. `frontend/src/components/admin/CreateUserModal.tsx`
3. `frontend/src/components/admin/EditUserModal.tsx`
4. `frontend/src/components/admin/UserActionsMenu.tsx`
5. `frontend/src/components/admin/UserStatsCards.tsx`

---

Let's implement this now!
