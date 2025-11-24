import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  async findAll(@Request() req, @Query('workspaceId') workspaceId?: string) {
    return this.agentsService.findAll(req.user.organizationId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.agentsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create agent' })
  async create(@Body() createDto: CreateAgentDto, @Request() req) {
    return this.agentsService.create(createDto, req.user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAgentDto, @Request() req) {
    return this.agentsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.agentsService.remove(id, req.user.organizationId);
  }
}
