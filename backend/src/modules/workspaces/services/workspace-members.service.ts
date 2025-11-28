import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { User } from '../../auth/entities/user.entity';
import { InviteMemberDto, UpdateMemberRoleDto } from '../dto/workspace-member.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
    @InjectRepository(WorkspaceInvitation)
    private invitationsRepository: Repository<WorkspaceInvitation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getMembers(workspaceId: string, organizationId: string): Promise<any[]> {
    const members = await this.membersRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      email: member.user?.email,
      firstName: member.user?.firstName,
      lastName: member.user?.lastName,
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }

  async inviteMember(
    workspaceId: string,
    inviteDto: InviteMemberDto,
    inviterId: string,
    organizationId: string,
  ): Promise<WorkspaceInvitation> {
    // Check if user already exists in the workspace
    const existingMember = await this.membersRepository.findOne({
      where: { workspaceId },
      relations: ['user'],
    });

    if (existingMember && existingMember.user?.email === inviteDto.email) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        workspaceId,
        email: inviteDto.email,
        status: 'pending',
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('An invitation has already been sent to this email');
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = this.invitationsRepository.create({
      workspaceId,
      email: inviteDto.email,
      role: inviteDto.role || 'member',
      invitedBy: inviterId,
      token,
      expiresAt,
    });

    return this.invitationsRepository.save(invitation);
  }

  async getInvitations(workspaceId: string, organizationId: string): Promise<WorkspaceInvitation[]> {
    return this.invitationsRepository.find({
      where: { workspaceId },
      relations: ['inviter'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<WorkspaceMember> {
    const invitation = await this.invitationsRepository.findOne({
      where: { token, status: 'pending' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already used');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await this.invitationsRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Create member
    const member = this.membersRepository.create({
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    const savedMember = await this.membersRepository.save(member);

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await this.invitationsRepository.save(invitation);

    return savedMember;
  }

  async cancelInvitation(invitationId: string, workspaceId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId, workspaceId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = 'cancelled';
    await this.invitationsRepository.save(invitation);
  }

  async updateMemberRole(
    memberId: string,
    workspaceId: string,
    updateDto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMember> {
    const member = await this.membersRepository.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.role = updateDto.role;
    return this.membersRepository.save(member);
  }

  async removeMember(memberId: string, workspaceId: string): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.membersRepository.delete(memberId);
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    const member = await this.membersRepository.findOne({
      where: { workspaceId, userId },
    });

    return member?.role || null;
  }
}
