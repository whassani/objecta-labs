import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { ToolExecutorService } from './tool-executor.service';
import { TestHistoryService } from './test-history.service';
import { EnvironmentService } from './environment.service';
import { VersioningService } from './versioning.service';
import { AnalyticsService } from './analytics.service';
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
    private testHistoryService: TestHistoryService,
    private environmentService: EnvironmentService,
    private versioningService: VersioningService,
    private analyticsService: AnalyticsService,
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
  @ApiOperation({ summary: 'Test a tool and save to history' })
  async testTool(
    @Param('id') id: string,
    @Body() executeDto: ExecuteToolDto,
    @Request() req,
  ) {
    return this.toolExecutorService.testTool(
      id,
      executeDto.input,
      req.user.organizationId,
      req.user.id,
      true, // Save to history
    );
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a tool' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @Request() req,
  ) {
    return this.toolsService.duplicate(id, req.user.organizationId, body.name);
  }

  @Post('bulk/enable')
  @ApiOperation({ summary: 'Bulk enable tools' })
  async bulkEnable(@Body() body: { ids: string[] }, @Request() req) {
    await this.toolsService.bulkUpdateStatus(body.ids, true, req.user.organizationId);
    return { message: 'Tools enabled successfully' };
  }

  @Post('bulk/disable')
  @ApiOperation({ summary: 'Bulk disable tools' })
  async bulkDisable(@Body() body: { ids: string[] }, @Request() req) {
    await this.toolsService.bulkUpdateStatus(body.ids, false, req.user.organizationId);
    return { message: 'Tools disabled successfully' };
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete tools' })
  async bulkDeleteTools(@Body() body: { ids: string[] }, @Request() req) {
    await this.toolsService.bulkDelete(body.ids, req.user.organizationId);
    return { message: 'Tools deleted successfully' };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export tools as JSON' })
  async exportTools(@Body() body: { ids?: string[] }, @Request() req) {
    return this.toolsService.exportTools(body.ids || [], req.user.organizationId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import tools from JSON' })
  async importTools(@Body() body: { tools: CreateToolDto[] }, @Request() req) {
    return this.toolsService.importTools(body.tools, req.user.organizationId);
  }

  @Get('templates/list')
  @ApiOperation({ summary: 'Get tool templates' })
  async getTemplates() {
    return this.toolsService.getTemplates();
  }

  @Get(':id/test-history')
  @ApiOperation({ summary: 'Get test history for a tool' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getToolTestHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 20,
    @Request() req,
  ) {
    return this.testHistoryService.getToolTestHistory(
      id,
      req.user.organizationId,
      limit,
    );
  }

  @Get('test-history/recent')
  @ApiOperation({ summary: 'Get recent test executions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentTests(
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    return this.testHistoryService.getRecentTests(
      req.user.organizationId,
      limit,
    );
  }

  @Get('test-history/:executionId')
  @ApiOperation({ summary: 'Get a specific test execution' })
  async getTestExecution(
    @Param('executionId') executionId: string,
    @Request() req,
  ) {
    return this.testHistoryService.getTestExecution(
      executionId,
      req.user.organizationId,
    );
  }

  @Get(':id/test-stats')
  @ApiOperation({ summary: 'Get test statistics for a tool' })
  async getToolTestStats(@Param('id') id: string, @Request() req) {
    return this.testHistoryService.getToolTestStats(
      id,
      req.user.organizationId,
    );
  }

  // Phase 3: Environment Management
  @Get(':id/environments')
  @ApiOperation({ summary: 'Get environments for a tool' })
  async getEnvironments(@Param('id') id: string, @Request() req) {
    return this.environmentService.findAll(id, req.user.organizationId);
  }

  @Post(':id/environments')
  @ApiOperation({ summary: 'Create a new environment' })
  async createEnvironment(
    @Param('id') id: string,
    @Body() body: { name: string; config: any; description?: string; isActive?: boolean },
    @Request() req,
  ) {
    return this.environmentService.create(id, req.user.organizationId, body);
  }

  @Put(':id/environments/:envId')
  @ApiOperation({ summary: 'Update an environment' })
  async updateEnvironment(
    @Param('id') id: string,
    @Param('envId') envId: string,
    @Body() body: any,
    @Request() req,
  ) {
    return this.environmentService.update(envId, id, req.user.organizationId, body);
  }

  @Post(':id/environments/:envId/activate')
  @ApiOperation({ summary: 'Activate an environment' })
  async activateEnvironment(
    @Param('id') id: string,
    @Param('envId') envId: string,
    @Request() req,
  ) {
    return this.environmentService.setActive(envId, id, req.user.organizationId);
  }

  @Delete(':id/environments/:envId')
  @ApiOperation({ summary: 'Delete an environment' })
  async deleteEnvironment(
    @Param('id') id: string,
    @Param('envId') envId: string,
    @Request() req,
  ) {
    await this.environmentService.delete(envId, id, req.user.organizationId);
    return { message: 'Environment deleted successfully' };
  }

  // Phase 3: Versioning
  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a tool' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVersions(
    @Param('id') id: string,
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    return this.versioningService.getVersions(id, req.user.organizationId, limit);
  }

  @Get(':id/versions/history')
  @ApiOperation({ summary: 'Get version history with stats' })
  async getVersionHistory(@Param('id') id: string, @Request() req) {
    return this.versioningService.getVersionHistory(id, req.user.organizationId);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get a specific version' })
  async getVersion(
    @Param('id') id: string,
    @Param('version') version: number,
    @Request() req,
  ) {
    return this.versioningService.getVersion(id, version, req.user.organizationId);
  }

  @Post(':id/versions/:version/restore')
  @ApiOperation({ summary: 'Restore a tool to a previous version' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('version') version: number,
    @Request() req,
  ) {
    return this.versioningService.restoreVersion(
      id,
      version,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get(':id/versions/:v1/compare/:v2')
  @ApiOperation({ summary: 'Compare two versions' })
  async compareVersions(
    @Param('id') id: string,
    @Param('v1') v1: number,
    @Param('v2') v2: number,
    @Request() req,
  ) {
    return this.versioningService.compareVersions(id, v1, v2, req.user.organizationId);
  }

  // Phase 4: Analytics & Monitoring
  @Get('analytics/organization-stats')
  @ApiOperation({ summary: 'Get organization-wide usage statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getOrganizationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getOrganizationStats(req.user.organizationId, start, end);
  }

  @Get('analytics/tools-metrics')
  @ApiOperation({ summary: 'Get metrics for all tools' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getToolsMetrics(
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    return this.analyticsService.getToolsMetrics(req.user.organizationId, limit);
  }

  @Get('analytics/time-series')
  @ApiOperation({ summary: 'Get time series data for charts' })
  @ApiQuery({ name: 'toolId', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getTimeSeriesData(
    @Query('toolId') toolId?: string,
    @Query('days') days: number = 30,
    @Request() req?,
  ) {
    return this.analyticsService.getTimeSeriesData(req.user.organizationId, toolId, days);
  }

  @Get('analytics/error-breakdown')
  @ApiOperation({ summary: 'Get error breakdown and analysis' })
  @ApiQuery({ name: 'toolId', required: false, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getErrorBreakdown(
    @Query('toolId') toolId?: string,
    @Query('days') days: number = 30,
    @Request() req?,
  ) {
    return this.analyticsService.getErrorBreakdown(req.user.organizationId, toolId, days);
  }

  @Get(':id/analytics/performance')
  @ApiOperation({ summary: 'Get performance percentiles for a tool' })
  async getPerformancePercentiles(@Param('id') id: string, @Request() req) {
    return this.analyticsService.getPerformancePercentiles(req.user.organizationId, id);
  }

  @Get(':id/analytics/rate-limit')
  @ApiOperation({ summary: 'Get rate limit usage statistics' })
  async getRateLimitStats(@Param('id') id: string, @Request() req) {
    return this.analyticsService.getRateLimitStats(id, req.user.organizationId);
  }
}
