import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Workflow, WorkflowStatus } from './entities/workflow.entity';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  ListWorkflowsDto,
  WorkflowResponseDto,
  DuplicateWorkflowDto,
} from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
  ) {}

  async create(
    createDto: CreateWorkflowDto,
    organizationId: string,
    userId: string,
  ): Promise<WorkflowResponseDto> {
    const workflow = this.workflowRepository.create({
      ...createDto,
      organizationId,
      createdBy: userId,
      definition: createDto.definition || { nodes: [], edges: [] },
    });

    const saved = await this.workflowRepository.save(workflow);
    return this.toResponseDto(saved);
  }

  async findAll(
    query: ListWorkflowsDto,
    organizationId: string,
  ): Promise<{ data: WorkflowResponseDto[]; total: number; page: number; limit: number }> {
    const {
      search,
      status,
      triggerType,
      tags,
      workspaceId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.workflowRepository
      .createQueryBuilder('workflow')
      .where('workflow.organizationId = :organizationId', { organizationId });

    if (search) {
      qb.andWhere(
        '(workflow.name ILIKE :search OR workflow.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('workflow.status = :status', { status });
    }

    if (triggerType) {
      qb.andWhere('workflow.triggerType = :triggerType', { triggerType });
    }

    if (tags && tags.length > 0) {
      qb.andWhere('workflow.tags && :tags', { tags });
    }

    if (workspaceId) {
      qb.andWhere('workflow.workspaceId = :workspaceId', { workspaceId });
    }

    const total = await qb.getCount();

    const workflows = await qb
      .orderBy(`workflow.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: workflows.map((w) => this.toResponseDto(w)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, organizationId: string): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return this.toResponseDto(workflow);
  }

  async update(
    id: string,
    updateDto: UpdateWorkflowDto,
    organizationId: string,
  ): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // If definition is being updated, increment version
    if (updateDto.definition) {
      updateDto.version = workflow.version + 1;
    }

    Object.assign(workflow, updateDto);
    const updated = await this.workflowRepository.save(workflow);

    return this.toResponseDto(updated);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    await this.workflowRepository.remove(workflow);
  }

  async duplicate(
    id: string,
    duplicateDto: DuplicateWorkflowDto,
    organizationId: string,
    userId: string,
  ): Promise<WorkflowResponseDto> {
    const original = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!original) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const duplicated = this.workflowRepository.create({
      name: duplicateDto.name || `${original.name} (Copy)`,
      description: original.description,
      definition: original.definition,
      triggerType: original.triggerType,
      triggerConfig: original.triggerConfig,
      tags: original.tags,
      status: duplicateDto.copyStatus ? original.status : WorkflowStatus.DRAFT,
      organizationId,
      workspaceId: original.workspaceId,
      createdBy: userId,
      version: 1,
    });

    const saved = await this.workflowRepository.save(duplicated);
    return this.toResponseDto(saved);
  }

  async activate(id: string, organizationId: string): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // Validate workflow before activation
    this.validateWorkflow(workflow);

    workflow.status = WorkflowStatus.ACTIVE;
    const updated = await this.workflowRepository.save(workflow);

    return this.toResponseDto(updated);
  }

  async deactivate(id: string, organizationId: string): Promise<WorkflowResponseDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    workflow.status = WorkflowStatus.PAUSED;
    const updated = await this.workflowRepository.save(workflow);

    return this.toResponseDto(updated);
  }

  async updateExecutionStats(id: string): Promise<void> {
    await this.workflowRepository.update(id, {
      lastExecutedAt: new Date(),
      executionCount: () => 'execution_count + 1',
    });
  }

  private validateWorkflow(workflow: Workflow): void {
    const { definition, triggerType } = workflow;

    // Check if workflow has at least one node
    if (!definition.nodes || definition.nodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one node');
    }

    // Check if workflow has a trigger node
    const hasTrigger = definition.nodes.some((node) => 
      node.type.startsWith('trigger') || node.type === triggerType
    );

    if (!hasTrigger) {
      throw new BadRequestException('Workflow must have a trigger node');
    }

    // Additional validation can be added here
  }

  private toResponseDto(workflow: Workflow): WorkflowResponseDto {
    return {
      id: workflow.id,
      organizationId: workflow.organizationId,
      workspaceId: workflow.workspaceId,
      name: workflow.name,
      description: workflow.description,
      definition: workflow.definition,
      status: workflow.status,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      version: workflow.version,
      tags: workflow.tags,
      createdBy: workflow.createdBy,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      lastExecutedAt: workflow.lastExecutedAt,
      executionCount: workflow.executionCount,
    };
  }
}
