import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@ApiTags('tools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(private toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tools' })
  async findAll(@Request() req) {
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
}
