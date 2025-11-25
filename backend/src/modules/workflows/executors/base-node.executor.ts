import { ExecutionContext } from '../workflow-executor.service';

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextNodeId?: string; // For conditional branching
}

export abstract class BaseNodeExecutor {
  abstract execute(
    node: any,
    context: ExecutionContext,
  ): Promise<NodeExecutionResult>;

  protected getInputValue(key: string, context: ExecutionContext): any {
    // Try to get value from previous step outputs
    if (context.stepOutputs[key]) {
      return context.stepOutputs[key];
    }

    // Try to get from variables
    if (context.variables[key]) {
      return context.variables[key];
    }

    // Try to get from trigger data
    if (context.triggerData[key]) {
      return context.triggerData[key];
    }

    return null;
  }

  protected evaluateExpression(expression: string, context: ExecutionContext): any {
    try {
      // Create a safe evaluation context
      const evalContext = {
        ...context.variables,
        ...context.stepOutputs,
        trigger: context.triggerData,
      };

      // Simple expression evaluation (for production, use a proper expression evaluator)
      const func = new Function(...Object.keys(evalContext), `return ${expression}`);
      return func(...Object.values(evalContext));
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${expression}. Error: ${error.message}`);
    }
  }

  protected interpolateTemplate(template: string, context: ExecutionContext): string {
    // Replace {{variable}} with actual values
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getInputValue(key.trim(), context);
      return value !== null ? String(value) : match;
    });
  }
}
