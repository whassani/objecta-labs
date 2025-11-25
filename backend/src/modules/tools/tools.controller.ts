import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { ToolExecutorService } from './tool-executor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { ExecuteToolDto } from './dto/execute-tool.dto';

@ApiTags('tools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(
    private toolsService: ToolsService,
    private toolExecutorService: ToolExecutorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tools' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  async findAll(@Request() req, @Query('agentId') agentId?: string) {
    if (agentId) {
      return this.toolExecutorService.getAgentTools(agentId, req.user.organizationId);
    }
    return this.toolsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tool by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.toolsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create tool' })
  async create(@Body() createDto: CreateToolDto, @Request() req) {
    return this.toolsService.create(createDto, req.user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tool' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateToolDto, @Request() req) {
    return this.toolsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tool' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.toolsService.remove(id, req.user.organizationId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a tool' })
  async executeTool(
    @Param('id') id: string,
    @Body() executeDto: ExecuteToolDto,
    @Request() req,
  ) {
    return this.toolExecutorService.executeTool(
      id,
      executeDto.input,
      req.user.organizationId,
    );
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a tool without saving execution' })
  async testTool(
    @Param('id') id: string,
    @Body() executeDto: ExecuteToolDto,
    @Request() req,
  ) {
    return this.toolExecutorService.testTool(
      id,
      executeDto.input,
      req.user.organizationId,
    );
  }
}
