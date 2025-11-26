import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FineTunedModel, FineTunedModelStatus } from './entities/fine-tuned-model.entity';
import { Agent } from '../agents/entities/agent.entity';
import { UpdateFineTunedModelDto, ModelStatsDto } from './dto/model.dto';

@Injectable()
export class FineTunedModelsService {
  private readonly logger = new Logger(FineTunedModelsService.name);

  constructor(
    @InjectRepository(FineTunedModel)
    private modelsRepository: Repository<FineTunedModel>,
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
  ) {}

  async findAll(
    organizationId: string,
    workspaceId?: string,
  ): Promise<FineTunedModel[]> {
    const query = this.modelsRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.job', 'job')
      .leftJoinAndSelect('job.dataset', 'dataset')
      .where('model.organizationId = :organizationId', { organizationId })
      .andWhere('model.status != :deprecated', { deprecated: FineTunedModelStatus.DEPRECATED });

    if (workspaceId) {
      query.andWhere('model.workspaceId = :workspaceId', { workspaceId });
    }

    query.orderBy('model.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, organizationId: string): Promise<FineTunedModel> {
    const model = await this.modelsRepository.findOne({
      where: { id, organizationId },
      relations: ['job', 'job.dataset', 'workspace'],
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${id} not found`);
    }

    return model;
  }

  async update(
    id: string,
    updateModelDto: UpdateFineTunedModelDto,
    organizationId: string,
  ): Promise<FineTunedModel> {
    const model = await this.findOne(id, organizationId);

    Object.assign(model, updateModelDto);

    if (updateModelDto.status === FineTunedModelStatus.ARCHIVED) {
      model.archivedAt = new Date();
    }

    await this.modelsRepository.save(model);

    this.logger.log(`Updated model: ${id}`);
    return model;
  }

  async deploy(
    id: string,
    organizationId: string,
    agentId?: string,
  ): Promise<FineTunedModel> {
    const model = await this.findOne(id, organizationId);

    if (model.status !== FineTunedModelStatus.ACTIVE) {
      throw new BadRequestException('Only active models can be deployed');
    }

    if (agentId) {
      // Deploy to specific agent
      const agent = await this.agentsRepository.findOne({
        where: { id: agentId, organizationId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      // Update agent to use this model
      agent.model = model.providerModelId;
      await this.agentsRepository.save(agent);

      model.deploymentCount += 1;
      this.logger.log(`Deployed model ${id} to agent ${agentId}`);
    }

    model.deployed = true;
    model.deployedAt = new Date();
    await this.modelsRepository.save(model);

    return model;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const model = await this.findOne(id, organizationId);

    if (model.deployed && model.deploymentCount > 0) {
      throw new BadRequestException(
        'Cannot delete a deployed model. Please undeploy it first or mark as deprecated.',
      );
    }

    await this.modelsRepository.remove(model);
    this.logger.log(`Deleted model: ${id}`);
  }

  async archive(id: string, organizationId: string): Promise<FineTunedModel> {
    const model = await this.findOne(id, organizationId);

    model.status = FineTunedModelStatus.ARCHIVED;
    model.archivedAt = new Date();
    await this.modelsRepository.save(model);

    this.logger.log(`Archived model: ${id}`);
    return model;
  }

  async getStats(organizationId: string, workspaceId?: string): Promise<ModelStatsDto> {
    const query = this.modelsRepository
      .createQueryBuilder('model')
      .where('model.organizationId = :organizationId', { organizationId });

    if (workspaceId) {
      query.andWhere('model.workspaceId = :workspaceId', { workspaceId });
    }

    const models = await query.getMany();

    const stats: ModelStatsDto = {
      totalModels: models.length,
      deployedModels: models.filter((m) => m.deployed).length,
      activeModels: models.filter((m) => m.status === FineTunedModelStatus.ACTIVE).length,
      archivedModels: models.filter((m) => m.status === FineTunedModelStatus.ARCHIVED).length,
      totalTokensUsed: models.reduce((sum, m) => sum + Number(m.totalTokensUsed), 0),
      totalRequests: models.reduce((sum, m) => sum + m.totalRequests, 0),
      averageLatency: this.calculateAverageLatency(models),
      byProvider: {},
      byBaseModel: {},
    };

    models.forEach((model) => {
      stats.byProvider[model.provider] = (stats.byProvider[model.provider] || 0) + 1;
      stats.byBaseModel[model.baseModel] = (stats.byBaseModel[model.baseModel] || 0) + 1;
    });

    return stats;
  }

  async recordUsage(
    id: string,
    tokensUsed: number,
    latencyMs: number,
  ): Promise<void> {
    const model = await this.modelsRepository.findOne({ where: { id } });
    if (!model) return;

    model.totalTokensUsed = Number(model.totalTokensUsed) + tokensUsed;
    model.totalRequests += 1;

    // Calculate moving average for latency
    if (model.averageLatencyMs) {
      model.averageLatencyMs = Math.round(
        (model.averageLatencyMs * (model.totalRequests - 1) + latencyMs) / model.totalRequests,
      );
    } else {
      model.averageLatencyMs = latencyMs;
    }

    await this.modelsRepository.save(model);
  }

  private calculateAverageLatency(models: FineTunedModel[]): number {
    const modelsWithLatency = models.filter((m) => m.averageLatencyMs !== null);
    if (modelsWithLatency.length === 0) return 0;

    const sum = modelsWithLatency.reduce((acc, m) => acc + (m.averageLatencyMs || 0), 0);
    return Math.round(sum / modelsWithLatency.length);
  }
}
