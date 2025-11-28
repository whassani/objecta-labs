import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { InviteMemberDto, UpdateMemberRoleDto, AcceptInvitationDto } from './dto/workspace-member.dto';
import { WorkspaceMembersService } from './services/workspace-members.service';
import { WorkspaceAnalyticsService } from './services/workspace-analytics.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private workspacesService: WorkspacesService,
    private membersService: WorkspaceMembersService,
    private analyticsService: WorkspaceAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all workspaces' })
  async findAll(@Request() req) {
    return this.workspacesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workspacesService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  async create(@Body() createDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.create(createDto, req.user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workspace' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkspaceDto, @Request() req) {
    return this.workspacesService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.workspacesService.remove(id, req.user.organizationId);
  }

  // Members endpoints
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  async getMembers(@Param('id') id: string, @Request() req) {
    return this.membersService.getMembers(id, req.user.organizationId);
  }

  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite member to workspace' })
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteDto: InviteMemberDto,
    @Request() req,
  ) {
    return this.membersService.inviteMember(id, inviteDto, req.user.id, req.user.organizationId);
  }

  @Get(':id/members/invitations')
  @ApiOperation({ summary: 'Get pending invitations' })
  async getInvitations(@Param('id') id: string, @Request() req) {
    return this.membersService.getInvitations(id, req.user.organizationId);
  }

  @Post(':id/members/invitations/:invitationId/cancel')
  @ApiOperation({ summary: 'Cancel invitation' })
  async cancelInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req,
  ) {
    return this.membersService.cancelInvitation(invitationId, id);
  }

  @Post('members/accept-invitation')
  @ApiOperation({ summary: 'Accept workspace invitation' })
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto, @Request() req) {
    return this.membersService.acceptInvitation(acceptDto.token, req.user.id);
  }

  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Request() req,
  ) {
    return this.membersService.updateMemberRole(memberId, id, updateDto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.membersService.removeMember(memberId, id);
  }

  // Analytics endpoints
  @Get(':id/analytics/stats')
  @ApiOperation({ summary: 'Get workspace statistics' })
  async getStats(@Param('id') id: string, @Request() req) {
    return this.analyticsService.getWorkspaceStats(id);
  }

  @Get(':id/analytics/activity')
  @ApiOperation({ summary: 'Get activity timeline' })
  async getActivity(
    @Param('id') id: string,
    @Query('days') days: number = 30,
    @Request() req,
  ) {
    return this.analyticsService.getActivityTimeline(id, days);
  }

  @Get(':id/analytics/activity-by-type')
  @ApiOperation({ summary: 'Get activity by type' })
  async getActivityByType(
    @Param('id') id: string,
    @Query('days') days: number = 30,
    @Request() req,
  ) {
    return this.analyticsService.getActivityByType(id, days);
  }

  @Get(':id/analytics/daily-activity')
  @ApiOperation({ summary: 'Get daily activity' })
  async getDailyActivity(
    @Param('id') id: string,
    @Query('days') days: number = 30,
    @Request() req,
  ) {
    return this.analyticsService.getDailyActivity(id, days);
  }

  @Get(':id/analytics/most-active-users')
  @ApiOperation({ summary: 'Get most active users' })
  async getMostActiveUsers(
    @Param('id') id: string,
    @Query('days') days: number = 30,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.analyticsService.getMostActiveUsers(id, days, limit);
  }
}
