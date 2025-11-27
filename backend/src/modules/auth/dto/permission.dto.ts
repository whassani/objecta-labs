import { IsString, IsArray, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Resource, Action, Permission } from '../enums/permission.enum';

/**
 * DTO for creating/updating role permissions
 */
export class UpdateRolePermissionsDto {
  @ApiProperty({ description: 'Array of permission strings', example: ['agents:read', 'agents:create'] })
  @IsArray()
  @IsString({ each: true })
  permissions: Permission[];
}

/**
 * DTO for managing resource-level permissions
 */
export class ResourcePermissionDto {
  @ApiProperty({ enum: Resource, description: 'Resource type' })
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({ enum: Action, isArray: true, description: 'Allowed actions' })
  @IsArray()
  @IsEnum(Action, { each: true })
  actions: Action[];
}

/**
 * DTO for bulk permission updates
 */
export class BulkPermissionUpdateDto {
  @ApiProperty({ type: [ResourcePermissionDto] })
  @IsArray()
  resourcePermissions: ResourcePermissionDto[];
}

/**
 * DTO for assigning permissions to user
 */
export class AssignUserPermissionsDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  roleId: string;

  @ApiProperty({ description: 'Workspace ID (optional for org-level)', required: false })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty({ description: 'Custom permissions override', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customPermissions?: Permission[];
}

/**
 * DTO for querying user permissions
 */
export class QueryUserPermissionsDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Workspace ID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty({ enum: Resource, required: false, description: 'Filter by resource' })
  @IsEnum(Resource)
  @IsOptional()
  resource?: Resource;
}

/**
 * Response DTO for user permissions
 */
export class UserPermissionsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Workspace ID (if scoped)' })
  workspaceId?: string;

  @ApiProperty({ description: 'User roles', type: [String] })
  roles: string[];

  @ApiProperty({ description: 'All permissions', type: [String] })
  permissions: Permission[];

  @ApiProperty({ description: 'Permissions grouped by resource' })
  permissionsByResource: Record<Resource, Action[]>;
}

/**
 * Response DTO for permission check
 */
export class PermissionCheckResponseDto {
  @ApiProperty({ description: 'Whether user has permission' })
  hasPermission: boolean;

  @ApiProperty({ description: 'Reason if permission denied' })
  reason?: string;
}

/**
 * DTO for creating custom role
 */
export class CreateCustomRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Permissions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: Permission[];

  @ApiProperty({ description: 'Role level (hierarchy)', default: 0 })
  @IsOptional()
  level?: number;
}

/**
 * DTO for updating custom role
 */
export class UpdateCustomRoleDto {
  @ApiProperty({ description: 'Display name', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Permissions', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: Permission[];

  @ApiProperty({ description: 'Role level (hierarchy)', required: false })
  @IsOptional()
  level?: number;
}
