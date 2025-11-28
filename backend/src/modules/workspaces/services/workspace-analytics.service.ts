import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkspaceActivity } from '../entities/workspace-activity.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { WorkflowExecution } from '../../workflows/entities/workflow-execution.entity';
import { Document } from '../../knowledge-base/entities/document.entity';
import { WorkspaceMember } from '../entities/workspace-member.entity';

@Injectable()
export class WorkspaceAnalyticsService {
  constructor(
    @InjectRepository(WorkspaceActivity)
    private activityRepository: Repository<WorkspaceActivity>,
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    @InjectRepository(WorkflowExecution)
    private executionsRepository: Repository<WorkflowExecution>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
  ) {}

  async getWorkspaceStats(workspaceId: string): Promise<any> {
    const [agentsCount, workflowExecutionsCount, documentsCount, membersCount] = await Promise.all([
      this.agentsRepository.count({ where: { workspaceId } }),
      this.executionsRepository.count({
        relations: ['workflow'],
        where: { workflow: { workspaceId } },
      }),
      this.documentsRepository.count(),
      this.membersRepository.count({ where: { workspaceId } }),
    ]);

    return {
      agents: agentsCount,
      workflowExecutions: workflowExecutionsCount,
      documents: documentsCount,
      members: membersCount,
    };
  }

  async getActivityTimeline(workspaceId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository.find({
      where: {
        workspaceId,
        createdAt: Between(startDate, new Date()),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.activityType,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata,
      user: activity.user ? {
        id: activity.userId,
        email: activity.user.email,
        firstName: activity.user.firstName,
        lastName: activity.user.lastName,
      } : null,
      createdAt: activity.createdAt,
    }));
  }

  async getActivityByType(workspaceId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.activity_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('activity.workspace_id = :workspaceId', { workspaceId })
      .andWhere('activity.created_at >= :startDate', { startDate })
      .groupBy('activity.activity_type')
      .getRawMany();

    return activities.map(a => ({
      type: a.type,
      count: parseInt(a.count, 10),
    }));
  }

  async getDailyActivity(workspaceId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .select("DATE(activity.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('activity.workspace_id = :workspaceId', { workspaceId })
      .andWhere('activity.created_at >= :startDate', { startDate })
      .groupBy("DATE(activity.created_at)")
      .orderBy("DATE(activity.created_at)", 'ASC')
      .getRawMany();

    return activities.map(a => ({
      date: a.date,
      count: parseInt(a.count, 10),
    }));
  }

  async getMostActiveUsers(workspaceId: string, days: number = 30, limit: number = 10): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.workspace_id = :workspaceId', { workspaceId })
      .andWhere('activity.created_at >= :startDate', { startDate })
      .andWhere('activity.user_id IS NOT NULL')
      .groupBy('activity.user_id')
      .addGroupBy('user.id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return activities.map(a => ({
      userId: a.userId,
      email: a.user_email,
      firstName: a.user_first_name,
      lastName: a.user_last_name,
      activityCount: parseInt(a.count, 10),
    }));
  }

  async logActivity(
    workspaceId: string,
    userId: string,
    activityType: string,
    entityType?: string,
    entityId?: string,
    metadata?: any,
  ): Promise<WorkspaceActivity> {
    const activity = this.activityRepository.create({
      workspaceId,
      userId,
      activityType,
      entityType,
      entityId,
      metadata: metadata || {},
    });

    return this.activityRepository.save(activity);
  }
}
