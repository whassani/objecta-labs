import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import {
  WorkflowExecution,
  WorkflowExecutionStatus,
} from './entities/workflow-execution.entity';
import {
  WorkflowExecutionStep,
  StepStatus,
} from './entities/workflow-execution-step.entity';
import { WorkflowsService } from './workflows.service';
import { ExecuteWorkflowDto } from './dto/workflow.dto';

export interface ExecutionContext {
  variables: Record<string, any>;
  stepOutputs: Record<string, any>;
  triggerData: Record<string, any>;
}

@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    @InjectRepository(WorkflowExecutionStep)
    private stepRepository: Repository<WorkflowExecutionStep>,
    private workflowsService: WorkflowsService,
  ) {}

  async executeWorkflow(
    workflowId: string,
    organizationId: string,
    executeDto: ExecuteWorkflowDto,
  ): Promise<WorkflowExecution> {
    this.logger.log(`Starting execution of workflow ${workflowId}`);

    // Get workflow
    const workflowDto = await this.workflowsService.findOne(workflowId, organizationId);
    const workflow = await this.getWorkflowEntity(workflowId, organizationId);

    // Create execution record
    const execution = this.executionRepository.create({
      workflowId,
      workflowVersion: workflow.version,
      status: WorkflowExecutionStatus.RUNNING,
      triggerData: executeDto.triggerData || {},
      context: executeDto.context || {},
      startTime: new Date(),
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Execute workflow asynchronously
    this.executeWorkflowAsync(savedExecution.id, workflow, executeDto).catch((error) => {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
    });

    // Update workflow stats
    await this.workflowsService.updateExecutionStats(workflowId);

    return savedExecution;
  }

  private async executeWorkflowAsync(
    executionId: string,
    workflow: Workflow,
    executeDto: ExecuteWorkflowDto,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize execution context
      const context: ExecutionContext = {
        variables: executeDto.context || {},
        stepOutputs: {},
        triggerData: executeDto.triggerData || {},
      };

      // Get workflow definition
      const { nodes, edges } = workflow.definition;

      // Find trigger node (starting point)
      const triggerNode = nodes.find((node) => 
        node.type.startsWith('trigger') || node.type === workflow.triggerType
      );

      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      // Execute workflow starting from trigger
      await this.executeNode(executionId, triggerNode, nodes, edges, context);

      // Mark execution as completed
      const durationMs = Date.now() - startTime;
      await this.executionRepository.update(executionId, {
        status: WorkflowExecutionStatus.COMPLETED,
        endTime: new Date(),
        durationMs,
        context,
      });

      this.logger.log(`Workflow execution ${executionId} completed in ${durationMs}ms`);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      await this.executionRepository.update(executionId, {
        status: WorkflowExecutionStatus.FAILED,
        endTime: new Date(),
        durationMs,
        error: error.message,
      });

      this.logger.error(`Workflow execution ${executionId} failed: ${error.message}`);
      throw error;
    }
  }

  private async executeNode(
    executionId: string,
    node: any,
    allNodes: any[],
    edges: any[],
    context: ExecutionContext,
  ): Promise<any> {
    const stepStartTime = Date.now();

    // Create step record
    const step = this.stepRepository.create({
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.data.label || node.data.name || node.type,
      status: StepStatus.RUNNING,
      inputData: context.stepOutputs,
      startTime: new Date(),
    });

    const savedStep = await this.stepRepository.save(step);

    try {
      // Execute node based on type
      const output = await this.executeNodeLogic(node, context);

      // Update step with output
      const durationMs = Date.now() - stepStartTime;
      await this.stepRepository.update(savedStep.id, {
        status: StepStatus.COMPLETED,
        outputData: output,
        endTime: new Date(),
        durationMs,
      });

      // Store output in context
      context.stepOutputs[node.id] = output;

      // Find and execute next nodes
      const nextEdges = edges.filter((edge) => edge.source === node.id);
      
      for (const edge of nextEdges) {
        const nextNode = allNodes.find((n) => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(executionId, nextNode, allNodes, edges, context);
        }
      }

      return output;
    } catch (error) {
      const durationMs = Date.now() - stepStartTime;
      await this.stepRepository.update(savedStep.id, {
        status: StepStatus.FAILED,
        error: error.message,
        endTime: new Date(),
        durationMs,
      });

      throw error;
    }
  }

  private async executeNodeLogic(node: any, context: ExecutionContext): Promise<any> {
    this.logger.debug(`Executing node ${node.id} of type ${node.type}`);

    // Node execution logic will be implemented in Phase 2
    // For now, return mock data based on node type
    switch (node.type) {
      case 'trigger-manual':
      case 'manual':
        return { triggered: true, data: context.triggerData };

      case 'action-agent':
        return { response: 'Agent response placeholder', success: true };

      case 'action-tool':
        return { result: 'Tool execution placeholder', success: true };

      case 'action-http':
        return { statusCode: 200, data: 'HTTP response placeholder' };

      case 'control-condition':
        // Evaluate condition
        const condition = node.data.condition || true;
        return { result: condition, branch: condition ? 'true' : 'false' };

      case 'control-delay':
        const delayMs = node.data.delay || 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return { delayed: delayMs };

      default:
        return { message: 'Node executed', type: node.type };
    }
  }

  async getExecution(id: string, organizationId: string): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id },
      relations: ['workflow', 'steps'],
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID ${id} not found`);
    }

    // Verify organization access
    if (execution.workflow.organizationId !== organizationId) {
      throw new NotFoundException(`Execution with ID ${id} not found`);
    }

    return execution;
  }

  async listExecutions(
    workflowId: string,
    organizationId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: WorkflowExecution[]; total: number }> {
    const [data, total] = await this.executionRepository.findAndCount({
      where: { workflowId },
      relations: ['workflow'],
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter by organization
    const filtered = data.filter((exec) => exec.workflow.organizationId === organizationId);

    return { data: filtered, total };
  }

  async cancelExecution(id: string, organizationId: string): Promise<void> {
    const execution = await this.getExecution(id, organizationId);

    if (execution.status !== WorkflowExecutionStatus.RUNNING) {
      throw new Error('Only running executions can be cancelled');
    }

    await this.executionRepository.update(id, {
      status: WorkflowExecutionStatus.CANCELLED,
      endTime: new Date(),
    });

    this.logger.log(`Execution ${id} cancelled`);
  }

  private async getWorkflowEntity(id: string, organizationId: string): Promise<Workflow> {
    const workflow = await this.executionRepository.manager.findOne(Workflow, {
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }
}
