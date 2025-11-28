import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { MetricsService } from './metrics.service';
import { TrackEventDto, AnalyticsQueryDto, AgentAnalyticsQueryDto } from './dto/analytics.dto';
import { BillingAnalyticsQueryDto } from './dto/billing-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('v1/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly metricsService: MetricsService,
  ) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(@Request() req, @Body() trackEventDto: TrackEventDto) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    await this.metricsService.trackEvent(organizationId, userId, trackEventDto);
    return { success: true };
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview analytics' })
  async getOverview(@Request() req, @Query() query: AnalyticsQueryDto) {
    const organizationId = req.user.organizationId;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return this.analyticsService.getOverviewMetrics(
      organizationId,
      startDate,
      endDate,
    );
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: 'Get agent analytics' })
  async getAgentAnalytics(
    @Param('agentId') agentId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getAgentAnalytics(agentId, startDate, endDate);
  }

  @Get('top-agents')
  @ApiOperation({ summary: 'Get top performing agents' })
  async getTopAgents(@Request() req, @Query() query: AnalyticsQueryDto) {
    const organizationId = req.user.organizationId;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const limit = query.limit || 10;

    return this.analyticsService.getTopAgents(
      organizationId,
      startDate,
      endDate,
      limit,
    );
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage trends' })
  async getUsageTrends(@Request() req, @Query() query: AnalyticsQueryDto) {
    const organizationId = req.user.organizationId;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getUsageTrends(
      organizationId,
      startDate,
      endDate,
    );
  }

  @Get('events')
  @ApiOperation({ summary: 'Get analytics events' })
  async getEvents(@Request() req, @Query() query: AnalyticsQueryDto) {
    const organizationId = req.user.organizationId;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    return this.metricsService.getEvents(
      organizationId,
      startDate,
      endDate,
      undefined,
      query.limit || 100,
    );
  }

  @Get('event-counts')
  @ApiOperation({ summary: 'Get event counts by type' })
  async getEventCounts(@Request() req, @Query() query: AnalyticsQueryDto) {
    const organizationId = req.user.organizationId;
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.analyticsService.getEventCounts(
      organizationId,
      startDate,
      endDate,
    );
  }

  @Get('billing')
  @ApiOperation({ summary: 'Get billing analytics (token usage and costs)' })
  async getBillingAnalytics(
    @Request() req,
    @Query() query: BillingAnalyticsQueryDto,
  ) {
    return this.analyticsService.getBillingAnalytics(
      req.user.organizationId,
      req.user.id,
      query,
    );
  }
}
