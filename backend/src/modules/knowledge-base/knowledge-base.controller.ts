import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto/data-source.dto';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private knowledgeBaseService: KnowledgeBaseService) {}

  @Get('data-sources')
  @ApiOperation({ summary: 'Get all data sources' })
  async findAllDataSources(@Request() req) {
    return this.knowledgeBaseService.findAllDataSources(req.user.organizationId);
  }

  @Get('data-sources/:id')
  @ApiOperation({ summary: 'Get data source by ID' })
  async findOneDataSource(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.findOneDataSource(id, req.user.organizationId);
  }

  @Post('data-sources')
  @ApiOperation({ summary: 'Create data source' })
  async createDataSource(@Body() createDto: CreateDataSourceDto, @Request() req) {
    return this.knowledgeBaseService.createDataSource(createDto, req.user.organizationId);
  }

  @Put('data-sources/:id')
  @ApiOperation({ summary: 'Update data source' })
  async updateDataSource(@Param('id') id: string, @Body() updateDto: UpdateDataSourceDto, @Request() req) {
    return this.knowledgeBaseService.updateDataSource(id, updateDto, req.user.organizationId);
  }

  @Delete('data-sources/:id')
  @ApiOperation({ summary: 'Delete data source' })
  async removeDataSource(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.removeDataSource(id, req.user.organizationId);
  }

  @Post('data-sources/:id/sync')
  @ApiOperation({ summary: 'Trigger sync for data source' })
  async syncDataSource(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.syncDataSource(id, req.user.organizationId);
  }
}
