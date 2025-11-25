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

  /**
   * Duplicate a tool with a new name
   */
  async duplicate(id: string, organizationId: string, newName?: string): Promise<Tool> {
    const originalTool = await this.findOne(id, organizationId);
    
    const duplicatedTool = this.toolsRepository.create({
      ...originalTool,
      id: undefined, // Remove ID to create new entity
      name: newName || `${originalTool.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.toolsRepository.save(duplicatedTool);
  }

  /**
   * Bulk enable/disable tools
   */
  async bulkUpdateStatus(ids: string[], isEnabled: boolean, organizationId: string): Promise<void> {
    await this.toolsRepository
      .createQueryBuilder()
      .update()
      .set({ isEnabled })
      .where('id IN (:...ids)', { ids })
      .andWhere('organizationId = :organizationId', { organizationId })
      .execute();
  }

  /**
   * Bulk delete tools
   */
  async bulkDelete(ids: string[], organizationId: string): Promise<void> {
    await this.toolsRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids })
      .andWhere('organizationId = :organizationId', { organizationId })
      .execute();
  }

  /**
   * Export tools as JSON
   */
  async exportTools(ids: string[], organizationId: string): Promise<any[]> {
    let query = this.toolsRepository
      .createQueryBuilder('tool')
      .where('tool.organizationId = :organizationId', { organizationId });
    
    if (ids.length > 0) {
      query = query.andWhere('tool.id IN (:...ids)', { ids });
    }
    
    const tools = await query.getMany();

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      toolType: tool.toolType,
      actionType: tool.actionType,
      config: tool.config,
      schema: tool.schema,
      permissions: tool.permissions,
      requiresApproval: tool.requiresApproval,
      rateLimit: tool.rateLimit,
      isEnabled: tool.isEnabled,
    }));
  }

  /**
   * Import tools from JSON
   */
  async importTools(toolsData: CreateToolDto[], organizationId: string): Promise<Tool[]> {
    const importedTools: Tool[] = [];
    
    for (const toolData of toolsData) {
      const tool = await this.create(toolData, organizationId);
      importedTools.push(tool);
    }

    return importedTools;
  }

  /**
   * Get tools by category/tag
   */
  async findByCategory(category: string, organizationId: string): Promise<Tool[]> {
    return this.toolsRepository.find({
      where: { 
        organizationId,
        // Assuming categories are stored in config or metadata
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get tool templates
   */
  getTemplates(): any[] {
    return [
      {
        name: 'Weather API',
        description: 'Get current weather data from OpenWeatherMap',
        toolType: 'http-api',
        actionType: 'read',
        config: {
          url: 'https://api.openweathermap.org/data/2.5/weather',
          method: 'GET',
          headers: {},
          auth: {
            type: 'api-key',
            credentials: {
              apiKey: '',
              headerName: 'X-API-Key',
            },
          },
        },
        schema: {
          input: {
            type: 'object',
            properties: {
              city: { type: 'string', description: 'City name' },
            },
            required: ['city'],
          },
        },
        requiresApproval: false,
        rateLimit: 60,
        isEnabled: true,
      },
      {
        name: 'GitHub API - Get Repository',
        description: 'Fetch repository information from GitHub',
        toolType: 'http-api',
        actionType: 'read',
        config: {
          url: 'https://api.github.com/repos/{owner}/{repo}',
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          auth: {
            type: 'bearer',
            credentials: {
              token: '',
            },
          },
        },
        schema: {
          input: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
            },
            required: ['owner', 'repo'],
          },
        },
        requiresApproval: false,
        rateLimit: 5000,
        isEnabled: true,
      },
      {
        name: 'Slack Message',
        description: 'Send a message to a Slack channel',
        toolType: 'http-api',
        actionType: 'write',
        config: {
          url: 'https://slack.com/api/chat.postMessage',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            type: 'bearer',
            credentials: {
              token: '',
            },
          },
        },
        schema: {
          input: {
            type: 'object',
            properties: {
              channel: { type: 'string', description: 'Channel ID or name' },
              text: { type: 'string', description: 'Message text' },
            },
            required: ['channel', 'text'],
          },
        },
        requiresApproval: true,
        rateLimit: 100,
        isEnabled: true,
      },
      {
        name: 'REST API GET',
        description: 'Generic GET request to any REST API',
        toolType: 'http-api',
        actionType: 'read',
        config: {
          url: '',
          method: 'GET',
          headers: {},
          auth: {
            type: 'none',
            credentials: {},
          },
        },
        schema: {},
        requiresApproval: false,
        rateLimit: 60,
        isEnabled: true,
      },
      {
        name: 'REST API POST',
        description: 'Generic POST request to any REST API',
        toolType: 'http-api',
        actionType: 'write',
        config: {
          url: '',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          auth: {
            type: 'none',
            credentials: {},
          },
        },
        schema: {},
        requiresApproval: false,
        rateLimit: 60,
        isEnabled: true,
      },
    ];
  }
}
