import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class LoopNodeExecutor extends BaseNodeExecutor {
  private readonly logger = new Logger(LoopNodeExecutor.name);

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { items, maxIterations = 1000 } = node.data;

      if (!items) {
        throw new Error('Items array is required for loop node');
      }

      // Get items from context or use provided items
      let itemsArray: any[];
      
      if (typeof items === 'string') {
        // Try to get from context
        const contextValue = this.getInputValue(items, context);
        if (Array.isArray(contextValue)) {
          itemsArray = contextValue;
        } else if (contextValue) {
          // Try to parse as JSON
          try {
            itemsArray = JSON.parse(contextValue);
          } catch {
            itemsArray = [contextValue];
          }
        } else {
          itemsArray = [];
        }
      } else if (Array.isArray(items)) {
        itemsArray = items;
      } else {
        itemsArray = [items];
      }

      this.logger.log(`Loop processing ${itemsArray.length} items`);

      // Limit iterations to prevent infinite loops
      const iterations = Math.min(itemsArray.length, maxIterations);
      const results: any[] = [];

      for (let i = 0; i < iterations; i++) {
        const item = itemsArray[i];
        
        // Add loop variables to context for child nodes
        const loopContext = {
          ...context,
          variables: {
            ...context.variables,
            loopItem: item,
            loopIndex: i,
            loopTotal: itemsArray.length,
            loopFirst: i === 0,
            loopLast: i === itemsArray.length - 1,
          },
        };

        // TODO: Execute child nodes for each iteration
        // For now, just collect the items
        results.push({
          index: i,
          item,
          processed: true,
        });
      }

      return {
        success: true,
        data: {
          totalItems: itemsArray.length,
          processedItems: iterations,
          skippedItems: itemsArray.length - iterations,
          results,
          completed: true,
        },
      };
    } catch (error) {
      this.logger.error(`Loop execution failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Loop node execution failed: ${error.message}`,
      };
    }
  }
}
