import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformUser } from './entities/platform-user.entity';
import * as bcrypt from 'bcrypt';

@ApiTags('admin-platform-users')
@Controller('v1/admin/platform-users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class PlatformUsersController {
  constructor(
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform users (admins/staff)' })
  async findAll() {
    const users = await this.platformUserRepository.find({
      select: ['id', 'email', 'fullName', 'adminRole', 'isActive', 'lastLoginAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    return users.map(user => ({
      ...user,
      type: 'platform',
      roles: [user.adminRole],
    }));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform user statistics' })
  async getStats() {
    const total = await this.platformUserRepository.count();
    const active = await this.platformUserRepository.count({
      where: { isActive: true },
    });
    const superAdmins = await this.platformUserRepository.count({
      where: { adminRole: 'super_admin' },
    });
    const admins = await this.platformUserRepository.count({
      where: { adminRole: 'admin' },
    });
    const support = await this.platformUserRepository.count({
      where: { adminRole: 'support' },
    });

    return {
      total,
      active,
      inactive: total - active,
      byRole: {
        super_admin: superAdmins,
        admin: admins,
        support: support,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get platform user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.platformUserRepository.findOne({
      where: { id },
      select: ['id', 'email', 'fullName', 'adminRole', 'isActive', 'lastLoginAt', 'createdAt'],
    });

    if (!user) {
      throw new ForbiddenException('Platform user not found');
    }

    return {
      ...user,
      type: 'platform',
      roles: [user.adminRole],
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new platform user (super admin only)' })
  async create(
    @Body() createDto: {
      email: string;
      password: string;
      fullName: string;
      adminRole: 'super_admin' | 'admin' | 'support';
    },
    @Request() req,
  ) {
    // Only super admins can create platform users
    if (req.user.adminRole !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create platform users');
    }

    // Check if user already exists
    const existing = await this.platformUserRepository.findOne({
      where: { email: createDto.email },
    });

    if (existing) {
      throw new ForbiddenException('Platform user with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const newUser = this.platformUserRepository.create({
      email: createDto.email,
      passwordHash,
      fullName: createDto.fullName,
      adminRole: createDto.adminRole,
      isActive: true,
    });

    const saved = await this.platformUserRepository.save(newUser);

    // Don't return password hash
    const { passwordHash: _, ...result } = saved;
    return {
      ...result,
      type: 'platform',
      roles: [result.adminRole],
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update platform user' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: {
      fullName?: string;
      adminRole?: 'super_admin' | 'admin' | 'support';
      isActive?: boolean;
    },
    @Request() req,
  ) {
    const user = await this.platformUserRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new ForbiddenException('Platform user not found');
    }

    // Only super admins can change roles or deactivate users
    if (updateDto.adminRole || updateDto.isActive !== undefined) {
      if (req.user.adminRole !== 'super_admin') {
        throw new ForbiddenException('Only super admins can change roles or activation status');
      }
    }

    // Prevent user from deactivating themselves
    if (updateDto.isActive === false && req.user.userId === id) {
      throw new ForbiddenException('You cannot deactivate yourself');
    }

    if (updateDto.fullName) user.fullName = updateDto.fullName;
    if (updateDto.adminRole) user.adminRole = updateDto.adminRole;
    if (updateDto.isActive !== undefined) user.isActive = updateDto.isActive;

    const updated = await this.platformUserRepository.save(user);
    const { passwordHash: _, ...result } = updated;
    
    return {
      ...result,
      type: 'platform',
      roles: [result.adminRole],
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete platform user (super admin only)' })
  async remove(@Param('id') id: string, @Request() req) {
    // Only super admins can delete platform users
    if (req.user.adminRole !== 'super_admin') {
      throw new ForbiddenException('Only super admins can delete platform users');
    }

    // Prevent user from deleting themselves
    if (req.user.userId === id) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    const user = await this.platformUserRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new ForbiddenException('Platform user not found');
    }

    await this.platformUserRepository.remove(user);
    return { success: true, message: 'Platform user deleted successfully' };
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset platform user password (super admin only)' })
  async resetPassword(
    @Param('id') id: string,
    @Body() resetDto: { newPassword: string },
    @Request() req,
  ) {
    // Only super admins can reset passwords
    if (req.user.adminRole !== 'super_admin') {
      throw new ForbiddenException('Only super admins can reset passwords');
    }

    const user = await this.platformUserRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new ForbiddenException('Platform user not found');
    }

    const passwordHash = await bcrypt.hash(resetDto.newPassword, 10);
    user.passwordHash = passwordHash;

    await this.platformUserRepository.save(user);
    return { success: true, message: 'Password reset successfully' };
  }
}
