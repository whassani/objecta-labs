import { Injectable } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class DelayNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Support both 'duration' (new) and 'delay' (old) for backwards compatibility
      const duration = node.data.duration || node.data.delay || 1;
      const unit = node.data.unit || 'seconds';

      let delayMs = duration;

      // Convert to milliseconds based on unit
      switch (unit) {
        case 's':
        case 'seconds':
          delayMs = duration * 1000;
          break;
        case 'm':
        case 'minutes':
          delayMs = duration * 60 * 1000;
          break;
        case 'h':
        case 'hours':
          delayMs = duration * 60 * 60 * 1000;
          break;
        case 'ms':
        case 'milliseconds':
          delayMs = duration;
          break;
        case 'days':
          delayMs = duration * 24 * 60 * 60 * 1000;
          break;
        default:
          // If unit not recognized, treat duration as seconds
          delayMs = duration * 1000;
          break;
      }

      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const actualDelay = Date.now() - startTime;

      return {
        success: true,
        data: {
          requestedDuration: duration,
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
