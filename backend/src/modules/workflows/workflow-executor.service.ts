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
import { TriggerNodeExecutor } from './executors/trigger-node.executor';
import { HttpNodeExecutor } from './executors/http-node.executor';
import { ConditionNodeExecutor } from './executors/condition-node.executor';
import { DelayNodeExecutor } from './executors/delay-node.executor';
import { AgentNodeExecutor } from './executors/agent-node.executor';
import { ToolNodeExecutor } from './executors/tool-node.executor';
import { EmailNodeExecutor } from './executors/email-node.executor';
import { LoopNodeExecutor } from './executors/loop-node.executor';
import { MergeNodeExecutor } from './executors/merge-node.executor';

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
    private triggerNodeExecutor: TriggerNodeExecutor,
    private httpNodeExecutor: HttpNodeExecutor,
    private conditionNodeExecutor: ConditionNodeExecutor,
    private delayNodeExecutor: DelayNodeExecutor,
    private agentNodeExecutor: AgentNodeExecutor,
    private toolNodeExecutor: ToolNodeExecutor,
    private emailNodeExecutor: EmailNodeExecutor,
    private loopNodeExecutor: LoopNodeExecutor,
    private mergeNodeExecutor: MergeNodeExecutor,
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

    // Execute workflow asynchronously, passing organizationId
    this.executeWorkflowAsync(savedExecution.id, workflow, executeDto, organizationId).catch((error) => {
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
    organizationId: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize execution context with organizationId
      const context: ExecutionContext = {
        variables: {
          ...(executeDto.context || {}),
          organizationId, // Make organizationId available to all nodes
        },
        stepOutputs: {},
        triggerData: {
          ...(executeDto.triggerData || {}),
          organizationId, // Also in triggerData for backward compatibility
        },
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
        context: context as any,
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
      // For condition nodes, filter by the result (true/false handle)
      let nextEdges = edges.filter((edge) => edge.source === node.id);
      
      // If node has a nextNodeId (from condition), filter edges by sourceHandle
      if (output.nextNodeId) {
        nextEdges = nextEdges.filter((edge) => edge.sourceHandle === output.nextNodeId);
      }
      
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

    let result;

    // Route to appropriate executor based on node type
    if (node.type.startsWith('trigger') || node.type === 'manual') {
      result = await this.triggerNodeExecutor.execute(node, context);
    } else if (node.type === 'action' || node.type.startsWith('action-')) {
      const actionType = node.data.actionType || node.type.replace('action-', '');
      
      switch (actionType) {
        case 'agent':
          result = await this.agentNodeExecutor.execute(node, context);
          break;
        case 'tool':
          result = await this.toolNodeExecutor.execute(node, context);
          break;
        case 'http':
          result = await this.httpNodeExecutor.execute(node, context);
          break;
        case 'email':
          result = await this.emailNodeExecutor.execute(node, context);
          break;
        default:
          result = { success: false, error: `Unknown action type: ${actionType}` };
      }
    } else if (node.type === 'condition' || node.type.startsWith('control-')) {
      const controlType = node.data.controlType || node.type.replace('control-', '');
      
      switch (controlType) {
        case 'condition':
          result = await this.conditionNodeExecutor.execute(node, context);
          break;
        case 'delay':
          result = await this.delayNodeExecutor.execute(node, context);
          break;
        case 'loop':
          result = await this.loopNodeExecutor.execute(node, context);
          break;
        case 'merge':
          result = await this.mergeNodeExecutor.execute(node, context);
          break;
        default:
          result = { success: false, error: `Unknown control type: ${controlType}` };
      }
    } else {
      result = { success: false, error: `Unknown node type: ${node.type}` };
    }

    // Log execution result
    if (result.success) {
      this.logger.debug(`Node ${node.id} executed successfully`);
    } else {
      this.logger.warn(`Node ${node.id} execution failed: ${result.error}`);
    }

    return result;
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
