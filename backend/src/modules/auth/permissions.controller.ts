import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RbacService } from './services/rbac.service';
import {
  UpdateRolePermissionsDto,
  BulkPermissionUpdateDto,
  AssignUserPermissionsDto,
  QueryUserPermissionsDto,
  UserPermissionsResponseDto,
  PermissionCheckResponseDto,
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
} from './dto/permission.dto';
import { Resource, Action, Permission } from './enums/permission.enum';
import { UserRole } from './enums/role.enum';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('v1/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private rbacService: RbacService) {}

  /**
   * Get all available resources and actions
   */
  @Get('resources')
  @ApiOperation({ summary: 'Get all available resources and actions' })
  @ApiResponse({ status: 200, description: 'Resources and actions returned' })
  getResources() {
    return {
      resources: Object.values(Resource),
      actions: Object.values(Action),
      permissions: this.generateAllPermissions(),
    };
  }

  /**
   * Get all roles
   */
  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles returned' })
  async getRoles() {
    return this.rbacService.getAllRoles();
  }

  /**
   * Create custom role
   */
  @Post('roles')
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @RequirePermissions('users:manage')
  async createRole(@Body() dto: CreateCustomRoleDto, @CurrentUser() user: any) {
    return this.rbacService.createCustomRole(dto);
  }

  /**
   * Update role permissions
   */
  @Put('roles/:roleId')
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @RequirePermissions('users:manage')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    return this.rbacService.updateCustomRole(roleId, dto);
  }

  /**
   * Delete custom role
   */
  @Delete('roles/:roleId')
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 204, description: 'Role deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users:manage')
  async deleteRole(@Param('roleId') roleId: string) {
    return this.rbacService.deleteCustomRole(roleId);
  }

  /**
   * Get user permissions
   */
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiResponse({ status: 200, description: 'User permissions returned', type: UserPermissionsResponseDto })
  async getUserPermissions(
    @Param('userId') userId: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ): Promise<UserPermissionsResponseDto> {
    const roles = await this.rbacService.getUserRoles(
      userId,
      user.organizationId,
      workspaceId,
    );

    const permissions = await this.rbacService.getUserPermissions(
      userId,
      user.organizationId,
      workspaceId,
    );

    const permissionsByResource = this.groupPermissionsByResource(permissions);

    return {
      userId,
      organizationId: user.organizationId,
      workspaceId,
      roles: roles.map(r => r.name),
      permissions,
      permissionsByResource,
    };
  }

  /**
   * Check if user has specific permission
   */
  @Post('users/:userId/check')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  @ApiResponse({ status: 200, description: 'Permission check result', type: PermissionCheckResponseDto })
  async checkPermission(
    @Param('userId') userId: string,
    @Body() body: { permission: Permission; workspaceId?: string },
    @CurrentUser() user: any,
  ): Promise<PermissionCheckResponseDto> {
    const hasPermission = await this.rbacService.hasPermission(
      userId,
      user.organizationId,
      body.permission,
      body.workspaceId,
    );

    return {
      hasPermission,
      reason: hasPermission ? undefined : 'User does not have the required permission',
    };
  }

  /**
   * Assign role to user
   */
  @Post('users/:userId/assign')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  @RequirePermissions('users:manage')
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignUserPermissionsDto,
    @CurrentUser() user: any,
  ) {
    return this.rbacService.assignRole(
      userId,
      dto.roleId,
      user.organizationId,
      dto.workspaceId || null,
      user.userId,
    );
  }

  /**
   * Remove role from user
   */
  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 204, description: 'Role removed' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users:manage')
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.rbacService.removeRole(
      userId,
      roleId,
      user.organizationId,
      workspaceId,
    );
  }

  /**
   * Get permissions by resource
   */
  @Get('resources/:resource')
  @ApiOperation({ summary: 'Get all permissions for a specific resource' })
  @ApiResponse({ status: 200, description: 'Resource permissions returned' })
  getResourcePermissions(@Param('resource') resource: Resource) {
    const actions = Object.values(Action);
    const permissions = actions.map(action => `${resource}:${action}` as Permission);

    return {
      resource,
      actions,
      permissions,
    };
  }

  /**
   * Bulk update permissions for role
   */
  @Put('roles/:roleId/bulk')
  @ApiOperation({ summary: 'Bulk update permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  @RequirePermissions('users:manage')
  async bulkUpdatePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: BulkPermissionUpdateDto,
  ) {
    const permissions: Permission[] = [];
    
    for (const rp of dto.resourcePermissions) {
      for (const action of rp.actions) {
        permissions.push(`${rp.resource}:${action}` as Permission);
      }
    }

    return this.rbacService.updateCustomRole(roleId, { permissions });
  }

  /**
   * Helper: Generate all possible permissions
   */
  private generateAllPermissions(): Permission[] {
    const permissions: Permission[] = [];
    const resources = Object.values(Resource);
    const actions = Object.values(Action);

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push(`${resource}:${action}` as Permission);
      }
    }

    return permissions;
  }

  /**
   * Helper: Group permissions by resource
   */
  private groupPermissionsByResource(permissions: Permission[]): Record<Resource, Action[]> {
    const grouped: any = {};

    for (const permission of permissions) {
      const [resource, action] = permission.split(':') as [Resource, Action];
      
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      
      if (!grouped[resource].includes(action)) {
        grouped[resource].push(action);
      }
    }

    return grouped;
  }
}
