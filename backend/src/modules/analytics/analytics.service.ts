import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyMetrics } from './entities/daily-metrics.entity';
import { AgentMetrics } from './entities/agent-metrics.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { MetricsService } from './metrics.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(DailyMetrics)
    private dailyMetricsRepository: Repository<DailyMetrics>,
    @InjectRepository(AgentMetrics)
    private agentMetricsRepository: Repository<AgentMetrics>,
    @InjectRepository(AnalyticsEvent)
    private analyticsEventsRepository: Repository<AnalyticsEvent>,
    private metricsService: MetricsService,
  ) {}

  /**
   * Get overview metrics for an organization
   */
  async getOverviewMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const metrics = await this.dailyMetricsRepository.find({
      where: {
        organizationId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    // Aggregate totals
    const totals = metrics.reduce(
      (acc, m) => ({
        totalMessages: acc.totalMessages + m.totalMessages,
        totalConversations: acc.totalConversations + m.totalConversations,
        totalTokens: acc.totalTokens + Number(m.totalTokens),
        uniqueUsers: Math.max(acc.uniqueUsers, m.uniqueUsers),
        avgResponseTime:
          (acc.avgResponseTime + Number(m.avgResponseTime)) / 2,
        agentCount: Math.max(acc.agentCount, m.agentCount),
        workflowExecutions: acc.workflowExecutions + m.workflowExecutions,
      }),
      {
        totalMessages: 0,
        totalConversations: 0,
        totalTokens: 0,
        uniqueUsers: 0,
        avgResponseTime: 0,
        agentCount: 0,
        workflowExecutions: 0,
      },
    );

    // Calculate changes (vs previous period)
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    const previousEndDate = new Date(startDate);

    const previousMetrics = await this.dailyMetricsRepository.find({
      where: {
        organizationId,
        date: Between(previousStartDate, previousEndDate),
      },
    });

    const previousTotals = previousMetrics.reduce(
      (acc, m) => ({
        totalMessages: acc.totalMessages + m.totalMessages,
        totalConversations: acc.totalConversations + m.totalConversations,
      }),
      {
        totalMessages: 0,
        totalConversations: 0,
      },
    );

    const messagesChange =
      previousTotals.totalMessages > 0
        ? ((totals.totalMessages - previousTotals.totalMessages) /
            previousTotals.totalMessages) *
          100
        : 0;

    const conversationsChange =
      previousTotals.totalConversations > 0
        ? ((totals.totalConversations - previousTotals.totalConversations) /
            previousTotals.totalConversations) *
          100
        : 0;

    return {
      current: totals,
      changes: {
        messagesChange: Math.round(messagesChange),
        conversationsChange: Math.round(conversationsChange),
      },
      timeSeries: metrics.map((m) => ({
        date: m.date,
        messages: m.totalMessages,
        conversations: m.totalConversations,
        tokens: m.totalTokens,
      })),
    };
  }

  /**
   * Get agent analytics
   */
  async getAgentAnalytics(
    agentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const metrics = await this.agentMetricsRepository.find({
      where: {
        agentId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    const totals = metrics.reduce(
      (acc, m) => ({
        conversationCount: acc.conversationCount + m.conversationCount,
        messageCount: acc.messageCount + m.messageCount,
        totalTokens: acc.totalTokens + Number(m.totalTokens),
        errorCount: acc.errorCount + m.errorCount,
        avgResponseTime:
          (acc.avgResponseTime + Number(m.avgResponseTime)) / 2,
        avgSatisfactionScore:
          m.satisfactionScore
            ? (acc.avgSatisfactionScore + Number(m.satisfactionScore)) / 2
            : acc.avgSatisfactionScore,
      }),
      {
        conversationCount: 0,
        messageCount: 0,
        totalTokens: 0,
        errorCount: 0,
        avgResponseTime: 0,
        avgSatisfactionScore: 0,
      },
    );

    return {
      agentId,
      summary: totals,
      timeSeries: metrics.map((m) => ({
        date: m.date,
        conversations: m.conversationCount,
        messages: m.messageCount,
        responseTime: m.avgResponseTime,
        satisfactionScore: m.satisfactionScore,
      })),
    };
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<any[]> {
    const results = await this.agentMetricsRepository
      .createQueryBuilder('metrics')
      .select('metrics.agent_id', 'agentId')
      .addSelect('SUM(metrics.conversation_count)', 'totalConversations')
      .addSelect('SUM(metrics.message_count)', 'totalMessages')
      .addSelect('AVG(metrics.avg_response_time)', 'avgResponseTime')
      .addSelect('AVG(metrics.satisfaction_score)', 'avgSatisfactionScore')
      .innerJoin('metrics.agent', 'agent')
      .addSelect('agent.name', 'agentName')
      .where('agent.organization_id = :organizationId', { organizationId })
      .andWhere('metrics.date >= :startDate', { startDate })
      .andWhere('metrics.date <= :endDate', { endDate })
      .groupBy('metrics.agent_id')
      .addGroupBy('agent.name')
      .orderBy('SUM(metrics.conversation_count)', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      agentId: r.agentId,
      agentName: r.agentName,
      conversationCount: parseInt(r.totalConversations, 10),
      messageCount: parseInt(r.totalMessages, 10),
      avgResponseTime: parseFloat(r.avgResponseTime || '0'),
      satisfactionScore: parseFloat(r.avgSatisfactionScore || '0'),
    }));
  }

  /**
   * Get usage trends (for billing context)
   */
  async getUsageTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const metrics = await this.dailyMetricsRepository.find({
      where: {
        organizationId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    return {
      dailyMessages: metrics.map((m) => ({
        date: m.date,
        count: m.totalMessages,
      })),
      dailyTokens: metrics.map((m) => ({
        date: m.date,
        count: m.totalTokens,
      })),
      dailyConversations: metrics.map((m) => ({
        date: m.date,
        count: m.totalConversations,
      })),
    };
  }

  /**
   * Get event counts for dashboard
   */
  async getEventCounts(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    return this.metricsService.getEventCounts(organizationId, startDate, endDate);
  }
}
