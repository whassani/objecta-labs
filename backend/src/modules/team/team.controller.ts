import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { InviteUserDto, UpdateMemberRoleDto, AcceptInvitationDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('team')
@Controller('v1/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all team members' })
  async getTeamMembers(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.teamService.getTeamMembers(organizationId);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a user to the team' })
  async inviteUser(@Request() req, @Body() inviteUserDto: InviteUserDto) {
    const organizationId = req.user.organizationId;
    const invitedBy = req.user.userId;
    return this.teamService.inviteUser(organizationId, invitedBy, inviteUserDto);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending invitations' })
  async getPendingInvitations(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.teamService.getPendingInvitations(organizationId);
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an invitation' })
  async revokeInvitation(@Request() req, @Param('id') invitationId: string) {
    const organizationId = req.user.organizationId;
    await this.teamService.revokeInvitation(invitationId, organizationId);
    return { message: 'Invitation revoked successfully' };
  }

  @Post('accept-invitation')
  @Public()
  @ApiOperation({ summary: 'Accept team invitation' })
  async acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.teamService.acceptInvitation(acceptInvitationDto);
  }

  @Patch('members/:id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team member role' })
  async updateMemberRole(
    @Request() req,
    @Param('id') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.teamService.updateMemberRole(memberId, organizationId, updateMemberRoleDto);
  }

  @Delete('members/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove team member' })
  async removeMember(@Request() req, @Param('id') memberId: string) {
    const organizationId = req.user.organizationId;
    await this.teamService.removeMember(memberId, organizationId);
    return { message: 'Member removed successfully' };
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity feed' })
  async getActivityFeed(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const organizationId = req.user.organizationId;
    return this.teamService.getActivityFeed(organizationId, limit, offset);
  }
}
