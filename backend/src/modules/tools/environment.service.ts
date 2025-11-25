import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolEnvironment } from './entities/tool-environment.entity';

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(ToolEnvironment)
    private environmentRepository: Repository<ToolEnvironment>,
  ) {}

  /**
   * Create a new environment configuration
   */
  async create(
    toolId: string,
    organizationId: string,
    data: {
      name: string;
      config: any;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<ToolEnvironment> {
    // If setting as active, deactivate others
    if (data.isActive) {
      await this.environmentRepository.update(
        { toolId, organizationId },
        { isActive: false },
      );
    }

    const environment = this.environmentRepository.create({
      toolId,
      organizationId,
      ...data,
    });

    return this.environmentRepository.save(environment);
  }

  /**
   * Get all environments for a tool
   */
  async findAll(toolId: string, organizationId: string): Promise<ToolEnvironment[]> {
    return this.environmentRepository.find({
      where: { toolId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active environment for a tool
   */
  async getActive(toolId: string, organizationId: string): Promise<ToolEnvironment | null> {
    return this.environmentRepository.findOne({
      where: { toolId, organizationId, isActive: true },
    });
  }

  /**
   * Switch active environment
   */
  async setActive(
    environmentId: string,
    toolId: string,
    organizationId: string,
  ): Promise<ToolEnvironment> {
    // Deactivate all environments for this tool
    await this.environmentRepository.update(
      { toolId, organizationId },
      { isActive: false },
    );

    // Activate the specified environment
    await this.environmentRepository.update(
      { id: environmentId, toolId, organizationId },
      { isActive: true },
    );

    const environment = await this.environmentRepository.findOne({
      where: { id: environmentId, toolId, organizationId },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    return environment;
  }

  /**
   * Update environment configuration
   */
  async update(
    environmentId: string,
    toolId: string,
    organizationId: string,
    data: Partial<ToolEnvironment>,
  ): Promise<ToolEnvironment> {
    await this.environmentRepository.update(
      { id: environmentId, toolId, organizationId },
      data,
    );

    const environment = await this.environmentRepository.findOne({
      where: { id: environmentId, toolId, organizationId },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    return environment;
  }

  /**
   * Delete an environment
   */
  async delete(
    environmentId: string,
    toolId: string,
    organizationId: string,
  ): Promise<void> {
    const result = await this.environmentRepository.delete({
      id: environmentId,
      toolId,
      organizationId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Environment not found');
    }
  }

  /**
   * Get default environment names
   */
  static getDefaultEnvironments(): string[] {
    return ['development', 'staging', 'production'];
  }
}
