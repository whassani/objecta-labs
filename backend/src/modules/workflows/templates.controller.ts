import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowsService } from './workflows.service';

@Controller('workflow-templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private templateRepository: Repository<WorkflowTemplate>,
    private workflowsService: WorkflowsService,
  ) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    const where: any = { isPublic: true };
    if (category) {
      where.category = category;
    }

    return await this.templateRepository.find({
      where,
      order: { useCount: 'DESC', createdAt: 'DESC' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.templateRepository.findOne({
      where: { id },
    });
  }

  @Post(':id/deploy')
  async deployTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; workspaceId?: string },
    @Request() req,
  ) {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Create workflow from template
    const workflow = await this.workflowsService.create(
      {
        name: body.name || template.name,
        description: template.description,
        definition: template.definition,
        workspaceId: body.workspaceId,
      },
      req.user.organizationId,
      req.user.userId,
    );

    // Increment use count
    await this.templateRepository.update(id, {
      useCount: template.useCount + 1,
    });

    return workflow;
  }
}
