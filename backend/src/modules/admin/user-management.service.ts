import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, IsNull } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PlatformUser } from './entities/platform-user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, UserQueryDto, CreateOrganizationDto, UserType } from './dto/user-management.dto';
import { UserHelperService } from '../auth/services/user-helper.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private userHelperService: UserHelperService,
  ) {}

  async findAll(query: UserQueryDto) {
    const { search, organizationId, role, status, page = 1, limit = 20 } = query;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .orderBy('user.createdAt', 'DESC');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Organization filter - special handling for platform team
    if (organizationId === 'platform_team') {
      queryBuilder.andWhere('user.organizationId IS NULL');
    } else if (organizationId) {
      queryBuilder.andWhere('user.organizationId = :organizationId', { organizationId });
    }

    // Role filter - Note: Should use RBAC system instead
    // Skipping role filter as we're using RBAC now

    // Status filter
    if (status === 'active') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    } else if (status === 'inactive') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users: users.map(user => this.userHelperService.sanitizeUserResponse(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userHelperService.sanitizeUserResponse(user);
  }

  async create(createUserDto: CreateUserDto) {
    // Determine if this is a platform team member
    const isPlatformTeam = createUserDto.userType === UserType.PLATFORM_TEAM;

    // Check if email already exists in the appropriate table
    if (isPlatformTeam) {
      const existingPlatformUser = await this.platformUserRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingPlatformUser) {
        throw new BadRequestException('Email already exists in platform users');
      }
    } else {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // For platform team members, save to platform_users table
    if (isPlatformTeam) {
      // Hash password
      const passwordHash = await bcrypt.hash(createUserDto.password, 10);

      // Create platform user
      const platformUser = this.platformUserRepository.create({
        email: createUserDto.email,
        fullName: `${createUserDto.firstName} ${createUserDto.lastName}`.trim(),
        passwordHash,
        adminRole: createUserDto.adminRole || 'admin',
        isActive: true,
      });

      const savedPlatformUser = await this.platformUserRepository.save(platformUser);
      return {
        id: savedPlatformUser.id,
        email: savedPlatformUser.email,
        fullName: savedPlatformUser.fullName,
        adminRole: savedPlatformUser.adminRole,
        isActive: savedPlatformUser.isActive,
        createdAt: savedPlatformUser.createdAt,
        userType: 'platform_team',
      };
    }

    // For customer users, organization is required
    if (!createUserDto.organizationId) {
      throw new BadRequestException('Organization is required for customer users');
    }

    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: createUserDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Create customer user
    const user = this.userRepository.create({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      passwordHash,
      organizationId: createUserDto.organizationId,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);
    return this.userHelperService.sanitizeUserResponse(savedUser);
  }

  async createOrganization(createOrgDto: CreateOrganizationDto) {
    // Generate subdomain with timestamp to ensure uniqueness (same as register flow)
    const baseSubdomain = createOrgDto.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 50);
    const subdomain = baseSubdomain + '-' + Date.now();

    // Create organization
    const organization = this.organizationRepository.create({
      name: createOrgDto.name,
      subdomain: subdomain,
      plan: createOrgDto.plan || 'starter',
      planStatus: 'trial',
      isActive: true,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    const savedOrg = await this.organizationRepository.save(organization);
    return savedOrg;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If changing email, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // If changing organization, check if it exists
    if (updateUserDto.organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: updateUserDto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
    }

    // Update user - ensure fullName is set if firstName/lastName changed
    const updateData = this.userHelperService.prepareUserForSave(updateUserDto);
    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    return this.userHelperService.sanitizeUserResponse(updatedUser);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return { message: 'User deleted successfully' };
  }

  async suspend(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'User suspended successfully', user: this.userHelperService.sanitizeUserResponse(user) };
  }

  async activate(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    await this.userRepository.save(user);

    return { message: 'User activated successfully', user: this.userHelperService.sanitizeUserResponse(user) };
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const inactiveUsers = await this.userRepository.count({ where: { isActive: false } });
    
    // Count platform users from platform_users table
    const platformUsers = await this.platformUserRepository.count();

    // Users created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Note: Users by role should use RBAC system
    // Returning stats without role breakdown for now

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      platformUsers,
      newUsersThisMonth,
      usersByRole: [], // TODO: Implement via RBAC system
    };
  }

  // DEPRECATED: Use userHelperService.sanitizeUserResponse instead
  private sanitizeUser(user: User) {
    return this.userHelperService.sanitizeUserResponse(user);
  }
}
