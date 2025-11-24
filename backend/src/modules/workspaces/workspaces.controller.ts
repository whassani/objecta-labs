import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

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
}
