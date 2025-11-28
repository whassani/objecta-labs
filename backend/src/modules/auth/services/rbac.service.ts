import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';
import { UserRole } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

/**
 * Service to manage roles and permissions
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRoleAssignment)
    private userRolesRepository: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Get user's roles in an organization/workspace
   */
  async getUserRoles(
    userId: string,
    organizationId: string,
    workspaceId?: string,
  ): Promise<Role[]> {
    const query = this.userRolesRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.role', 'role')
      .where('assignment.userId = :userId', { userId })
      .andWhere('assignment.organizationId = :organizationId', { organizationId });

    if (workspaceId) {
      // Get workspace-specific roles OR organization-level roles
      query.andWhere(
        '(assignment.workspaceId = :workspaceId OR assignment.workspaceId IS NULL)',
        { workspaceId },
      );
    } else {
      // Get only organization-level roles
      query.andWhere('assignment.workspaceId IS NULL');
    }

    const assignments = await query.getMany();
    return assignments.map(a => a.role);
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(
    userId: string,
    organizationId: string,
    workspaceId?: string,
  ): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId, organizationId, workspaceId);
    
    // Combine all permissions from all roles
    const allPermissions = new Set<Permission>();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.add(permission as Permission);
      });
    });

    return Array.from(allPermissions);
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(
    userId: string,
    organizationId: string,
    roleName: UserRole,
    workspaceId?: string,
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId, organizationId, workspaceId);
    return roles.some(role => role.name === roleName);
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    organizationId: string,
    permission: Permission,
    workspaceId?: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId, workspaceId);
    return permissions.includes(permission);
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    organizationId: string,
    workspaceId: string | null,
    grantedBy: string,
    expiresAt?: Date,
  ): Promise<UserRoleAssignment> {
    const assignment = this.userRolesRepository.create({
      userId,
      roleId,
      organizationId,
      workspaceId,
      grantedBy,
      expiresAt,
    });

    await this.userRolesRepository.save(assignment);
    this.logger.log(`Assigned role ${roleId} to user ${userId} in org ${organizationId}`);

    return assignment;
  }

  /**
   * Remove role from user
   */
  async removeRole(
    userId: string,
    roleId: string,
    organizationId: string,
    workspaceId?: string,
  ): Promise<void> {
    const query = this.userRolesRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('roleId = :roleId', { roleId })
      .andWhere('organizationId = :organizationId', { organizationId });

    if (workspaceId) {
      query.andWhere('workspaceId = :workspaceId', { workspaceId });
    } else {
      query.andWhere('workspaceId IS NULL');
    }

    await query.execute();
    this.logger.log(`Removed role ${roleId} from user ${userId}`);
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: UserRole): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.rolesRepository.find({ order: { level: 'DESC' } });
  }

  /**
   * Create custom role
   */
  async createCustomRole(data: {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
    level?: number;
  }): Promise<Role> {
    const role = this.rolesRepository.create({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      permissions: data.permissions,
      level: data.level || 0,
      isSystem: false,
      isDefault: false,
    });

    await this.rolesRepository.save(role);
    this.logger.log(`Created custom role: ${role.name}`);

    return role;
  }

  /**
   * Update custom role
   */
  async updateCustomRole(
    roleId: string,
    data: {
      displayName?: string;
      description?: string;
      permissions?: string[];
      level?: number;
    },
  ): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot update system role');
    }

    if (data.displayName) role.displayName = data.displayName;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissions) role.permissions = data.permissions;
    if (data.level !== undefined) role.level = data.level;

    await this.rolesRepository.save(role);
    this.logger.log(`Updated custom role: ${role.name}`);

    return role;
  }

  /**
   * Delete custom role
   */
  async deleteCustomRole(roleId: string): Promise<void> {
    const role = await this.rolesRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    // Check if role is assigned to any users
    const assignmentCount = await this.userRolesRepository.count({
      where: { roleId },
    });

    if (assignmentCount > 0) {
      throw new Error(`Cannot delete role with ${assignmentCount} active assignments`);
    }

    await this.rolesRepository.delete(roleId);
    this.logger.log(`Deleted custom role: ${role.name}`);
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { id: roleId } });
  }
}
