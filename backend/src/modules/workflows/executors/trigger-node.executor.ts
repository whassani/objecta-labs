import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class TriggerNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    // Trigger nodes just pass through the trigger data
    return {
      success: true,
      data: {
        triggered: true,
        triggerType: node.data.triggerType || 'manual',
        triggerData: context.triggerData,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
