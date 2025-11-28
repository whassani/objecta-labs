import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { RbacService } from '../auth/services/rbac.service';
import { RoleAssignmentService } from '../auth/services/role-assignment.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Permission } from '../auth/enums/permission.enum';

@ApiTags('admin/permissions')
@Controller('v1/admin/permissions')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(
    private rbacService: RbacService,
    private roleAssignmentService: RoleAssignmentService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users with their roles and permissions' })
  async getAllUsers() {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt'],
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const orgId = user.organization?.id || null;
        const roles = await this.rbacService.getUserRoles(user.id, orgId);
        const permissions = await this.rbacService.getUserPermissions(user.id, orgId);
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          isActive: user.isActive,
          createdAt: user.createdAt,
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name,
          } : null,
          roles,
          permissions,
          roleCount: roles.length,
          permissionCount: permissions.length,
        };
      })
    );

    return usersWithRoles;
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user permissions and roles' })
  async getUserPermissions(@Param('userId') userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orgId = user.organization?.id || null;
    const [permissions, roles] = await Promise.all([
      this.rbacService.getUserPermissions(userId, orgId),
      this.rbacService.getUserRoles(userId, orgId),
    ]);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      organization: user.organization,
      roles,
      permissions,
      roleCount: roles.length,
      permissionCount: permissions.length,
    };
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all available roles' })
  async getAllRoles() {
    return this.roleAssignmentService.getAllRoles();
  }

  @Post('users/:email/roles/:roleName')
  @ApiOperation({ summary: 'Assign role to user by email' })
  async assignRole(
    @Param('email') email: string,
    @Param('roleName') roleName: string,
  ) {
    await this.roleAssignmentService.assignRoleByEmail(email, roleName);
    return { success: true, message: `Role ${roleName} assigned to ${email}` };
  }

  @Delete('users/:email/roles/:roleName')
  @ApiOperation({ summary: 'Remove role from user by email' })
  async removeRole(
    @Param('email') email: string,
    @Param('roleName') roleName: string,
  ) {
    await this.roleAssignmentService.removeRoleByEmail(email, roleName);
    return { success: true, message: `Role ${roleName} removed from ${email}` };
  }

  @Get('check/:userId/:permission')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  async checkPermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    
    const orgId = user?.organization?.id || null;
    // hasPermission expects: userId, organizationId, permission, workspaceId?
    const hasPermission = await this.rbacService.hasPermission(userId, orgId, permission as Permission);
    return { userId, permission, hasPermission };
  }
}
