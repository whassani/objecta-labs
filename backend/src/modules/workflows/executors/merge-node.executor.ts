import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class MergeNodeExecutor extends BaseNodeExecutor {
  private readonly logger = new Logger(MergeNodeExecutor.name);

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { mergeStrategy = 'waitAll', timeoutMs = 30000 } = node.data;

      // Get all step outputs that are connected to this merge node
      const stepOutputs = context.stepOutputs || {};
      const allOutputs = Object.values(stepOutputs);

      this.logger.log(`Merge node combining ${allOutputs.length} branch outputs`);

      let mergedData: any;

      switch (mergeStrategy) {
        case 'waitAll':
          // Wait for all branches (default behavior)
          mergedData = {
            branches: allOutputs,
            branchCount: allOutputs.length,
            strategy: 'waitAll',
          };
          break;

        case 'firstComplete':
          // Take the first completed branch
          mergedData = {
            result: allOutputs[0],
            branchCount: allOutputs.length,
            strategy: 'firstComplete',
          };
          break;

        case 'combine':
          // Combine all outputs into a single object
          mergedData = Object.assign({}, ...allOutputs.map(output => 
            typeof output === 'object' ? output : { value: output }
          ));
          mergedData.branchCount = allOutputs.length;
          mergedData.strategy = 'combine';
          break;

        case 'array':
          // Collect all outputs into an array
          mergedData = {
            items: allOutputs,
            count: allOutputs.length,
            strategy: 'array',
          };
          break;

        default:
          mergedData = {
            branches: allOutputs,
            branchCount: allOutputs.length,
            strategy: mergeStrategy,
          };
      }

      return {
        success: true,
        data: {
          ...mergedData,
          merged: true,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Merge execution failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Merge node execution failed: ${error.message}`,
      };
    }
  }
}
