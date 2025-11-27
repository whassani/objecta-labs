# 🚀 Permission Management - Quick Start Guide

## 📋 Overview

A comprehensive system to manage roles and permissions per resource in your organization.

---

## ⚡ Quick Access

**Frontend URL**: http://localhost:3000/dashboard/permissions  
**API Docs**: http://localhost:3001/api/docs (search for "permissions")

---

## 🎯 Quick Start (3 Steps)

### Step 1: Access Permission Page (30 seconds)

```bash
# 1. Start backend
cd backend
npm run start:dev

# 2. Start frontend
cd frontend
npm run dev

# 3. Navigate to permissions page
http://localhost:3000/dashboard/permissions
```

### Step 2: Create a Custom Role (2 minutes)

1. Click **"Create Role"** button
2. Fill in the form:
   - **Display Name**: "Content Manager"
   - **Description**: "Manages agents and workflows"
   - **Role Level**: 40
3. Select permissions:
   - ✅ Agents: create, read, update
   - ✅ Workflows: create, read, execute
4. Click **"Create Role"**

### Step 3: Edit Role Permissions (1 minute)

1. Click on a role from the list
2. Expand resource sections (click arrow)
3. Toggle individual permissions with checkboxes
4. Click "All" to enable/disable all actions for a resource
5. Click **"Save Changes"**

---

## 🎨 UI Features

### Permission Dashboard
- 📊 **Statistics Cards**: View total roles, resources, system/custom roles
- 🔍 **Search**: Filter roles by name
- 📝 **Role List**: All roles with badges (System/Default)
- ✏️ **Visual Editor**: Expand/collapse resources, toggle permissions
- ➕ **Role Creator**: Create custom roles with specific permissions

### Role Editor
- **Expandable Resources**: Click chevron to expand/collapse
- **Visual Feedback**: Blue highlighting for enabled permissions
- **Bulk Toggle**: "All" checkbox to enable/disable all actions
- **Permission Count**: Shows X/Y enabled per resource
- **System Protection**: System roles show yellow warning banner
- **Save Button**: Real-time save with loading state

---

## 🔧 API Endpoints

### Get All Roles
```bash
GET /api/v1/permissions/roles
Authorization: Bearer YOUR_TOKEN

# Response
[
  {
    "id": "role-id",
    "name": "admin",
    "displayName": "Administrator",
    "description": "Full organization management",
    "permissions": ["agents:create", "agents:read", ...],
    "isSystem": true,
    "level": 80
  }
]
```

### Create Custom Role
```bash
POST /api/v1/permissions/roles
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "content-manager",
  "displayName": "Content Manager",
  "description": "Manages content and workflows",
  "permissions": [
    "agents:create",
    "agents:read",
    "agents:update",
    "workflows:create",
    "workflows:read",
    "workflows:execute"
  ],
  "level": 40
}
```

### Update Role Permissions
```bash
PUT /api/v1/permissions/roles/:roleId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "permissions": [
    "agents:read",
    "workflows:read",
    "workflows:execute"
  ]
}
```

### Get User Permissions
```bash
GET /api/v1/permissions/users/:userId
Authorization: Bearer YOUR_TOKEN

# Response
{
  "userId": "user-id",
  "organizationId": "org-id",
  "roles": ["admin", "editor"],
  "permissions": ["agents:read", "agents:create", ...],
  "permissionsByResource": {
    "agents": ["read", "create", "update"],
    "workflows": ["read", "execute"]
  }
}
```

### Check User Permission
```bash
POST /api/v1/permissions/users/:userId/check
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "permission": "agents:create"
}

# Response
{
  "hasPermission": true
}
```

---

## 📚 Permission Format

### Structure
```
resource:action
```

### Resources (18 types)
- `agents` - AI agents
- `conversations` - Chat conversations
- `knowledge-base` - Knowledge base management
- `documents` - Document management
- `workflows` - Workflow automation
- `tools` - Tools and actions
- `fine-tuning` - Model fine-tuning
- `datasets` - Training datasets
- `jobs` - Background jobs
- `organizations` - Organization management
- `workspaces` - Workspace management
- `users` - User management
- `settings` - Settings management
- `api-keys` - API key management

### Actions (8 types)
- `create` - Create new resources
- `read` - View resources
- `update` - Modify resources
- `delete` - Delete resources
- `manage` - Full management access
- `execute` - Execute/run resources
- `deploy` - Deploy to production
- `share` - Share with others

### Examples
```
agents:create      → Create new agents
workflows:execute  → Execute workflows
users:manage       → Full user management
documents:read     → View documents
api-keys:delete    → Delete API keys
```

---

## 🎯 Common Use Cases

### 1. Create Marketing Team Role
```json
{
  "name": "marketing-team",
  "displayName": "Marketing Team",
  "description": "Marketing team with limited access",
  "permissions": [
    "agents:read",
    "conversations:read",
    "workflows:read",
    "workflows:execute",
    "documents:read"
  ],
  "level": 20
}
```

### 2. Create Developer Role
```json
{
  "name": "developer",
  "displayName": "Developer",
  "description": "Developers with technical access",
  "permissions": [
    "agents:manage",
    "workflows:manage",
    "tools:manage",
    "api-keys:create",
    "api-keys:read",
    "api-keys:delete"
  ],
  "level": 60
}
```

### 3. Create Read-Only Viewer
```json
{
  "name": "viewer",
  "displayName": "Read-Only Viewer",
  "description": "View-only access to resources",
  "permissions": [
    "agents:read",
    "workflows:read",
    "documents:read",
    "conversations:read"
  ],
  "level": 10
}
```

### 4. Create Content Editor
```json
{
  "name": "content-editor",
  "displayName": "Content Editor",
  "description": "Can create and edit content",
  "permissions": [
    "agents:create",
    "agents:read",
    "agents:update",
    "documents:create",
    "documents:read",
    "documents:update",
    "knowledge-base:update"
  ],
  "level": 35
}
```

---

## 🔒 Security Features

### System Role Protection
- ✅ System roles (Owner, Admin, Editor, Viewer) cannot be modified
- ✅ Yellow warning banner shown for system roles
- ✅ Delete button disabled for system roles

### Safety Checks
- ✅ Cannot delete roles with active user assignments
- ✅ Validation ensures at least one permission per role
- ✅ Only users with `users:manage` can create/edit roles
- ✅ Only users with `users:read` can view permissions

### Audit Trail
- ✅ All role changes are logged
- ✅ Who created/modified roles is tracked
- ✅ Timestamps for all changes

---

## 📊 Role Hierarchy

### System Roles (Cannot Modify)
```
Level 100: Owner (Full Access)
  ↓
Level 80:  Admin (Org Management)
  ↓
Level 50:  Editor (Content Management)
  ↓
Level 20:  Viewer (Read Only)
```

### Custom Roles (Configurable)
```
Level 0-100: Your custom roles
- Higher level = More authority
- Used for permission checks
- Defines role hierarchy
```

---

## 🧪 Testing

### Test in UI
```bash
# 1. Access page
http://localhost:3000/dashboard/permissions

# 2. Create a test role
Name: "test-role"
Permissions: agents:read, workflows:read

# 3. Edit permissions
Click role → Expand "Agents" → Toggle checkboxes → Save

# 4. Delete role
Click role → Click trash icon → Confirm
```

### Test with API
```bash
# Create role
curl -X POST http://localhost:3001/api/v1/permissions/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-role",
    "displayName": "Test Role",
    "description": "Test",
    "permissions": ["agents:read"],
    "level": 10
  }'

# Get all roles
curl http://localhost:3001/api/v1/permissions/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete role
curl -X DELETE http://localhost:3001/api/v1/permissions/roles/ROLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### "Cannot create role"
- ✅ Check you have `users:manage` permission
- ✅ Ensure display name is not empty
- ✅ Add at least one permission

### "Cannot delete role"
- ✅ Cannot delete system roles
- ✅ Cannot delete roles assigned to users
- ✅ Check role has no active assignments

### "Permission changes not saving"
- ✅ Ensure you clicked "Save Changes"
- ✅ Check for error messages
- ✅ Verify you have `users:manage` permission

### "Role not appearing"
- ✅ Refresh the page
- ✅ Check search filter is cleared
- ✅ Verify role was created successfully

---

## 📖 Next Steps

### For Administrators
1. ✅ Create department-specific roles
2. ✅ Assign roles to team members
3. ✅ Review and audit permissions regularly
4. ✅ Set up appropriate role hierarchy

### For Developers
1. ✅ Use permission checks in your code
2. ✅ Integrate with `@RequirePermissions()` decorator
3. ✅ Create API endpoints with proper guards
4. ✅ Test permission enforcement

### For End Users
1. ✅ View your permissions in settings
2. ✅ Request additional permissions from admin
3. ✅ Understand your access limitations

---

## 🎉 Summary

**What You Can Do Now**:
- ✅ View all roles and permissions
- ✅ Create custom roles
- ✅ Edit role permissions visually
- ✅ Delete custom roles
- ✅ Search and filter roles
- ✅ Manage resource-level permissions
- ✅ Assign roles to users (via Team page)

**Access Points**:
- **UI**: http://localhost:3000/dashboard/permissions
- **API**: http://localhost:3001/api/v1/permissions
- **Docs**: http://localhost:3001/api/docs

---

**Status**: ✅ Ready to Use!

Start managing permissions now at `/dashboard/permissions` 🚀
