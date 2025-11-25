import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class ConditionNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { condition } = node.data;

      if (!condition) {
        throw new Error('Condition expression is required');
      }

      // Evaluate the condition
      const result = this.evaluateExpression(condition, context);
      const boolResult = Boolean(result);

      return {
        success: true,
        data: {
          condition,
          result: boolResult,
          branch: boolResult ? 'true' : 'false',
          evaluatedValue: result,
        },
        nextNodeId: boolResult ? 'true' : 'false', // Used for branching
      };
    } catch (error) {
      return {
        success: false,
        error: `Condition evaluation failed: ${error.message}`,
        data: {
          condition: node.data.condition,
          result: false,
          branch: 'false',
        },
      };
    }
  }
}
