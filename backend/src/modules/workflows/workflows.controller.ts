import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  ExecuteWorkflowDto,
  ListWorkflowsDto,
  DuplicateWorkflowDto,
} from './dto/workflow.dto';
import { ListExecutionsDto } from './dto/execution.dto';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly executorService: WorkflowExecutorService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateWorkflowDto, @Request() req) {
    return this.workflowsService.create(
      createDto,
      req.user.organizationId,
      req.user.userId,
    );
  }

  @Get()
  async findAll(@Query() query: ListWorkflowsDto, @Request() req) {
    return this.workflowsService.findAll(query, req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workflowsService.findOne(id, req.user.organizationId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowDto,
    @Request() req,
  ) {
    return this.workflowsService.update(id, updateDto, req.user.organizationId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.workflowsService.remove(id, req.user.organizationId);
    return { message: 'Workflow deleted successfully' };
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @Body() duplicateDto: DuplicateWorkflowDto,
    @Request() req,
  ) {
    return this.workflowsService.duplicate(
      id,
      duplicateDto,
      req.user.organizationId,
      req.user.userId,
    );
  }

  @Put(':id/activate')
  async activate(@Param('id') id: string, @Request() req) {
    return this.workflowsService.activate(id, req.user.organizationId);
  }

  @Put(':id/deactivate')
  async deactivate(@Param('id') id: string, @Request() req) {
    return this.workflowsService.deactivate(id, req.user.organizationId);
  }

  @Post(':id/execute')
  async execute(
    @Param('id') id: string,
    @Body() executeDto: ExecuteWorkflowDto,
    @Request() req,
  ) {
    return this.executorService.executeWorkflow(
      id,
      req.user.organizationId,
      executeDto,
    );
  }

  @Get(':id/executions')
  async listExecutions(
    @Param('id') id: string,
    @Query() query: ListExecutionsDto,
    @Request() req,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    return this.executorService.listExecutions(
      id,
      req.user.organizationId,
      page,
      limit,
    );
  }

  @Get('executions/:executionId')
  async getExecution(@Param('executionId') executionId: string, @Request() req) {
    return this.executorService.getExecution(executionId, req.user.organizationId);
  }

  @Post('executions/:executionId/cancel')
  async cancelExecution(@Param('executionId') executionId: string, @Request() req) {
    await this.executorService.cancelExecution(executionId, req.user.organizationId);
    return { message: 'Execution cancelled successfully' };
  }

  @Post('executions/:executionId/stop')
  async stopExecution(@Param('executionId') executionId: string, @Request() req) {
    await this.executorService.cancelExecution(executionId, req.user.organizationId);
    return { message: 'Execution stopped successfully' };
  }

  @Get('executions/:executionId/stream')
  async streamExecution(@Param('executionId') executionId: string, @Request() req) {
    // WebSocket endpoint for streaming execution updates
    // This will be handled by a WebSocket gateway
    return { message: 'WebSocket streaming endpoint' };
  }
}
