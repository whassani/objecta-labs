import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@Injectable()
export class ToolsService {
  constructor(
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
  ) {}

  async findAll(organizationId: string): Promise<Tool[]> {
    return this.toolsRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Tool> {
    const tool = await this.toolsRepository.findOne({
      where: { id, organizationId },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    return tool;
  }

  async create(createDto: CreateToolDto, organizationId: string): Promise<Tool> {
    const tool = this.toolsRepository.create({
      ...createDto,
      organizationId,
    });

    return this.toolsRepository.save(tool);
  }

  async update(id: string, updateDto: UpdateToolDto, organizationId: string): Promise<Tool> {
    await this.toolsRepository.update({ id, organizationId }, updateDto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const result = await this.toolsRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Tool not found');
    }
  }
}
