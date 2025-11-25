import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';
import { ToolExecutorService } from '../../tools/tool-executor.service';

@Injectable()
export class ToolNodeExecutor extends BaseNodeExecutor {
  private readonly logger = new Logger(ToolNodeExecutor.name);

  constructor(private toolExecutorService: ToolExecutorService) {
    super();
  }

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { toolId, toolName, input } = node.data;

      if (!toolId && !toolName) {
        this.logger.warn(`Tool node ${node.id} executed without toolId or toolName configured`);
        return {
          success: false,
          error: 'Tool not configured. Please select a tool in the node editor.',
        };
      }

      // Prepare input for tool execution
      let toolInput = input;

      // If input is a string template, interpolate it
      if (typeof input === 'string') {
        toolInput = this.interpolateTemplate(input, context);
        // Try to parse as JSON if it looks like JSON
        if (toolInput.startsWith('{') || toolInput.startsWith('[')) {
          try {
            toolInput = JSON.parse(toolInput);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
      } else if (typeof input === 'object' && input !== null) {
        // Interpolate object values
        toolInput = this.interpolateObjectValues(input, context);
      } else if (!input) {
        // Try to get input from context
        toolInput = this.getInputValue('input', context) || {};
      }

      // Get organizationId from context
      const organizationId = context.variables?.organizationId || 
                            context.triggerData?.organizationId;

      if (!organizationId) {
        throw new Error('Organization ID is required for tool execution');
      }

      this.logger.log(`Executing tool ${toolId || toolName} with input: ${JSON.stringify(toolInput)}`);

      // Execute tool using ToolExecutorService
      const result = await this.toolExecutorService.executeTool(
        toolId,
        toolInput,
        organizationId
      );

      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      return {
        success: true,
        data: {
          toolId: result.toolId,
          toolName: result.toolName,
          input: toolInput,
          output: result.result,
          executionTime: result.executionTime,
          timestamp: result.timestamp,
          // Include additional debug info if available
          request: result.request,
          response: result.response,
        },
      };
    } catch (error) {
      this.logger.error(`Tool execution failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Tool execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Recursively interpolate values in an object
   */
  private interpolateObjectValues(obj: any, context: ExecutionContext): any {
    if (typeof obj === 'string') {
      return this.interpolateTemplate(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObjectValues(item, context));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObjectValues(value, context);
      }
      return result;
    }

    return obj;
  }
}
