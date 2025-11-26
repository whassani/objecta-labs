import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, UserPayload } from '../auth/decorators/current-user.decorator';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @RequirePermissions('agents:read')
  @ApiOperation({ summary: 'Get all agents' })
  async findAll(@CurrentUser() user: UserPayload, @Query('workspaceId') workspaceId?: string) {
    return this.agentsService.findAll(user.organizationId, workspaceId);
  }

  @Get(':id')
  @RequirePermissions('agents:read')
  @ApiOperation({ summary: 'Get agent by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    // Validate UUID format to prevent "new" or other strings being passed
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // Return 404 for invalid UUID format (like "new", "edit", etc.)
      throw new Error('Invalid agent ID format');
    }
    return this.agentsService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles('admin', 'editor')
  @RequirePermissions('agents:create')
  @ApiOperation({ summary: 'Create agent' })
  async create(@Body() createDto: CreateAgentDto, @CurrentUser() user: UserPayload) {
    return this.agentsService.create(createDto, user.organizationId);
  }

  @Put(':id')
  @Roles('admin', 'editor')
  @RequirePermissions('agents:update')
  @ApiOperation({ summary: 'Update agent' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAgentDto, @CurrentUser() user: UserPayload) {
    return this.agentsService.update(id, updateDto, user.organizationId);
  }

  @Delete(':id')
  @Roles('admin', 'editor')
  @RequirePermissions('agents:delete')
  @ApiOperation({ summary: 'Delete agent' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.agentsService.remove(id, user.organizationId);
  }

  @Get('available-models/list')
  @RequirePermissions('agents:read')
  @ApiOperation({ summary: 'Get available models including fine-tuned models' })
  async getAvailableModels(@CurrentUser() user: UserPayload) {
    return this.agentsService.getAvailableModels(user.organizationId);
  }
}
