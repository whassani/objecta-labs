import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentsRepository: Repository<Agent>,
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
}
