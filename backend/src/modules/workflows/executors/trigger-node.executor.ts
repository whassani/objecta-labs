import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class TriggerNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    // Trigger nodes pass through the trigger data
    // Spread triggerData into output so it's accessible to downstream nodes
    return {
      success: true,
      data: {
        ...context.triggerData,  // ← Spread test data into output
        triggered: true,
        triggerType: node.data.triggerType || 'manual',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
