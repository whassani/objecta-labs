import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Job, JobStatus, JobType } from './entities/job.entity';
import { JobsGateway } from './jobs.gateway';

export interface CreateJobDto {
  type: JobType;
  name: string;
  description?: string;
  data: any;
  priority?: number;
  maxAttempts?: number;
}

export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private queueMap: Map<JobType, Queue>;

  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectQueue('data-conversion') private dataConversionQueue: Queue,
    @InjectQueue('fine-tuning') private fineTuningQueue: Queue,
    @InjectQueue('workflow-execution') private workflowQueue: Queue,
    @InjectQueue('document-processing') private documentQueue: Queue,
    private gateway: JobsGateway,
  ) {
    this.queueMap = new Map([
      ['data-conversion', dataConversionQueue],
      ['fine-tuning', fineTuningQueue],
      ['workflow-execution', workflowQueue],
      ['document-processing', documentQueue],
      ['model-training', fineTuningQueue], // Reuse fine-tuning queue
      ['bulk-operation', documentQueue], // Reuse document queue
    ]);
  }

  /**
   * Create and queue a new job
   */
  async createJob(
    userId: string,
    organizationId: string,
    dto: CreateJobDto,
  ): Promise<Job> {
    const queue = this.queueMap.get(dto.type);
    if (!queue) {
      throw new Error(`No queue configured for job type: ${dto.type}`);
    }

    // Create job record
    const job = this.jobsRepository.create({
      userId,
      organizationId,
      type: dto.type,
      name: dto.name,
      description: dto.description,
      data: dto.data,
      status: 'pending',
      queueName: queue.name,
      priority: dto.priority || 0,
      maxAttempts: dto.maxAttempts || 3,
    });

    await this.jobsRepository.save(job);

    // Add to Bull queue
    const bullJob = await queue.add(
      dto.type,
      {
        jobId: job.id,
        userId,
        organizationId,
        ...dto.data,
      },
      {
        priority: dto.priority || 0,
        attempts: dto.maxAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    // Update with Bull job ID
    job.bullJobId = String(bullJob.id);
    await this.jobsRepository.save(job);

    this.logger.log(`Created job ${job.id} of type ${dto.type}`);
    this.gateway.sendJobCreated(job);

    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(id: string, organizationId: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }

  /**
   * List jobs with filters
   */
  async listJobs(
    organizationId: string,
    filters?: {
      userId?: string;
      type?: JobType;
      status?: JobStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ jobs: Job[]; total: number }> {
    const query = this.jobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'user')
      .where('job.organizationId = :organizationId', { organizationId });

    if (filters?.userId) {
      query.andWhere('job.userId = :userId', { userId: filters.userId });
    }

    if (filters?.type) {
      query.andWhere('job.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('job.status = :status', { status: filters.status });
    }

    query.orderBy('job.createdAt', 'DESC');

    if (filters?.limit) {
      query.take(filters.limit);
    }

    if (filters?.offset) {
      query.skip(filters.offset);
    }

    const [jobs, total] = await query.getManyAndCount();

    return { jobs, total };
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    data?: {
      result?: any;
      error?: any;
      progress?: JobProgress;
    },
  ): Promise<Job> {
    const job = await this.jobsRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    job.status = status;

    if (status === 'active' && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === 'completed') {
      job.completedAt = new Date();
      if (data?.result) {
        job.result = data.result;
      }
    }

    if (status === 'failed') {
      job.failedAt = new Date();
      if (data?.error) {
        job.error = data.error;
      }
    }

    if (data?.progress) {
      job.progress = data.progress;
    }

    await this.jobsRepository.save(job);

    // Send WebSocket update
    this.gateway.sendJobUpdate(job);

    return job;
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    current: number,
    total: number,
    message: string,
  ): Promise<void> {
    const percentage = Math.round((current / total) * 100);

    await this.updateJobStatus(jobId, 'active', {
      progress: {
        current,
        total,
        percentage,
        message,
      },
    });
  }

  /**
   * Cancel a job
   */
  async cancelJob(id: string, organizationId: string): Promise<Job> {
    const job = await this.getJob(id, organizationId);

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error('Cannot cancel completed or failed job');
    }

    // Remove from Bull queue if still pending
    if (job.bullJobId) {
      const queue = this.queueMap.get(job.type);
      if (queue) {
        const bullJob = await queue.getJob(job.bullJobId);
        if (bullJob) {
          await bullJob.remove();
        }
      }
    }

    job.status = 'cancelled';
    await this.jobsRepository.save(job);

    this.gateway.sendJobUpdate(job);
    this.logger.log(`Cancelled job ${id}`);

    return job;
  }

  /**
   * Retry a failed job
   */
  async retryJob(id: string, organizationId: string): Promise<Job> {
    const job = await this.getJob(id, organizationId);

    if (job.status !== 'failed') {
      throw new Error('Can only retry failed jobs');
    }

    // Create a new job with same data
    return this.createJob(job.userId, job.organizationId, {
      type: job.type,
      name: job.name,
      description: job.description,
      data: job.data,
      priority: job.priority,
      maxAttempts: job.maxAttempts,
    });
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.jobsRepository
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', {
        statuses: ['completed', 'failed', 'cancelled'],
      })
      .andWhere('completedAt < :cutoffDate OR failedAt < :cutoffDate', {
        cutoffDate,
      })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old jobs`);
    return result.affected || 0;
  }

  /**
   * Get job statistics
   */
  async getJobStats(
    organizationId: string,
    userId?: string,
  ): Promise<any> {
    const query = this.jobsRepository
      .createQueryBuilder('job')
      .where('job.organizationId = :organizationId', { organizationId });

    if (userId) {
      query.andWhere('job.userId = :userId', { userId });
    }

    const [total, pending, active, completed, failed] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('job.status = :status', { status: 'pending' }).getCount(),
      query.clone().andWhere('job.status = :status', { status: 'active' }).getCount(),
      query.clone().andWhere('job.status = :status', { status: 'completed' }).getCount(),
      query.clone().andWhere('job.status = :status', { status: 'failed' }).getCount(),
    ]);

    return {
      total,
      pending,
      active,
      completed,
      failed,
      cancelled: total - (pending + active + completed + failed),
    };
  }
}
