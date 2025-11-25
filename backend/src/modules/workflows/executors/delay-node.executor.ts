import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class DelayNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { delay = 1000, unit = 'ms' } = node.data;

      let delayMs = delay;

      // Convert to milliseconds based on unit
      switch (unit) {
        case 's':
        case 'seconds':
          delayMs = delay * 1000;
          break;
        case 'm':
        case 'minutes':
          delayMs = delay * 60 * 1000;
          break;
        case 'h':
        case 'hours':
          delayMs = delay * 60 * 60 * 1000;
          break;
        case 'ms':
        case 'milliseconds':
        default:
          delayMs = delay;
          break;
      }

      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const actualDelay = Date.now() - startTime;

      return {
        success: true,
        data: {
          requestedDelay: delay,
          unit,
          delayMs,
          actualDelay,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Delay execution failed: ${error.message}`,
      };
    }
  }
}
