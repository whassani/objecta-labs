import { Processor, Process } from '@nestjs/bull';
import { Job as BullJob } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { JobsService } from '../jobs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FineTuningJob, FineTuningJobStatus } from '../../fine-tuning/entities/fine-tuning-job.entity';
import { FineTunedModel, FineTunedModelStatus } from '../../fine-tuning/entities/fine-tuned-model.entity';
import { FineTuningEvent } from '../../fine-tuning/entities/fine-tuning-event.entity';
import { FineTuningDataset } from '../../fine-tuning/entities/fine-tuning-dataset.entity';
import { OpenAIFineTuningProvider } from '../../fine-tuning/providers/openai.provider';
import { OllamaFineTuningProvider } from '../../fine-tuning/providers/ollama.provider';
import { IFineTuningProvider } from '../../fine-tuning/providers/fine-tuning-provider.interface';

@Processor('fine-tuning')
@Injectable()
export class FineTuningProcessor {
  private readonly logger = new Logger(FineTuningProcessor.name);
  private providers: Map<string, IFineTuningProvider>;

  constructor(
    private jobsService: JobsService,
    @InjectRepository(FineTuningJob)
    private fineTuningJobsRepository: Repository<FineTuningJob>,
    @InjectRepository(FineTunedModel)
    private modelsRepository: Repository<FineTunedModel>,
    @InjectRepository(FineTuningEvent)
    private eventsRepository: Repository<FineTuningEvent>,
    @InjectRepository(FineTuningDataset)
    private datasetsRepository: Repository<FineTuningDataset>,
    private openaiProvider: OpenAIFineTuningProvider,
    private ollamaProvider: OllamaFineTuningProvider,
  ) {
    this.providers = new Map();
    this.providers.set('openai', openaiProvider);
    this.providers.set('ollama', ollamaProvider);
  }

  @Process('fine-tuning')
  async handleFineTuning(job: BullJob) {
    const { jobId, fineTuningJobId, organizationId, userId } = job.data;

    this.logger.log(`Processing fine-tuning job ${jobId} (Fine-tuning ID: ${fineTuningJobId})`);

    try {
      // Update job status to active
      await this.jobsService.updateJobStatus(jobId, 'active', {
        progress: {
          current: 0,
          total: 100,
          percentage: 0,
          message: 'Initializing fine-tuning job...',
        },
      });

      // Load fine-tuning job
      const fineTuningJob = await this.fineTuningJobsRepository.findOne({
        where: { id: fineTuningJobId },
        relations: ['dataset'],
      });

      if (!fineTuningJob) {
        throw new Error(`Fine-tuning job ${fineTuningJobId} not found`);
      }

      const provider = this.providers.get(fineTuningJob.provider);
      if (!provider) {
        throw new Error(`Provider ${fineTuningJob.provider} not found`);
      }

      // Step 1: Validate dataset (10%)
      await this.jobsService.updateJobProgress(
        jobId,
        10,
        100,
        'Validating dataset...',
      );

      fineTuningJob.status = FineTuningJobStatus.VALIDATING;
      await this.fineTuningJobsRepository.save(fineTuningJob);
      await this.createEvent(fineTuningJobId, 'status_change', 'Validating dataset');

      const validation = await provider.validateDataset(fineTuningJob.dataset.filePath);
      if (!validation.valid) {
        throw new Error(`Dataset validation failed: ${validation.errors?.join(', ')}`);
      }

      await this.createEvent(fineTuningJobId, 'progress_update', 'Dataset validated successfully');

      // Step 2: Create fine-tuning job with provider (20%)
      await this.jobsService.updateJobProgress(
        jobId,
        20,
        100,
        'Starting fine-tuning with provider...',
      );

      const result = await provider.createFineTuningJob({
        datasetPath: fineTuningJob.dataset.filePath,
        baseModel: fineTuningJob.baseModel,
        hyperparameters: fineTuningJob.hyperparameters,
      });

      fineTuningJob.providerJobId = result.providerJobId;
      fineTuningJob.status = result.status;
      fineTuningJob.startedAt = new Date();
      await this.fineTuningJobsRepository.save(fineTuningJob);

      await this.createEvent(
        fineTuningJobId,
        'status_change',
        `Job started with provider ID: ${result.providerJobId}`,
      );

      this.logger.log(`Started fine-tuning with provider job ID ${result.providerJobId}`);

      // Step 3: Poll for status updates (20% - 95%)
      await this.pollJobStatus(jobId, fineTuningJobId, fineTuningJob.provider);

      // Step 4: Complete (100%)
      const finalJob = await this.fineTuningJobsRepository.findOne({
        where: { id: fineTuningJobId },
      });

      if (finalJob?.status === FineTuningJobStatus.SUCCEEDED) {
        await this.jobsService.updateJobStatus(jobId, 'completed', {
          progress: {
            current: 100,
            total: 100,
            percentage: 100,
            message: 'Fine-tuning completed successfully!',
          },
          result: {
            fineTuningJobId: finalJob.id,
            modelId: finalJob.resultModelId,
            providerJobId: finalJob.providerJobId,
            message: 'Fine-tuning completed successfully!',
          },
        });
      } else if (finalJob?.status === FineTuningJobStatus.FAILED) {
        throw new Error(finalJob.errorMessage || 'Fine-tuning failed');
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Fine-tuning job ${jobId} failed: ${error.message}`);

      // Update fine-tuning job status
      try {
        const fineTuningJob = await this.fineTuningJobsRepository.findOne({
          where: { id: job.data.fineTuningJobId },
        });

        if (fineTuningJob) {
          fineTuningJob.status = FineTuningJobStatus.FAILED;
          fineTuningJob.errorMessage = error.message;
          fineTuningJob.completedAt = new Date();
          await this.fineTuningJobsRepository.save(fineTuningJob);
          await this.createEvent(job.data.fineTuningJobId, 'error', error.message);
        }
      } catch (updateError) {
        this.logger.error(`Failed to update fine-tuning job status: ${updateError.message}`);
      }

      await this.jobsService.updateJobStatus(jobId, 'failed', {
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  private async pollJobStatus(
    jobId: string,
    fineTuningJobId: string,
    providerName: string,
  ): Promise<void> {
    const pollInterval = 30000; // 30 seconds
    const maxPolls = 120; // 1 hour max
    let polls = 0;

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    while (polls < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const fineTuningJob = await this.fineTuningJobsRepository.findOne({
        where: { id: fineTuningJobId },
      });

      if (!fineTuningJob || !fineTuningJob.providerJobId) {
        break;
      }

      // Check if in terminal state
      if ([
        FineTuningJobStatus.SUCCEEDED,
        FineTuningJobStatus.FAILED,
        FineTuningJobStatus.CANCELLED,
      ].includes(fineTuningJob.status)) {
        this.logger.log(`Fine-tuning job ${fineTuningJobId} reached terminal state: ${fineTuningJob.status}`);
        break;
      }

      try {
        // Get status from provider
        const status = await provider.getJobStatus(fineTuningJob.providerJobId);

        // Update fine-tuning job
        const oldStatus = fineTuningJob.status;
        fineTuningJob.status = status.status;
        fineTuningJob.progressPercentage = status.progressPercentage;
        fineTuningJob.trainedTokens = status.trainedTokens;
        fineTuningJob.trainingLoss = status.trainingLoss;
        fineTuningJob.validationLoss = status.validationLoss;

        // Update background job progress (20% - 95%)
        const progressPercentage = Math.min(95, 20 + (status.progressPercentage || 0) * 0.75);
        await this.jobsService.updateJobProgress(
          jobId,
          Math.round(progressPercentage),
          100,
          `Fine-tuning in progress: ${status.progressPercentage || 0}% (${fineTuningJob.trainedTokens || 0} tokens trained)`,
        );

        // Handle completion
        if (status.status === FineTuningJobStatus.SUCCEEDED && status.providerModelId) {
          fineTuningJob.completedAt = new Date();

          // Create model record
          const model = this.modelsRepository.create({
            organizationId: fineTuningJob.organizationId,
            workspaceId: fineTuningJob.workspaceId,
            jobId: fineTuningJob.id,
            name: `${fineTuningJob.name} - Model`,
            baseModel: fineTuningJob.baseModel,
            provider: fineTuningJob.provider,
            providerModelId: status.providerModelId,
            finalLoss: status.trainingLoss,
            status: FineTunedModelStatus.ACTIVE,
          });

          await this.modelsRepository.save(model);
          fineTuningJob.resultModelId = model.id;

          await this.createEvent(fineTuningJobId, 'status_change', 'Fine-tuning completed successfully');
        } else if (status.status === FineTuningJobStatus.FAILED) {
          fineTuningJob.completedAt = new Date();
          fineTuningJob.errorMessage = status.errorMessage;
          fineTuningJob.errorCode = status.errorCode;

          await this.createEvent(fineTuningJobId, 'error', status.errorMessage || 'Fine-tuning failed');
        }

        await this.fineTuningJobsRepository.save(fineTuningJob);

        // Log status change
        if (oldStatus !== fineTuningJob.status) {
          await this.createEvent(
            fineTuningJobId,
            'status_change',
            `Status changed from ${oldStatus} to ${fineTuningJob.status}`,
          );
        }

        // Break if terminal state
        if ([
          FineTuningJobStatus.SUCCEEDED,
          FineTuningJobStatus.FAILED,
          FineTuningJobStatus.CANCELLED,
        ].includes(fineTuningJob.status)) {
          break;
        }
      } catch (error) {
        this.logger.error(`Error polling fine-tuning job ${fineTuningJobId}: ${error.message}`);
      }

      polls++;
    }

    if (polls >= maxPolls) {
      this.logger.warn(`Fine-tuning job ${fineTuningJobId} reached max polls, stopping`);
      await this.createEvent(fineTuningJobId, 'warning', 'Maximum polling time reached');
    }
  }

  private async createEvent(
    jobId: string,
    eventType: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    const event = this.eventsRepository.create({
      jobId,
      eventType,
      message,
      metadata,
    });

    await this.eventsRepository.save(event);
  }
}
