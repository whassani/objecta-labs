import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutorService } from './workflow-executor.service';
import { Workflow } from './entities/workflow.entity';
import { WorkflowExecution } from './entities/workflow-execution.entity';
import { WorkflowExecutionStep } from './entities/workflow-execution-step.entity';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowSecret } from './entities/workflow-secret.entity';
import { WorkflowWebhook } from './entities/workflow-webhook.entity';
import { TriggerNodeExecutor } from './executors/trigger-node.executor';
import { HttpNodeExecutor } from './executors/http-node.executor';
import { ConditionNodeExecutor } from './executors/condition-node.executor';
import { DelayNodeExecutor } from './executors/delay-node.executor';
import { AgentNodeExecutor } from './executors/agent-node.executor';
import { ToolNodeExecutor } from './executors/tool-node.executor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowExecution,
      WorkflowExecutionStep,
      WorkflowTemplate,
      WorkflowSecret,
      WorkflowWebhook,
    ]),
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowExecutorService,
    TriggerNodeExecutor,
    HttpNodeExecutor,
    ConditionNodeExecutor,
    DelayNodeExecutor,
    AgentNodeExecutor,
    ToolNodeExecutor,
  ],
  exports: [WorkflowsService, WorkflowExecutorService],
})
export class WorkflowsModule {}
