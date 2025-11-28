# 📁 Workspaces Explained

## What is a Workspace?

A **Workspace** is an organizational container within an organization that helps teams **organize and isolate their AI agents, workflows, and resources**.

Think of it as a **project folder** or **team space** within your organization.

---

## 🏢 Multi-Level Hierarchy

```
Platform
  └── Organization (Company/Tenant)
      └── Workspace (Team/Project)
          ├── Agents
          ├── Workflows
          ├── Knowledge Base
          ├── Tools
          └── Conversations
```

### Example Structure:
```
Acme Corp (Organization)
  ├── Marketing Workspace
  │   ├── Content Generator Agent
  │   ├── Social Media Workflow
  │   └── Marketing Knowledge Base
  │
  ├── Sales Workspace
  │   ├── Lead Qualification Agent
  │   ├── Email Campaign Workflow
  │   └── Sales Scripts Knowledge Base
  │
  └── Engineering Workspace
      ├── Code Review Agent
      ├── CI/CD Workflow
      └── Documentation Knowledge Base
```

---

## 🎯 Purpose of Workspaces

### 1. **Organization & Isolation**
- Keep different teams' resources separate
- Avoid clutter when multiple teams use the platform
- Clear boundaries for different projects

### 2. **Permission Control**
- Assign roles at the workspace level
- Some users can be admin in one workspace but viewer in another
- Fine-grained access control

### 3. **Resource Scoping**
- Agents belong to a workspace
- Workflows are workspace-specific
- Knowledge bases can be workspace-scoped
- Conversations are organized by workspace

### 4. **Collaboration**
- Teams work together in shared workspaces
- Invite members to specific workspaces only
- Share resources within workspace boundaries

---

## 📊 Workspace Entity Structure

```typescript
interface Workspace {
  id: string;                    // Unique identifier
  organizationId: string;        // Parent organization
  name: string;                  // e.g., "Marketing Team"
  description: string;           // Optional description
  icon: string;                  // Optional icon/emoji
  settings: object;              // Custom settings (JSONB)
  isActive: boolean;             // Enable/disable workspace
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Permission System with Workspaces

### Role Assignment Levels:

1. **Organization-Level Roles** (apply to all workspaces)
   ```
   User → Organization → Role (owner/admin/member)
   ```

2. **Workspace-Level Roles** (specific to one workspace)
   ```
   User → Organization → Workspace → Role (admin/editor/viewer)
   ```

### Example Permissions:
```typescript
// Check organization-level permission
hasPermission(userId, orgId, 'CREATE_AGENT')

// Check workspace-level permission
hasPermission(userId, orgId, 'CREATE_AGENT', workspaceId)
```

### Use Cases:
- **Jane** is an **owner** at organization level → can do anything in all workspaces
- **Bob** is an **admin** in "Marketing Workspace" → full control in that workspace only
- **Alice** is a **viewer** in "Sales Workspace" → read-only access to that workspace

---

## 🛠️ Workspace Features

### Current Implementation:

#### CRUD Operations
- ✅ Create workspace
- ✅ List workspaces (per organization)
- ✅ Update workspace details
- ✅ Delete workspace
- ✅ Enable/disable workspace

#### Settings
- ✅ Custom settings per workspace (JSONB field)
- ✅ Icon/branding per workspace
- ✅ Description and metadata

### Planned/Future Features:
- [ ] Default workspace for new users
- [ ] Workspace templates
- [ ] Cross-workspace resource sharing
- [ ] Workspace-level analytics
- [ ] Workspace invite links
- [ ] Workspace billing/quotas

---

## 💻 API Endpoints

```typescript
// List all workspaces in an organization
GET /api/v1/workspaces
Response: [{ id, name, description, icon, isActive }]

// Get specific workspace
GET /api/v1/workspaces/:id
Response: { id, name, description, settings, ... }

// Create workspace
POST /api/v1/workspaces
Body: { name, description, icon, settings }
Response: { id, name, ... }

// Update workspace
PUT /api/v1/workspaces/:id
Body: { name?, description?, settings? }
Response: { id, name, ... }

// Delete workspace
DELETE /api/v1/workspaces/:id
Response: { success: true }
```

---

## 🎨 Frontend UI

### Workspaces Page
**Location:** `/dashboard/workspaces`

**Features:**
- Grid view of all workspaces
- Click to enter a workspace
- Create new workspace button
- Shows workspace name, description, icon

**UI Elements:**
```tsx
📁 Marketing Team
   Social media campaigns and content

📁 Sales Operations  
   Lead generation and follow-up

📁 Customer Support
   Help desk automation
```

---

## 🔄 Workflow Integration

### How Resources Connect to Workspaces:

```sql
-- Agents belong to a workspace
agents
  └── workspace_id (foreign key)

-- Workflows belong to a workspace  
workflows
  └── workspace_id (foreign key)

-- Conversations might be workspace-scoped
conversations
  └── workspace_id (optional, for context)

-- Knowledge base can be workspace-level
data_sources
  └── workspace_id (optional)
```

---

## 🌟 Real-World Use Cases

### Use Case 1: Agency with Multiple Clients
```
Digital Agency (Organization)
  ├── Client A Workspace
  │   └── Agents and workflows for Client A only
  ├── Client B Workspace
  │   └── Agents and workflows for Client B only
  └── Internal Workspace
      └── Agency's own tools and resources
```

### Use Case 2: Enterprise Departments
```
Enterprise Corp (Organization)
  ├── HR Workspace
  │   └── Resume screening, onboarding automation
  ├── Finance Workspace
  │   └── Invoice processing, expense reports
  └── IT Workspace
      └── Ticket routing, documentation search
```

### Use Case 3: Solo Developer with Multiple Projects
```
Freelancer (Organization)
  ├── Project Alpha Workspace
  ├── Project Beta Workspace
  └── Personal Tools Workspace
```

---

## 🔍 When to Use Workspaces vs Organizations

### Use **Organizations** when:
- Completely separate tenants (different companies)
- Different billing accounts
- No resource sharing needed
- Complete data isolation required

### Use **Workspaces** when:
- Same company, different teams
- Need some collaboration but also separation
- Shared billing, separate projects
- Want role-based access within the organization

---

## 📝 Best Practices

### Naming Conventions
✅ **Good:**
- "Marketing Team"
- "Q1 2024 Campaign"
- "Customer Support - EMEA"

❌ **Avoid:**
- "Workspace 1"
- "Test"
- "asdf"

### Organization Tips
1. **Keep it focused** - One purpose per workspace
2. **Use descriptions** - Help team members understand the workspace
3. **Set proper permissions** - Not everyone needs admin access
4. **Archive unused workspaces** - Set `isActive: false` instead of deleting

### Security
- Don't share workspace access with everyone
- Review workspace members regularly
- Use workspace-level roles for fine-grained control
- Consider which resources should be workspace vs organization level

---

## 🔧 Technical Implementation

### Database Schema
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_workspaces_org ON workspaces(organization_id);
```

### TypeORM Entity
```typescript
@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: any;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
```

---

## 🚀 Getting Started with Workspaces

### Step 1: Create Your First Workspace
```bash
POST /api/v1/workspaces
{
  "name": "My First Workspace",
  "description": "Testing workspace features",
  "icon": "📁"
}
```

### Step 2: Create an Agent in the Workspace
```bash
POST /api/v1/agents
{
  "name": "Helper Bot",
  "workspaceId": "workspace-uuid-here",
  ...
}
```

### Step 3: Invite Team Members
```bash
# Assign workspace-level role
POST /api/v1/workspaces/:workspaceId/members
{
  "userId": "user-uuid",
  "role": "editor"
}
```

---

## 📚 Related Concepts

### Organizations
- **Parent container** for workspaces
- Represents a company/tenant
- Billing and subscription at this level

### Roles & Permissions
- Can be **organization-level** or **workspace-level**
- Workspace roles inherit from organization roles
- More specific permissions override general ones

### Multi-Tenancy
- **Organization** = Tenant isolation
- **Workspace** = Sub-tenant organization
- Data is isolated by organization, organized by workspace

---

## 🎯 Summary

**Workspaces** are:
- ✅ Organizational containers within an organization
- ✅ Used for team/project isolation
- ✅ Support workspace-level permissions
- ✅ Help organize agents, workflows, and resources
- ✅ Optional but recommended for multi-team setups

**Think of it as:**
- 📁 Project folders in Google Drive
- 📋 Boards in Trello
- 💬 Channels in Slack
- 🗂️ Projects in Jira

---

## ❓ FAQ

**Q: Do I need to use workspaces?**
A: Not required, but recommended if you have multiple teams or projects.

**Q: Can resources be shared across workspaces?**
A: Currently limited. Resources typically belong to one workspace. Cross-workspace sharing is a future feature.

**Q: Who can create workspaces?**
A: Organization owners and admins can create workspaces.

**Q: What happens when I delete a workspace?**
A: All resources in that workspace (agents, workflows) are also deleted. Use `isActive: false` to archive instead.

**Q: Can a user be in multiple workspaces?**
A: Yes! Users can have different roles in different workspaces.

**Q: Is there a default workspace?**
A: Not currently, but this is a planned feature. For now, you need to explicitly select a workspace.

---

**Status:** ✅ Feature is implemented and available  
**Location:** `/dashboard/workspaces`  
**API:** `/api/v1/workspaces`
