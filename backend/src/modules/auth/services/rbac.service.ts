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
}
