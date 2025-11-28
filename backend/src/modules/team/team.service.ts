import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TeamInvitation } from './entities/team-invitation.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { User } from '../auth/entities/user.entity';
import { InviteUserDto, UpdateMemberRoleDto, AcceptInvitationDto } from './dto/team.dto';
import { EmailService } from '../email/email.service';
import { UserHelperService } from '../auth/services/user-helper.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(TeamInvitation)
    private invitationsRepository: Repository<TeamInvitation>,
    @InjectRepository(ActivityLog)
    private activityLogsRepository: Repository<ActivityLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
    private userHelperService: UserHelperService,
  ) {}

  /**
   * Get all team members for an organization
   */
  async getTeamMembers(organizationId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { organizationId },
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Invite a user to the team
   */
  async inviteUser(
    organizationId: string,
    invitedBy: string,
    dto: InviteUserDto,
  ): Promise<TeamInvitation> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email, organizationId },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in the organization');
    }

    // Check for pending invitation
    const pendingInvitation = await this.invitationsRepository.findOne({
      where: {
        email: dto.email,
        organizationId,
        status: 'pending',
      },
    });

    if (pendingInvitation) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationsRepository.create({
      organizationId,
      invitedBy,
      email: dto.email,
      role: dto.role,
      token,
      expiresAt,
    });

    await this.invitationsRepository.save(invitation);

    // Log activity
    await this.logActivity({
      organizationId,
      userId: invitedBy,
      actorName: 'User', // Will be enhanced with actual name
      actionType: 'invited',
      resourceType: 'user',
      resourceName: dto.email,
      metadata: { role: dto.role },
    });

    // Send invitation email
    try {
      const inviter = await this.usersRepository.findOne({
        where: { id: invitedBy },
      });

      const inviterName = inviter?.email || 'Team Admin';
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const invitationUrl = `${frontendUrl}/team/accept-invitation?token=${token}`;
      
      await this.emailService.sendTeamInvitation({
        email: dto.email,
        inviterName,
        organizationName: organizationId, // TODO: Get actual organization name
        role: dto.role,
        invitationUrl,
        expiresAt: expiresAt.toLocaleDateString(),
        message: dto.message,
      });

      this.logger.log(`Invitation email sent to ${dto.email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't fail the invitation creation if email fails
    }

    this.logger.log(`Invitation sent to ${dto.email} for organization ${organizationId}`);

    return invitation;
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(organizationId: string): Promise<TeamInvitation[]> {
    return this.invitationsRepository.find({
      where: { organizationId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string, organizationId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId, organizationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = 'revoked';
    await this.invitationsRepository.save(invitation);

    // Log activity
    await this.logActivity({
      organizationId,
      actorName: 'System',
      actionType: 'revoked',
      resourceType: 'invitation',
      resourceName: invitation.email,
    });
  }

  /**
   * Accept invitation and create user account
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<User> {
    const invitation = await this.invitationsRepository.findOne({
      where: { token: dto.token },
      relations: ['organization'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await this.invitationsRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      organizationId: invitation.organizationId,
      email: invitation.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      isActive: true,
    });

    await this.usersRepository.save(user);

    // Update invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    // Log activity
    await this.logActivity({
      organizationId: invitation.organizationId,
      userId: user.id,
      actorName: this.userHelperService.getFullName(user),
      actionType: 'joined',
      resourceType: 'user',
      resourceName: user.email,
    });

    return user;
  }

  /**
   * Update team member role
   */
  async updateMemberRole(
    memberId: string,
    organizationId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Note: Role assignment should use RBAC system (RoleAssignmentService)
    // This is a placeholder - implement proper RBAC role assignment
    
    await this.usersRepository.save(user);

    // Log activity
    await this.logActivity({
      organizationId,
      actorName: 'Admin',
      actionType: 'updated',
      resourceType: 'user',
      resourceId: user.id,
      resourceName: user.email,
      metadata: { action: 'role_update_via_rbac' },
    });

    return user;
  }

  /**
   * Remove team member
   */
  async removeMember(memberId: string, organizationId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent removing the owner (check via RBAC system)
    // Note: Implement proper RBAC check here using RoleAssignmentService
    // For now, allow removal (should be protected at controller level)

    // Soft delete (set inactive)
    user.isActive = false;
    await this.usersRepository.save(user);

    // Log activity
    await this.logActivity({
      organizationId,
      actorName: 'Admin',
      actionType: 'removed',
      resourceType: 'user',
      resourceId: user.id,
      resourceName: user.email,
    });
  }

  /**
   * Get activity feed
   */
  async getActivityFeed(
    organizationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ActivityLog[]> {
    return this.activityLogsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Log activity
   */
  async logActivity(data: {
    organizationId: string;
    userId?: string;
    actorName: string;
    actionType: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    metadata?: any;
    ipAddress?: string;
  }): Promise<void> {
    const log = this.activityLogsRepository.create(data);
    await this.activityLogsRepository.save(log);
  }
}
