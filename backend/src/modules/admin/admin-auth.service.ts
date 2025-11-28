import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PlatformUser } from './entities/platform-user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlatformUser)
    private platformUserRepository: Repository<PlatformUser>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    // First, try to find in platform_users table (dedicated platform accounts)
    const platformUser = await this.platformUserRepository.findOne({
      where: { email },
    });

    if (platformUser) {
      // Found in platform_users table
      const isPasswordValid = await bcrypt.compare(password, platformUser.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Check if platform account is active
      if (platformUser.isActive === false) {
        throw new UnauthorizedException('Platform account is disabled');
      }

      const { passwordHash, ...result } = platformUser;
      return {
        ...result,
        isAdmin: true,
        adminRole: platformUser.adminRole || 'admin',
      };
    }

    // Second, try to find in users table (regular users with admin flag)
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      // Check if user has admin privileges
      if (!(user as any).isAdmin) {
        throw new UnauthorizedException('Admin access required');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Check if admin account is active
      if (user.isActive === false) {
        throw new UnauthorizedException('Admin account is disabled');
      }

      const { passwordHash, ...result } = user;
      return result;
    }

    // Not found in either table
    throw new UnauthorizedException('Admin account not found');
  }

  async login(admin: any) {
    const payload = {
      email: admin.email,
      sub: admin.id,
      userId: admin.id,
      organizationId: admin.organizationId,
      isAdmin: true,
      adminRole: admin.adminRole,
      type: 'admin', // Distinguish from regular user tokens
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '8h', // Shorter expiry for admin tokens
      }),
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        adminRole: admin.adminRole,
        isAdmin: true,
      },
    };
  }
}
