/**
 * User roles in the system
 * 
 * OWNER - Full control, can manage organization settings and billing
 * ADMIN - Can manage users, resources, and settings
 * EDITOR - Can create and edit resources
 * VIEWER - Read-only access
 */
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

/**
 * Role hierarchy (higher number = more permissions)
 */
export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.OWNER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.EDITOR]: 2,
  [UserRole.VIEWER]: 1,
};

/**
 * Check if a role has higher or equal permissions than another
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}
