import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ToolExecution } from './entities/tool-execution.entity';

/**
 * Service to optimize common database queries
 */
@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  constructor(
    @InjectRepository(ToolExecution)
    private executionsRepository: Repository<ToolExecution>,
  ) {}

  /**
   * Optimized query builder for analytics with pagination
   */
  buildAnalyticsQuery(
    organizationId: string,
    options: {
      toolId?: string;
      startDate?: Date;
      endDate?: Date;
      successOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): SelectQueryBuilder<ToolExecution> {
    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .where('execution.organizationId = :organizationId', { organizationId });

    // Add optional filters
    if (options.toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId: options.toolId });
    }

    if (options.startDate) {
      query = query.andWhere('execution.createdAt >= :startDate', { 
        startDate: options.startDate 
      });
    }

    if (options.endDate) {
      query = query.andWhere('execution.createdAt <= :endDate', { 
        endDate: options.endDate 
      });
    }

    if (options.successOnly) {
      query = query.andWhere('execution.success = :success', { success: true });
    }

    // Order by most recent first
    query = query.orderBy('execution.createdAt', 'DESC');

    // Add pagination
    if (options.limit) {
      query = query.take(options.limit);
    }

    if (options.offset) {
      query = query.skip(options.offset);
    }

    return query;
  }

  /**
   * Get aggregated statistics using optimized query
   */
  async getAggregatedStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgTime: number;
    totalRetries: number;
  }> {
    const query = this.executionsRepository
      .createQueryBuilder('execution')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN success THEN 1 ELSE 0 END)', 'successful')
      .addSelect('SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)', 'failed')
      .addSelect('AVG(execution_time)', 'avgTime')
      .addSelect('SUM(retry_count)', 'totalRetries')
      .where('execution.organizationId = :organizationId', { organizationId });

    if (startDate) {
      query.andWhere('execution.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('execution.createdAt <= :endDate', { endDate });
    }

    const result = await query.getRawOne();

    return {
      total: parseInt(result.total) || 0,
      successful: parseInt(result.successful) || 0,
      failed: parseInt(result.failed) || 0,
      avgTime: parseFloat(result.avgTime) || 0,
      totalRetries: parseInt(result.totalRetries) || 0,
    };
  }

  /**
   * Get time series aggregation with single query
   */
  async getTimeSeriesAggregated(
    organizationId: string,
    days: number,
    toolId?: string,
  ): Promise<Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    avgTime: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .select("DATE(execution.createdAt)", 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN success THEN 1 ELSE 0 END)', 'successful')
      .addSelect('SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)', 'failed')
      .addSelect('AVG(execution_time)', 'avgTime')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.createdAt >= :startDate', { startDate })
      .groupBy('DATE(execution.createdAt)')
      .orderBy('DATE(execution.createdAt)', 'ASC');

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const results = await query.getRawMany();

    return results.map(row => ({
      date: row.date,
      total: parseInt(row.total),
      successful: parseInt(row.successful),
      failed: parseInt(row.failed),
      avgTime: parseFloat(row.avgTime) || 0,
    }));
  }

  /**
   * Get error statistics with single aggregated query
   */
  async getErrorStatsAggregated(
    organizationId: string,
    days: number,
    toolId?: string,
  ): Promise<Array<{
    errorType: string;
    count: number;
    lastOccurrence: Date;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .select('execution.error', 'error')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(execution.createdAt)', 'lastOccurrence')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.success = :success', { success: false })
      .andWhere('execution.error IS NOT NULL')
      .andWhere('execution.createdAt >= :startDate', { startDate })
      .groupBy('execution.error')
      .orderBy('count', 'DESC')
      .limit(10);

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const results = await query.getRawMany();

    return results.map(row => ({
      errorType: this.categorizeError(row.error),
      count: parseInt(row.count),
      lastOccurrence: row.lastOccurrence,
    }));
  }

  /**
   * Get performance percentiles using optimized query
   */
  async getPercentilesFast(
    organizationId: string,
    toolId?: string,
  ): Promise<{
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  }> {
    // Use PostgreSQL percentile functions for better performance
    let query = this.executionsRepository
      .createQueryBuilder('execution')
      .select('PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY execution_time)', 'p50')
      .addSelect('PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY execution_time)', 'p75')
      .addSelect('PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY execution_time)', 'p90')
      .addSelect('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time)', 'p95')
      .addSelect('PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time)', 'p99')
      .where('execution.organizationId = :organizationId', { organizationId })
      .andWhere('execution.success = :success', { success: true });

    if (toolId) {
      query = query.andWhere('execution.toolId = :toolId', { toolId });
    }

    const result = await query.getRawOne();

    return {
      p50: parseFloat(result.p50) || 0,
      p75: parseFloat(result.p75) || 0,
      p90: parseFloat(result.p90) || 0,
      p95: parseFloat(result.p95) || 0,
      p99: parseFloat(result.p99) || 0,
    };
  }

  /**
   * Categorize error message into type
   */
  private categorizeError(errorMessage: string): string {
    if (!errorMessage) return 'Unknown Error';

    const lower = errorMessage.toLowerCase();

    if (lower.includes('timeout') || lower.includes('etimedout')) return 'Timeout';
    if (lower.includes('network') || lower.includes('econnrefused')) return 'Network Error';
    if (lower.includes('401') || lower.includes('unauthorized')) return 'Authentication Error';
    if (lower.includes('403') || lower.includes('forbidden')) return 'Permission Denied';
    if (lower.includes('404') || lower.includes('not found')) return 'Not Found';
    if (lower.includes('429') || lower.includes('rate limit')) return 'Rate Limit Exceeded';
    if (lower.includes('500') || lower.includes('internal server')) return 'Server Error';
    if (lower.includes('502') || lower.includes('503') || lower.includes('504')) return 'Service Unavailable';

    return 'Other Error';
  }

  /**
   * Log query execution time for monitoring
   */
  async executeWithTiming<T>(
    queryName: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        this.logger.warn(`SLOW QUERY: ${queryName} took ${duration}ms`);
      } else {
        this.logger.debug(`Query ${queryName}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`FAILED QUERY: ${queryName} failed after ${duration}ms`, error);
      throw error;
    }
  }
}
