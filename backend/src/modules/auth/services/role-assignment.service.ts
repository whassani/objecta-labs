import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRoleAssignment } from '../entities/user-role.entity';

/**
 * Service for managing role assignments
 * Uses TypeORM repositories to ensure consistency with entity definitions
 */
@Injectable()
export class RoleAssignmentService {
  private readonly logger = new Logger(RoleAssignmentService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserRoleAssignment)
    private assignmentsRepository: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Assign a role to a user by email
   */
  async assignRoleByEmail(
    email: string,
    roleName: string,
    grantedBy?: string,
  ): Promise<{
    user: User;
    role: Role;
    assignment: UserRoleAssignment;
    isNew: boolean;
  }> {
    // Find user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User not found: ${email}`);
    }

    // Find role
    const role = await this.rolesRepository.findOne({
      where: { name: roleName.toLowerCase() },
    });
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }

    // Check if already assigned
    const existing = await this.assignmentsRepository.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
        organizationId: user.organizationId,
      },
    });

    if (existing) {
      this.logger.log(`User ${email} already has role ${roleName}`);
      return { user, role, assignment: existing, isNew: false };
    }

    // Create assignment
    const assignment = this.assignmentsRepository.create({
      userId: user.id,
      roleId: role.id,
      organizationId: user.organizationId,
      workspaceId: null,
      grantedBy: grantedBy || user.id,
      expiresAt: null,
    });

    await this.assignmentsRepository.save(assignment);
    this.logger.log(`Assigned role ${roleName} to user ${email}`);

    return { user, role, assignment, isNew: true };
  }

  /**
   * Remove a role from a user by email
   */
  async removeRoleByEmail(email: string, roleName: string): Promise<boolean> {
    // Find user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User not found: ${email}`);
    }

    // Find role
    const role = await this.rolesRepository.findOne({
      where: { name: roleName.toLowerCase() },
    });
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }

    // Delete assignment
    const result = await this.assignmentsRepository.delete({
      userId: user.id,
      roleId: role.id,
      organizationId: user.organizationId,
    });

    const removed = result.affected > 0;
    if (removed) {
      this.logger.log(`Removed role ${roleName} from user ${email}`);
    } else {
      this.logger.log(`User ${email} didn't have role ${roleName}`);
    }

    return removed;
  }

  /**
   * Get all roles for a user by email
   */
  async getUserRolesByEmail(email: string): Promise<{
    user: User;
    roles: Role[];
    assignments: UserRoleAssignment[];
  }> {
    // Find user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User not found: ${email}`);
    }

    // Get assignments with roles
    const assignments = await this.assignmentsRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roles = assignments.map(a => a.role);

    return { user, roles, assignments };
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(roleName: string): Promise<{
    role: Role;
    users: User[];
  }> {
    const role = await this.rolesRepository.findOne({
      where: { name: roleName.toLowerCase() },
    });
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }

    const assignments = await this.assignmentsRepository.find({
      where: { roleId: role.id },
      relations: ['user'],
    });

    const users = assignments.map(a => a.user);

    return { role, users };
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.rolesRepository.find({ order: { level: 'DESC' } });
  }

  /**
   * Check if user has a specific role
   */
  async userHasRole(email: string, roleName: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return false;

    const role = await this.rolesRepository.findOne({
      where: { name: roleName.toLowerCase() },
    });
    if (!role) return false;

    const assignment = await this.assignmentsRepository.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
        organizationId: user.organizationId,
      },
    });

    return !!assignment;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(email: string): Promise<string[]> {
    const { roles } = await this.getUserRolesByEmail(email);
    
    // Combine all permissions from all roles (using Set to avoid duplicates)
    const permissionsSet = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => permissionsSet.add(permission));
    });

    return Array.from(permissionsSet).sort();
  }
}
