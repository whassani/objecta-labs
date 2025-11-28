import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { RegisterDto } from './dto/auth.dto';
import { RbacService } from './services/rbac.service';
import { UserHelperService } from './services/user-helper.service';
import { UserRole } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private jwtService: JwtService,
    private rbacService: RbacService,
    private userHelperService: UserHelperService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create organization first
    const organizationName = registerDto.organizationName || `${registerDto.firstName}'s Organization`;
    const subdomain = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    
    const organization = this.organizationsRepository.create({
      name: organizationName,
      subdomain: subdomain + '-' + Date.now(), // Ensure uniqueness
      plan: 'starter',
      planStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    });

    const savedOrganization = await this.organizationsRepository.save(organization);

    // Create user with organization
    const user = this.usersRepository.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      passwordHash: hashedPassword,
      organizationId: savedOrganization.id,
    });

    const savedUser = await this.usersRepository.save(user);

    // Assign default editor role to first user
    const editorRole = await this.rbacService.getRoleByName(UserRole.EDITOR);
    if (editorRole) {
      await this.rbacService.assignRole(
        savedUser.id,
        editorRole.id,
        savedOrganization.id,
        null, // Organization-level
        savedUser.id, // Self-granted on registration
      );
    }

    // Generate token
    const token = await this.generateToken(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return this.sanitizeUser(user);
    }

    return null;
  }

  async login(user: any) {
    const token = await this.generateToken(user);

    return {
      user,
      token,
    };
  }

  private async generateToken(user: User) {
    // Get user's roles and permissions
    const roles = await this.rbacService.getUserRoles(user.id, user.organizationId);
    const permissions = await this.rbacService.getUserPermissions(user.id, user.organizationId);

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: roles.map(r => r.name),
      permissions,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, verificationToken, resetToken, ...result } = user;
    // Use helper to ensure backward compatibility with firstName/lastName
    return this.userHelperService.sanitizeUserResponse(result as User);
  }
}
