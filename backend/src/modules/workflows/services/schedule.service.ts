import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as cron from 'node-cron';
import { Workflow, WorkflowStatus, WorkflowTriggerType } from '../entities/workflow.entity';
import { WorkflowExecutorService } from '../workflow-executor.service';

interface ScheduledJob {
  workflowId: string;
  task: cron.ScheduledTask;
  cronExpression: string;
}

@Injectable()
export class ScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleService.name);
  private scheduledJobs: Map<string, ScheduledJob> = new Map();

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private workflowExecutorService: WorkflowExecutorService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing workflow scheduler...');
    await this.loadScheduledWorkflows();
  }

  onModuleDestroy() {
    this.logger.log('Stopping all scheduled workflows...');
    this.stopAllSchedules();
  }

  /**
   * Load all active scheduled workflows from database
   */
  async loadScheduledWorkflows(): Promise<void> {
    try {
      const scheduledWorkflows = await this.workflowRepository.find({
        where: {
          status: WorkflowStatus.ACTIVE,
          triggerType: WorkflowTriggerType.SCHEDULE,
        },
      });

      this.logger.log(`Found ${scheduledWorkflows.length} scheduled workflows`);

      for (const workflow of scheduledWorkflows) {
        await this.scheduleWorkflow(workflow);
      }
    } catch (error) {
      this.logger.error('Failed to load scheduled workflows', error.stack);
    }
  }

  /**
   * Schedule a workflow with cron expression
   */
  async scheduleWorkflow(workflow: Workflow): Promise<void> {
    try {
      const cronExpression = workflow.triggerConfig?.cron;

      if (!cronExpression) {
        this.logger.warn(`Workflow ${workflow.id} has no cron expression`);
        return;
      }

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        this.logger.error(`Invalid cron expression for workflow ${workflow.id}: ${cronExpression}`);
        return;
      }

      // Stop existing schedule if any
      this.stopSchedule(workflow.id);

      // Create new scheduled task
      const task = cron.schedule(cronExpression, async () => {
        this.logger.log(`Executing scheduled workflow: ${workflow.name} (${workflow.id})`);
        
        try {
          await this.workflowExecutorService.executeWorkflow(
            workflow.id,
            workflow.organizationId,
            {
              triggerData: {
                scheduledAt: new Date().toISOString(),
                cronExpression,
              },
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to execute scheduled workflow ${workflow.id}`,
            error.stack,
          );
        }
      });

      // Start the task
      task.start();

      // Store the scheduled job
      this.scheduledJobs.set(workflow.id, {
        workflowId: workflow.id,
        task,
        cronExpression,
      });

      this.logger.log(
        `Scheduled workflow ${workflow.name} (${workflow.id}) with cron: ${cronExpression}`,
      );
    } catch (error) {
      this.logger.error(`Failed to schedule workflow ${workflow.id}`, error.stack);
    }
  }

  /**
   * Stop a scheduled workflow
   */
  stopSchedule(workflowId: string): void {
    const job = this.scheduledJobs.get(workflowId);
    if (job) {
      job.task.stop();
      this.scheduledJobs.delete(workflowId);
      this.logger.log(`Stopped schedule for workflow ${workflowId}`);
    }
  }

  /**
   * Stop all scheduled workflows
   */
  stopAllSchedules(): void {
    for (const [workflowId, job] of this.scheduledJobs.entries()) {
      job.task.stop();
      this.logger.log(`Stopped schedule for workflow ${workflowId}`);
    }
    this.scheduledJobs.clear();
  }

  /**
   * Reload schedules (useful after workflow updates)
   */
  async reloadSchedules(): Promise<void> {
    this.logger.log('Reloading all workflow schedules...');
    this.stopAllSchedules();
    await this.loadScheduledWorkflows();
  }

  /**
   * Get all active schedules
   */
  getActiveSchedules(): Array<{ workflowId: string; cronExpression: string }> {
    return Array.from(this.scheduledJobs.values()).map((job) => ({
      workflowId: job.workflowId,
      cronExpression: job.cronExpression,
    }));
  }
}
