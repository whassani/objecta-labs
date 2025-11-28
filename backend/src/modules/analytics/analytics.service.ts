import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyMetrics } from './entities/daily-metrics.entity';
import { AgentMetrics } from './entities/agent-metrics.entity';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { ConversationMetrics } from '../conversations/entities/conversation-metrics.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Agent } from '../agents/entities/agent.entity';
import { MetricsService } from './metrics.service';
import {
  BillingAnalyticsQueryDto,
  BillingAnalyticsResponse,
  TokenUsageByDay,
  TokenUsageByAgent,
  TokenUsageByModel,
  BillingPeriod,
} from './dto/billing-analytics.dto';

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
    @InjectRepository(ConversationMetrics)
    private conversationMetricsRepository: Repository<ConversationMetrics>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
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

  /**
   * Get billing analytics (token usage and costs)
   */
  async getBillingAnalytics(
    organizationId: string,
    userId: string,
    query: BillingAnalyticsQueryDto
  ): Promise<BillingAnalyticsResponse> {
    const { startDate, endDate } = this.getDateRange(query.period, query.startDate, query.endDate);

    // Get user's conversations
    const conversations = await this.conversationRepository.find({
      where: { userId },
      select: ['id', 'title'],
    });

    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) {
      return this.getEmptyBillingResponse();
    }

    // Get all metrics in date range
    const metrics = await this.conversationMetricsRepository
      .createQueryBuilder('m')
      .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
      .andWhere('m.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .leftJoinAndSelect('m.conversation', 'conversation')
      .leftJoinAndSelect('conversation.agent', 'agent')
      .getMany();

    // Calculate summary
    const summary = this.calculateSummary(metrics, conversations.length);

    // Usage by day
    const usageByDay = this.calculateUsageByDay(metrics);

    // Usage by agent
    const usageByAgent = await this.calculateUsageByAgent(metrics);

    // Usage by model
    const usageByModel = this.calculateUsageByModel(metrics);

    // Top conversations
    const topConversations = this.calculateTopConversations(metrics, conversations);

    return {
      summary,
      usageByDay,
      usageByAgent,
      usageByModel,
      topConversations,
    };
  }

  private getDateRange(period: BillingPeriod, startDate?: string, endDate?: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case BillingPeriod.TODAY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case BillingPeriod.WEEK:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case BillingPeriod.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case BillingPeriod.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case BillingPeriod.CUSTOM:
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = endDate ? new Date(endDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate: start, endDate: end };
  }

  private calculateSummary(metrics: any[], conversationCount: number) {
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalCost = metrics.reduce((sum, m) => sum + Number(m.cost), 0);
    const totalMessages = metrics.length;

    return {
      totalTokens,
      totalCost,
      totalMessages,
      totalConversations: conversationCount,
      avgTokensPerMessage: totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0,
      avgCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
    };
  }

  private calculateUsageByDay(metrics: any[]): TokenUsageByDay[] {
    const byDay = new Map<string, TokenUsageByDay>();

    metrics.forEach(m => {
      const date = m.createdAt.toISOString().split('T')[0];
      
      if (!byDay.has(date)) {
        byDay.set(date, {
          date,
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          messageCount: 0,
        });
      }

      const day = byDay.get(date)!;
      day.totalTokens += m.totalTokens;
      day.promptTokens += m.promptTokens;
      day.completionTokens += m.completionTokens;
      day.cost += Number(m.cost);
      day.messageCount += 1;
    });

    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateUsageByAgent(metrics: any[]): Promise<TokenUsageByAgent[]> {
    const byAgent = new Map<string, TokenUsageByAgent>();

    metrics.forEach(m => {
      const agent = m.conversation?.agent;
      if (!agent) return;

      const agentId = agent.id;
      
      if (!byAgent.has(agentId)) {
        byAgent.set(agentId, {
          agentId,
          agentName: agent.name,
          totalTokens: 0,
          cost: 0,
          messageCount: 0,
          conversationCount: 0,
        });
      }

      const agentData = byAgent.get(agentId)!;
      agentData.totalTokens += m.totalTokens;
      agentData.cost += Number(m.cost);
      agentData.messageCount += 1;
    });

    return Array.from(byAgent.values()).sort((a, b) => b.totalTokens - a.totalTokens);
  }

  private calculateUsageByModel(metrics: any[]): TokenUsageByModel[] {
    const byModel = new Map<string, TokenUsageByModel>();

    metrics.forEach(m => {
      const model = m.model;
      
      if (!byModel.has(model)) {
        byModel.set(model, {
          model,
          totalTokens: 0,
          cost: 0,
          messageCount: 0,
          avgTokensPerMessage: 0,
        });
      }

      const modelData = byModel.get(model)!;
      modelData.totalTokens += m.totalTokens;
      modelData.cost += Number(m.cost);
      modelData.messageCount += 1;
    });

    // Calculate averages
    byModel.forEach(data => {
      data.avgTokensPerMessage = Math.round(data.totalTokens / data.messageCount);
    });

    return Array.from(byModel.values()).sort((a, b) => b.totalTokens - a.totalTokens);
  }

  private calculateTopConversations(metrics: any[], conversations: any[]) {
    const byConversation = new Map<string, any>();

    metrics.forEach(m => {
      const convId = m.conversationId;
      
      if (!byConversation.has(convId)) {
        const conv = conversations.find(c => c.id === convId);
        byConversation.set(convId, {
          conversationId: convId,
          title: conv?.title || 'Untitled',
          totalTokens: 0,
          cost: 0,
          messageCount: 0,
        });
      }

      const convData = byConversation.get(convId)!;
      convData.totalTokens += m.totalTokens;
      convData.cost += Number(m.cost);
      convData.messageCount += 1;
    });

    return Array.from(byConversation.values())
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 10);
  }

  private getEmptyBillingResponse(): BillingAnalyticsResponse {
    return {
      summary: {
        totalTokens: 0,
        totalCost: 0,
        totalMessages: 0,
        totalConversations: 0,
        avgTokensPerMessage: 0,
        avgCostPerMessage: 0,
      },
      usageByDay: [],
      usageByAgent: [],
      usageByModel: [],
      topConversations: [],
    };
  }
}
