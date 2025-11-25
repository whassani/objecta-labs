import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolExecution } from './entities/tool-execution.entity';

@Injectable()
export class TestHistoryService {
  constructor(
    @InjectRepository(ToolExecution)
    private executionsRepository: Repository<ToolExecution>,
  ) {}

  /**
   * Save a test execution to history
   */
  async saveTestExecution(
    toolId: string,
    organizationId: string,
    userId: string,
    input: any,
    result: any,
    executionTime: number,
    success: boolean,
    error?: string,
  ): Promise<ToolExecution> {
    const execution = this.executionsRepository.create({
      toolId,
      organizationId,
      userId,
      input,
      output: result?.data || result,
      request: result?.request,
      response: result?.response,
      success,
      error,
      executionTime,
      isTest: true,
      retryCount: 0,
    });

    return this.executionsRepository.save(execution);
  }

  /**
   * Get test history for a tool
   */
  async getToolTestHistory(
    toolId: string,
    organizationId: string,
    limit: number = 20,
  ): Promise<ToolExecution[]> {
    return this.executionsRepository.find({
      where: { toolId, organizationId, isTest: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get recent test executions across all tools
   */
  async getRecentTests(
    organizationId: string,
    limit: number = 50,
  ): Promise<ToolExecution[]> {
    return this.executionsRepository.find({
      where: { organizationId, isTest: true },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['tool'],
    });
  }

  /**
   * Get a specific test execution
   */
  async getTestExecution(
    id: string,
    organizationId: string,
  ): Promise<ToolExecution> {
    return this.executionsRepository.findOne({
      where: { id, organizationId },
      relations: ['tool'],
    });
  }

  /**
   * Delete old test history
   */
  async cleanupOldTests(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.executionsRepository
      .createQueryBuilder()
      .delete()
      .where('isTest = :isTest', { isTest: true })
      .andWhere('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get test statistics for a tool
   */
  async getToolTestStats(
    toolId: string,
    organizationId: string,
  ): Promise<{
    totalTests: number;
    successCount: number;
    failureCount: number;
    avgExecutionTime: number;
    lastTested: Date | null;
  }> {
    const executions = await this.executionsRepository.find({
      where: { toolId, organizationId, isTest: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const totalTests = executions.length;
    const successCount = executions.filter(e => e.success).length;
    const failureCount = totalTests - successCount;
    const avgExecutionTime = totalTests > 0
      ? executions.reduce((sum, e) => sum + e.executionTime, 0) / totalTests
      : 0;
    const lastTested = totalTests > 0 ? executions[0].createdAt : null;

    return {
      totalTests,
      successCount,
      failureCount,
      avgExecutionTime,
      lastTested,
    };
  }
}
