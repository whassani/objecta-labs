import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { FineTunedModel, FineTunedModelStatus } from '../fine-tuning/entities/fine-tuned-model.entity';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
    @InjectRepository(FineTunedModel)
    private fineTunedModelsRepository: Repository<FineTunedModel>,
  ) {}

  async findAll(organizationId: string, workspaceId?: string): Promise<Agent[]> {
    const query: any = { organizationId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    return this.agentsRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Agent> {
    const agent = await this.agentsRepository.findOne({
      where: { id, organizationId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async create(createDto: CreateAgentDto, organizationId: string): Promise<Agent> {
    const agent = this.agentsRepository.create({
      ...createDto,
      organizationId,
    });

    return this.agentsRepository.save(agent);
  }

  async update(id: string, updateDto: UpdateAgentDto, organizationId: string): Promise<Agent> {
    await this.agentsRepository.update({ id, organizationId }, updateDto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const result = await this.agentsRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Agent not found');
    }
  }

  /**
   * Get available models including base models and fine-tuned models
   */
  async getAvailableModels(organizationId: string): Promise<{
    baseModels: Array<{ id: string; name: string; provider: string; description: string }>;
    fineTunedModels: Array<{ id: string; name: string; provider: string; providerModelId: string; baseModel: string }>;
  }> {
    // Base models from OpenAI
    const baseModels = [
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Most capable model, best for complex tasks' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai', description: 'Faster GPT-4 with 128k context' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and cost-effective' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', provider: 'openai', description: 'Extended context window' },
    ];

    // Get organization's fine-tuned models
    const fineTunedModels = await this.fineTunedModelsRepository.find({
      where: {
        organizationId,
        status: FineTunedModelStatus.ACTIVE,
        deployed: true,
      },
      relations: ['job'],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      baseModels,
      fineTunedModels: fineTunedModels.map((model) => ({
        id: model.providerModelId, // Use provider model ID for API calls
        name: model.name,
        provider: model.provider,
        providerModelId: model.providerModelId,
        baseModel: model.baseModel,
      })),
    };
  }
}
