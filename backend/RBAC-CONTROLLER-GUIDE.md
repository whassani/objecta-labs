# RBAC Controller Application Guide

## Standard Pattern for Securing Controllers

### 1. Import Required Dependencies

```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/role.enum';
```

### 2. Apply Guards to Controller

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('resource')
export class ResourceController { }
```

### 3. Replace @Request() with @CurrentUser()

```typescript
// Before
async method(@Request() req) {
  const orgId = req.user.organizationId;
}

// After
async method(@CurrentUser() user: UserPayload) {
  const orgId = user.organizationId;
}
```

### 4. Add Permission Requirements

| Operation | Roles | Permission |
|-----------|-------|------------|
| List/Read | All | `resource:read` |
| Create | admin, editor | `resource:create` |
| Update | admin, editor | `resource:update` |
| Delete | admin, editor | `resource:delete` |
| Execute | admin, editor | `resource:execute` |
| Manage | admin, owner | `resource:manage` |

### 5. Example Route Protection

```typescript
@Post()
@Roles(UserRole.ADMIN, UserRole.EDITOR)
@RequirePermissions('agents:create')
async create(@Body() dto: CreateDto, @CurrentUser() user: UserPayload) {
  return this.service.create(dto, user.organizationId);
}

@Get()
@RequirePermissions('agents:read')
async findAll(@CurrentUser() user: UserPayload) {
  return this.service.findAll(user.organizationId);
}

@Delete(':id')
@Roles(UserRole.ADMIN, UserRole.EDITOR)
@RequirePermissions('agents:delete')
async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return this.service.remove(id, user.organizationId);
}
```

## Controller-Specific Permissions

### Agents
- `agents:read` - View agents
- `agents:create` - Create agents (admin, editor)
- `agents:update` - Update agents (admin, editor)
- `agents:delete` - Delete agents (admin, editor)
- `agents:deploy` - Deploy fine-tuned models (admin)

### Conversations
- `conversations:read` - View conversations
- `conversations:create` - Create conversations
- `conversations:update` - Update conversations (admin, editor)
- `conversations:delete` - Delete conversations (admin, editor)

### Knowledge Base
- `knowledge-base:read` - View documents
- `knowledge-base:create` - Upload documents (admin, editor)
- `knowledge-base:update` - Update documents (admin, editor)
- `knowledge-base:delete` - Delete documents (admin, editor)

### Workflows
- `workflows:read` - View workflows
- `workflows:create` - Create workflows (admin, editor)
- `workflows:update` - Update workflows (admin, editor)
- `workflows:delete` - Delete workflows (admin, editor)
- `workflows:execute` - Run workflows (admin, editor)

### Tools
- `tools:read` - View tools
- `tools:create` - Create tools (admin, editor)
- `tools:update` - Update tools (admin, editor)
- `tools:delete` - Delete tools (admin, editor)
- `tools:execute` - Execute tools (admin, editor)

### Fine-Tuning
- `fine-tuning:read` - View jobs/datasets
- `fine-tuning:create` - Create jobs (admin, editor)
- `fine-tuning:update` - Update jobs (admin, editor)
- `fine-tuning:delete` - Delete jobs (admin, editor)

### Jobs
- `jobs:read` - View jobs
- `jobs:create` - Create jobs (admin, editor)
- `jobs:update` - Update/cancel jobs (admin, editor)
- `jobs:delete` - Delete jobs (admin)

### Organizations
- `organizations:read` - View org details
- `organizations:update` - Update org settings (admin, owner)
- `organizations:manage` - Full org control (owner)
- `users:manage` - Manage users (admin, owner)

## Completed Controllers

- ✅ AgentsController

## Pending Controllers

- [ ] ConversationsController
- [ ] KnowledgeBaseController  
- [ ] WorkflowsController
- [ ] ToolsController
- [ ] FineTuningController
- [ ] JobsController
- [ ] OrganizationsController
