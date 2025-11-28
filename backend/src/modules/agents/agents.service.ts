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
    // Base models from multiple providers
    const baseModels = [
      // OpenAI Models
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', description: 'Most capable model, best for complex tasks' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai', description: 'Faster GPT-4 with 128k context' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and cost-effective' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', provider: 'openai', description: 'Extended context window' },
      
      // Anthropic Claude Models
      { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most capable Claude model' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', description: 'Balanced performance and speed' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fastest Claude model' },
      { id: 'claude-2.1', name: 'Claude 2.1', provider: 'anthropic', description: 'Previous generation Claude' },
      
      // Google Gemini Models
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', description: 'Google\'s multimodal AI model' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'google', description: 'Gemini with vision capabilities' },
      
      // Ollama Models (Local/Open Source)
      { id: 'llama2', name: 'Llama 2', provider: 'ollama', description: 'Meta\'s open source model' },
      { id: 'llama2:13b', name: 'Llama 2 13B', provider: 'ollama', description: 'Larger Llama 2 variant' },
      { id: 'llama2:70b', name: 'Llama 2 70B', provider: 'ollama', description: 'Largest Llama 2 variant' },
      { id: 'mistral', name: 'Mistral', provider: 'ollama', description: 'High-performance open model' },
      { id: 'mixtral', name: 'Mixtral 8x7B', provider: 'ollama', description: 'Mixture of Experts model' },
      { id: 'codellama', name: 'Code Llama', provider: 'ollama', description: 'Specialized for coding tasks' },
      { id: 'phi', name: 'Phi-2', provider: 'ollama', description: 'Microsoft\'s efficient model' },
      { id: 'neural-chat', name: 'Neural Chat', provider: 'ollama', description: 'Fine-tuned for conversations' },
      { id: 'starling-lm', name: 'Starling', provider: 'ollama', description: 'High quality responses' },
      { id: 'orca-mini', name: 'Orca Mini', provider: 'ollama', description: 'Compact but capable' },
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
