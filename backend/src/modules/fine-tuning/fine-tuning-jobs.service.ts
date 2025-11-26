import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FineTuningJob, FineTuningJobStatus } from './entities/fine-tuning-job.entity';
import { FineTunedModel, FineTunedModelStatus } from './entities/fine-tuned-model.entity';
import { FineTuningEvent } from './entities/fine-tuning-event.entity';
import { FineTuningDataset } from './entities/fine-tuning-dataset.entity';
import {
  CreateFineTuningJobDto,
  UpdateFineTuningJobDto,
  EstimateCostDto,
  CostEstimateResponseDto,
} from './dto/job.dto';
import { OpenAIFineTuningProvider } from './providers/openai.provider';
import { IFineTuningProvider } from './providers/fine-tuning-provider.interface';

@Injectable()
export class FineTuningJobsService {
  private readonly logger = new Logger(FineTuningJobsService.name);
  private providers: Map<string, IFineTuningProvider>;

  constructor(
    @InjectRepository(FineTuningJob)
    private jobsRepository: Repository<FineTuningJob>,
    @InjectRepository(FineTunedModel)
    private modelsRepository: Repository<FineTunedModel>,
    @InjectRepository(FineTuningEvent)
    private eventsRepository: Repository<FineTuningEvent>,
    @InjectRepository(FineTuningDataset)
    private datasetsRepository: Repository<FineTuningDataset>,
    private openaiProvider: OpenAIFineTuningProvider,
  ) {
    // Initialize providers
    this.providers = new Map();
    this.providers.set('openai', openaiProvider);
  }

  async create(
    createJobDto: CreateFineTuningJobDto,
    organizationId: string,
    userId: string,
  ): Promise<FineTuningJob> {
    try {
      // Validate dataset exists and belongs to organization
      const dataset = await this.datasetsRepository.findOne({
        where: { id: createJobDto.datasetId, organizationId },
      });

      if (!dataset) {
        throw new NotFoundException(`Dataset with ID ${createJobDto.datasetId} not found`);
      }

      if (!dataset.validated) {
        throw new BadRequestException('Dataset must be validated before creating a fine-tuning job');
      }

      // Get provider
      const provider = this.providers.get(createJobDto.provider || 'openai');
      if (!provider) {
        throw new BadRequestException(`Provider ${createJobDto.provider} not supported`);
      }

      // Estimate cost
      const costEstimate = await provider.estimateCost(
        dataset.totalExamples,
        createJobDto.baseModel,
        createJobDto.hyperparameters?.n_epochs || 3,
      );

      // Create job record
      const job = this.jobsRepository.create({
        ...createJobDto,
        organizationId,
        createdBy: userId,
        hyperparameters: createJobDto.hyperparameters || {},
        estimatedCostUsd: costEstimate.estimatedCostUsd,
        status: FineTuningJobStatus.PENDING,
      });

      await this.jobsRepository.save(job);

      this.logger.log(`Created fine-tuning job: ${job.id}`);

      // Start the job asynchronously
      this.startJob(job.id).catch((error) => {
        this.logger.error(`Failed to start job ${job.id}: ${error.message}`);
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to create job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(
    organizationId: string,
    workspaceId?: string,
  ): Promise<FineTuningJob[]> {
    const query = this.jobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.dataset', 'dataset')
      .leftJoinAndSelect('job.creator', 'creator')
      .leftJoinAndSelect('job.resultModel', 'resultModel')
      .where('job.organizationId = :organizationId', { organizationId });

    if (workspaceId) {
      query.andWhere('job.workspaceId = :workspaceId', { workspaceId });
    }

    query.orderBy('job.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, organizationId: string): Promise<FineTuningJob> {
    const job = await this.jobsRepository.findOne({
      where: { id, organizationId },
      relations: ['dataset', 'creator', 'workspace', 'resultModel'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(
    id: string,
    updateJobDto: UpdateFineTuningJobDto,
    organizationId: string,
  ): Promise<FineTuningJob> {
    const job = await this.findOne(id, organizationId);

    Object.assign(job, updateJobDto);
    await this.jobsRepository.save(job);

    this.logger.log(`Updated job: ${id}`);
    return job;
  }

  async cancel(id: string, organizationId: string): Promise<FineTuningJob> {
    const job = await this.findOne(id, organizationId);

    if (![FineTuningJobStatus.PENDING, FineTuningJobStatus.QUEUED, FineTuningJobStatus.RUNNING].includes(job.status)) {
      throw new BadRequestException(`Cannot cancel job with status: ${job.status}`);
    }

    const provider = this.providers.get(job.provider);
    if (!provider) {
      throw new BadRequestException(`Provider ${job.provider} not found`);
    }

    try {
      if (job.providerJobId) {
        await provider.cancelJob(job.providerJobId);
      }

      job.status = FineTuningJobStatus.CANCELLED;
      job.cancelledAt = new Date();
      await this.jobsRepository.save(job);

      await this.createEvent(job.id, 'status_change', 'Job cancelled by user');

      this.logger.log(`Cancelled job: ${id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to cancel job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getEvents(id: string, organizationId: string): Promise<FineTuningEvent[]> {
    const job = await this.findOne(id, organizationId);

    return this.eventsRepository.find({
      where: { jobId: job.id },
      order: { createdAt: 'DESC' },
    });
  }

  async estimateCost(estimateDto: EstimateCostDto): Promise<CostEstimateResponseDto> {
    const dataset = await this.datasetsRepository.findOne({
      where: { id: estimateDto.datasetId },
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${estimateDto.datasetId} not found`);
    }

    const provider = this.providers.get('openai');
    const estimate = await provider.estimateCost(
      dataset.totalExamples,
      estimateDto.baseModel,
      estimateDto.epochs || 3,
    );

    return {
      ...estimate,
      epochs: estimateDto.epochs || 3,
      baseModel: estimateDto.baseModel,
    };
  }

  async syncJobStatus(id: string, organizationId: string): Promise<FineTuningJob> {
    const job = await this.findOne(id, organizationId);

    if (!job.providerJobId) {
      return job;
    }

    const provider = this.providers.get(job.provider);
    if (!provider) {
      throw new BadRequestException(`Provider ${job.provider} not found`);
    }

    try {
      const status = await provider.getJobStatus(job.providerJobId);

      // Update job status
      const oldStatus = job.status;
      job.status = status.status;
      job.progressPercentage = status.progressPercentage;
      job.trainedTokens = status.trainedTokens;
      job.trainingLoss = status.trainingLoss;
      job.validationLoss = status.validationLoss;

      if (status.status === FineTuningJobStatus.SUCCEEDED && status.providerModelId) {
        job.completedAt = new Date();
        
        // Create model record
        const model = this.modelsRepository.create({
          organizationId: job.organizationId,
          workspaceId: job.workspaceId,
          jobId: job.id,
          name: `${job.name} - Model`,
          baseModel: job.baseModel,
          provider: job.provider,
          providerModelId: status.providerModelId,
          finalLoss: status.trainingLoss,
          status: FineTunedModelStatus.ACTIVE,
        });

        await this.modelsRepository.save(model);
        job.resultModelId = model.id;
      } else if (status.status === FineTuningJobStatus.FAILED) {
        job.completedAt = new Date();
        job.errorMessage = status.errorMessage;
        job.errorCode = status.errorCode;
      }

      await this.jobsRepository.save(job);

      // Log status change
      if (oldStatus !== job.status) {
        await this.createEvent(job.id, 'status_change', `Status changed from ${oldStatus} to ${job.status}`);
      }

      return job;
    } catch (error) {
      this.logger.error(`Failed to sync job status: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods
  private async startJob(jobId: string): Promise<void> {
    const job = await this.jobsRepository.findOne({
      where: { id: jobId },
      relations: ['dataset'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    try {
      job.status = FineTuningJobStatus.VALIDATING;
      await this.jobsRepository.save(job);
      await this.createEvent(jobId, 'status_change', 'Starting fine-tuning job');

      const provider = this.providers.get(job.provider);
      if (!provider) {
        throw new BadRequestException(`Provider ${job.provider} not found`);
      }

      // Validate dataset
      const validation = await provider.validateDataset(job.dataset.filePath);
      if (!validation.valid) {
        throw new BadRequestException(`Dataset validation failed: ${validation.errors?.join(', ')}`);
      }

      await this.createEvent(jobId, 'progress_update', 'Dataset validated successfully');

      // Create fine-tuning job with provider
      const result = await provider.createFineTuningJob({
        datasetPath: job.dataset.filePath,
        baseModel: job.baseModel,
        hyperparameters: job.hyperparameters,
      });

      job.providerJobId = result.providerJobId;
      job.status = result.status;
      job.startedAt = new Date();
      await this.jobsRepository.save(job);

      await this.createEvent(jobId, 'status_change', `Job started with provider ID: ${result.providerJobId}`);

      this.logger.log(`Started fine-tuning job ${jobId} with provider job ID ${result.providerJobId}`);

      // Start polling for status updates
      this.pollJobStatus(jobId);
    } catch (error) {
      this.logger.error(`Failed to start job ${jobId}: ${error.message}`, error.stack);

      job.status = FineTuningJobStatus.FAILED;
      job.errorMessage = error.message;
      await this.jobsRepository.save(job);
      await this.createEvent(jobId, 'error', error.message);
    }
  }

  private async pollJobStatus(jobId: string): Promise<void> {
    const pollInterval = 60000; // 1 minute
    const maxPolls = 60 * 24; // 24 hours max

    let polls = 0;

    const poll = async () => {
      try {
        const job = await this.jobsRepository.findOne({ where: { id: jobId } });
        if (!job) return;

        // Stop polling if job is in terminal state
        if ([
          FineTuningJobStatus.SUCCEEDED,
          FineTuningJobStatus.FAILED,
          FineTuningJobStatus.CANCELLED,
        ].includes(job.status)) {
          this.logger.log(`Job ${jobId} reached terminal state: ${job.status}`);
          return;
        }

        // Sync status
        await this.syncJobStatus(jobId, job.organizationId);

        polls++;
        if (polls < maxPolls) {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        this.logger.error(`Error polling job ${jobId}: ${error.message}`);
      }
    };

    setTimeout(poll, pollInterval);
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
