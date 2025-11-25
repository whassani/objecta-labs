import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
  ) {}

  async findAll(organizationId: string): Promise<Workspace[]> {
    return this.workspacesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Workspace> {
    const workspace = await this.workspacesRepository.findOne({
      where: { id, organizationId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async create(createDto: CreateWorkspaceDto, organizationId: string): Promise<Workspace> {
    const workspace = this.workspacesRepository.create({
      ...createDto,
      organizationId,
    });

    return this.workspacesRepository.save(workspace);
  }

  async update(id: string, updateDto: UpdateWorkspaceDto, organizationId: string): Promise<Workspace> {
    await this.workspacesRepository.update({ id, organizationId }, updateDto);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const result = await this.workspacesRepository.delete({ id, organizationId });
    
    if (result.affected === 0) {
      throw new NotFoundException('Workspace not found');
    }
  }
}
