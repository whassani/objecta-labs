import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService, CreateJobDto } from './jobs.service';
import { Job, JobStatus, JobType } from './entities/job.entity';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new background job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  async createJob(
    @Body() dto: CreateJobDto,
    @Request() req,
  ): Promise<Job> {
    const { organizationId, id: userId } = req.user;
    return this.jobsService.createJob(userId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async listJobs(
    @Request() req,
    @Query('type') type?: JobType,
    @Query('status') status?: JobStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ jobs: Job[]; total: number }> {
    const { organizationId, id: userId } = req.user;
    
    return this.jobsService.listJobs(organizationId, {
      userId, // Filter to user's jobs
      type,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getJobStats(@Request() req): Promise<any> {
    const { organizationId, id: userId } = req.user;
    return this.jobsService.getJobStats(organizationId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJob(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Job> {
    const { organizationId } = req.user;
    return this.jobsService.getJob(id, organizationId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  async cancelJob(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Job> {
    const { organizationId } = req.user;
    return this.jobsService.cancelJob(id, organizationId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 201, description: 'Job retried successfully' })
  async retryJob(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Job> {
    const { organizationId } = req.user;
    return this.jobsService.retryJob(id, organizationId);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Clean up old completed jobs' })
  @ApiResponse({ status: 200, description: 'Jobs cleaned up successfully' })
  async cleanupOldJobs(
    @Query('days') days?: string,
  ): Promise<{ deleted: number }> {
    const daysOld = days ? parseInt(days) : 30;
    const deleted = await this.jobsService.cleanupOldJobs(daysOld);
    return { deleted };
  }
}
