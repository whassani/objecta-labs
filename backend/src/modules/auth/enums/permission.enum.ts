/**
 * Resource types in the system
 */
export enum Resource {
  AGENTS = 'agents',
  CONVERSATIONS = 'conversations',
  KNOWLEDGE_BASE = 'knowledge-base',
  DOCUMENTS = 'documents',
  WORKFLOWS = 'workflows',
  TOOLS = 'tools',
  FINE_TUNING = 'fine-tuning',
  DATASETS = 'datasets',
  JOBS = 'jobs',
  ORGANIZATIONS = 'organizations',
  WORKSPACES = 'workspaces',
  USERS = 'users',
  SETTINGS = 'settings',
  API_KEYS = 'api-keys',
}

/**
 * Actions that can be performed on resources
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full access including settings
  EXECUTE = 'execute', // For workflows, jobs
  DEPLOY = 'deploy', // For models, agents
  SHARE = 'share', // Share resources with others
}

/**
 * Permission format: resource:action
 * Examples: 
 * - agents:create
 * - workflows:execute
 * - organizations:manage
 */
export type Permission = `${Resource}:${Action}`;

/**
 * Generate permission string
 */
export function createPermission(resource: Resource, action: Action): Permission {
  return `${resource}:${action}`;
}

/**
 * Parse permission string
 */
export function parsePermission(permission: Permission): { resource: Resource; action: Action } {
  const [resource, action] = permission.split(':') as [Resource, Action];
  return { resource, action };
}

/**
 * Default permissions by role
 */
export const RolePermissions: Record<string, Permission[]> = {
  owner: [
    // Full access to everything
    'organizations:manage',
    'organizations:read',
    'organizations:update',
    'organizations:delete',
    'workspaces:manage',
    'workspaces:create',
    'workspaces:read',
    'workspaces:update',
    'workspaces:delete',
    'users:manage',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'settings:manage',
    'settings:read',
    'settings:update',
    'api-keys:manage',
    'api-keys:create',
    'api-keys:read',
    'api-keys:delete',
    // All resource permissions
    'agents:create',
    'agents:read',
    'agents:update',
    'agents:delete',
    'agents:deploy',
    'conversations:create',
    'conversations:read',
    'conversations:update',
    'conversations:delete',
    'knowledge-base:create',
    'knowledge-base:read',
    'knowledge-base:update',
    'knowledge-base:delete',
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'workflows:create',
    'workflows:read',
    'workflows:update',
    'workflows:delete',
    'workflows:execute',
    'tools:create',
    'tools:read',
    'tools:update',
    'tools:delete',
    'tools:execute',
    'fine-tuning:create',
    'fine-tuning:read',
    'fine-tuning:update',
    'fine-tuning:delete',
    'datasets:create',
    'datasets:read',
    'datasets:update',
    'datasets:delete',
    'jobs:create',
    'jobs:read',
    'jobs:update',
    'jobs:delete',
  ],
  admin: [
    // Workspace and resource management
    'workspaces:read',
    'workspaces:update',
    'users:read',
    'users:update',
    'settings:read',
    'settings:update',
    'api-keys:create',
    'api-keys:read',
    'api-keys:delete',
    // All resource CRUD
    'agents:create',
    'agents:read',
    'agents:update',
    'agents:delete',
    'agents:deploy',
    'conversations:create',
    'conversations:read',
    'conversations:update',
    'conversations:delete',
    'knowledge-base:create',
    'knowledge-base:read',
    'knowledge-base:update',
    'knowledge-base:delete',
    'documents:create',
    'documents:read',
    'documents:update',
    'documents:delete',
    'workflows:create',
    'workflows:read',
    'workflows:update',
    'workflows:delete',
    'workflows:execute',
    'tools:create',
    'tools:read',
    'tools:update',
    'tools:delete',
    'tools:execute',
    'fine-tuning:create',
    'fine-tuning:read',
    'fine-tuning:update',
    'fine-tuning:delete',
    'datasets:create',
    'datasets:read',
    'datasets:update',
    'datasets:delete',
    'jobs:create',
    'jobs:read',
    'jobs:update',
    'jobs:delete',
  ],
  editor: [
    // Create and edit resources
    'agents:create',
    'agents:read',
    'agents:update',
    'conversations:create',
    'conversations:read',
    'conversations:update',
    'knowledge-base:create',
    'knowledge-base:read',
    'knowledge-base:update',
    'documents:create',
    'documents:read',
    'documents:update',
    'workflows:create',
    'workflows:read',
    'workflows:update',
    'workflows:execute',
    'tools:create',
    'tools:read',
    'tools:update',
    'tools:execute',
    'fine-tuning:create',
    'fine-tuning:read',
    'fine-tuning:update',
    'datasets:create',
    'datasets:read',
    'datasets:update',
    'jobs:create',
    'jobs:read',
    'jobs:update',
  ],
  viewer: [
    // Read-only access
    'agents:read',
    'conversations:read',
    'knowledge-base:read',
    'documents:read',
    'workflows:read',
    'tools:read',
    'fine-tuning:read',
    'datasets:read',
    'jobs:read',
  ],
};
