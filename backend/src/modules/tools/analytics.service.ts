import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ToolExecution } from './entities/tool-execution.entity';
import { Tool } from './entities/tool.entity';
import { CacheService, CacheKeys } from './cache.service';

export interface UsageStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalRetries: number;
}

export interface ToolMetrics {
  toolId: string;
  toolName: string;
  executions: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: Date;
  errorCount: number;
}

export interface TimeSeriesData {
  date: string;
  executions: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
}

export interface ErrorBreakdown {
  errorType: string;
  count: number;
  percentage: number;
  lastOccurrence: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ToolExecution)
    private executionsRepository: Repository<ToolExecution>,
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
    private cacheService: CacheService,
  ) {}

  /**
   * Get overall usage statistics for an organization (cached)
   */
  async getOrganizationStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageStats> {
    const cacheKey = CacheKeys.orgStats(
      organizationId,
      startDate?.toISOString(),
      endDate?.toISOString(),
    );

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.computeOrganizationStats(organizationId, startDate, endDate),
      30000, // 30 seconds TTL
    );
  }

  /**
   * Compute organization stats (internal)
   */
  private async computeOrganizationStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageStats> {
    const query = this.executionsRepository
      .createQueryBuilder('execution')
      .where('execution.organizationId = :organizationId', { organizationId });

    if (startDate && endDate) {
      query.andWhere('execution.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const executions = await query.getMany();

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const successRate = totalExecutions > 0 
      ? (successfulExecutions / totalExecutions) * 100 
      : 0;
    const avgExecutionTime = totalExecutions > 0
      ? executions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions
      : 0;
    const totalRetries = executions.reduce((sum, e) => sum + (e.retryCount || 0), 0);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
      avgExecutionTime,
      totalRetries,
    };
  }

  /**
   * Get metrics for all tools in an organization
   */
  async getToolsMetrics(
    organizationId: string,
    limit: number = 50,
  ): Promise<ToolMetrics[]> {
    const tools = await this.toolsRepository.find({
      where: { organizationId },
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    const metrics: ToolMetrics[] = [];

    for (const tool of tools) {
      const executions = await this.executionsRepository.find({
        where: { toolId: tool.id, organizationId },
        order: { createdAt: 'DESC' },
        take: 1000, // Last 1000 executions
      });

      const totalExecs = executions.length;
      const successfulExecs = executions.filter(e => e.success).length;
      const successRate = totalExecs > 0 ? (successfulExecs / totalExecs) * 100 : 0;
      const avgResponseTime = totalExecs > 0
        ? executions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecs
        : 0;
      const errorCount = totalExecs - successfulExecs;
      const lastUsed = executions[0]?.createdAt || tool.updatedAt;

      metrics.push({
        toolId: tool.id,
        toolName: tool.name,
        executions: totalExecs,
        successRate,
        avgResponseTime,
        lastUsed,
        errorCount,
      });
    }

    // Sort by execution count
    return metrics.sort((a, b) => b.executions - a.executions);
  }

  /**
   * Get time series data for visualization (cached)
   */
  async getTimeSeriesData(
    organizationId: string,
    toolId?: string,
    days: number = 30,
  ): Promise<TimeSeriesData[]> {
    const cacheKey = CacheKeys.timeSeries(organizationId, toolId, days);
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.computeTimeSeriesData(organizationId, toolId, days),
      60000, // 1 minute TTL
    );
  }

  /**
   * Compute time series data (internal)
   */
  private async computeTimeSeriesData(
    organizationId: string,
    toolId?: string,
    days: number = 30,
  ): Promise<TimeSeriesData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.createdAt >= :startDate', { startDate });

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const executions = await query.getMany();

    // Group by date
    const dataMap = new Map<string, {
      executions: number;
      successes: number;
      failures: number;
      totalTime: number;
    }>();

    for (const execution of executions) {
      const dateKey = execution.createdAt.toISOString().split('T')[0];
      const existing = dataMap.get(dateKey) || {
        executions: 0,
        successes: 0,
        failures: 0,
        totalTime: 0,
      };

      existing.executions++;
      if (execution.success) {
        existing.successes++;
      } else {
        existing.failures++;
      }
      existing.totalTime += execution.executionTime;

      dataMap.set(dateKey, existing);
    }

    // Convert to array and fill missing dates
    const result: TimeSeriesData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      const data = dataMap.get(dateKey) || {
        executions: 0,
        successes: 0,
        failures: 0,
        totalTime: 0,
      };

      result.push({
        date: dateKey,
        executions: data.executions,
        successes: data.successes,
        failures: data.failures,
        avgResponseTime: data.executions > 0 ? data.totalTime / data.executions : 0,
      });
    }

    return result;
  }

  /**
   * Get error breakdown and analysis (cached)
   */
  async getErrorBreakdown(
    organizationId: string,
    toolId?: string,
    days: number = 30,
  ): Promise<ErrorBreakdown[]> {
    const cacheKey = CacheKeys.errorBreakdown(organizationId, toolId, days);
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.computeErrorBreakdown(organizationId, toolId, days),
      60000, // 1 minute TTL
    );
  }

  /**
   * Compute error breakdown (internal)
   */
  private async computeErrorBreakdown(
    organizationId: string,
    toolId?: string,
    days: number = 30,
  ): Promise<ErrorBreakdown[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.success = :success', { success: false })
      .andWhere('execution.createdAt >= :startDate', { startDate })
      .andWhere('execution.error IS NOT NULL');

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const failedExecutions = await query.getMany();
    const totalErrors = failedExecutions.length;

    // Group by error type/message
    const errorMap = new Map<string, { count: number; lastOccurrence: Date }>();

    for (const execution of failedExecutions) {
      const errorType = this.categorizeError(execution.error);
      const existing = errorMap.get(errorType) || { count: 0, lastOccurrence: execution.createdAt };

      existing.count++;
      if (execution.createdAt > existing.lastOccurrence) {
        existing.lastOccurrence = execution.createdAt;
      }

      errorMap.set(errorType, existing);
    }

    // Convert to array
    const breakdown: ErrorBreakdown[] = [];
    for (const [errorType, data] of errorMap.entries()) {
      breakdown.push({
        errorType,
        count: data.count,
        percentage: totalErrors > 0 ? (data.count / totalErrors) * 100 : 0,
        lastOccurrence: data.lastOccurrence,
      });
    }

    return breakdown.sort((a, b) => b.count - a.count);
  }

  /**
   * Get performance percentiles
   */
  async getPerformancePercentiles(
    organizationId: string,
    toolId?: string,
  ): Promise<{
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }> {
    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.success = :success', { success: true })
      .orderBy('execution.executionTime', 'ASC');

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const executions = await query.getMany();
    const times = executions.map(e => e.executionTime);

    if (times.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    return {
      p50: this.percentile(times, 0.50),
      p75: this.percentile(times, 0.75),
      p90: this.percentile(times, 0.90),
      p95: this.percentile(times, 0.95),
      p99: this.percentile(times, 0.99),
    };
  }

  /**
   * Get rate limit usage statistics
   */
  async getRateLimitStats(
    toolId: string,
    organizationId: string,
  ): Promise<{
    currentMinute: number;
    limit: number;
    percentageUsed: number;
    recentExecutions: number[];
  }> {
    const tool = await this.toolsRepository.findOne({
      where: { id: toolId, organizationId },
    });

    if (!tool) {
      throw new Error('Tool not found');
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const currentMinute = await this.executionsRepository.count({
      where: {
        toolId,
        organizationId,
        createdAt: Between(oneMinuteAgo, now),
      },
    });

    // Get last 5 minutes
    const recentExecutions: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = new Date(now.getTime() - ((i + 1) * 60000));
      const end = new Date(now.getTime() - (i * 60000));
      
      const count = await this.executionsRepository.count({
        where: {
          toolId,
          organizationId,
          createdAt: Between(start, end),
        },
      });
      
      recentExecutions.unshift(count);
    }

    return {
      currentMinute,
      limit: tool.rateLimit,
      percentageUsed: (currentMinute / tool.rateLimit) * 100,
      recentExecutions,
    };
  }

  /**
   * Categorize error messages into types
   */
  private categorizeError(errorMessage: string): string {
    if (!errorMessage) return 'Unknown Error';

    const lower = errorMessage.toLowerCase();

    if (lower.includes('timeout') || lower.includes('etimedout')) {
      return 'Timeout';
    }
    if (lower.includes('network') || lower.includes('econnrefused')) {
      return 'Network Error';
    }
    if (lower.includes('401') || lower.includes('unauthorized')) {
      return 'Authentication Error';
    }
    if (lower.includes('403') || lower.includes('forbidden')) {
      return 'Permission Denied';
    }
    if (lower.includes('404') || lower.includes('not found')) {
      return 'Not Found';
    }
    if (lower.includes('429') || lower.includes('rate limit')) {
      return 'Rate Limit Exceeded';
    }
    if (lower.includes('500') || lower.includes('internal server')) {
      return 'Server Error';
    }
    if (lower.includes('502') || lower.includes('503') || lower.includes('504')) {
      return 'Service Unavailable';
    }

    return 'Other Error';
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }
}
