import { Logger } from '@nestjs/common';

export class CalculatorTool {
  private readonly logger = new Logger(CalculatorTool.name);

  async execute(input: string): Promise<any> {
    try {
      this.logger.log(`Executing calculator: ${input}`);

      // Clean and validate the expression
      const expression = this.sanitizeExpression(input);
      
      // Use Function constructor for safe evaluation (better than eval)
      // Only allow math operations, no access to global scope
      const result = this.evaluateExpression(expression);

      this.logger.log(`Calculator result: ${result}`);
      
      return {
        expression: input,
        result: result,
        formatted: `${input} = ${result}`,
      };
    } catch (error) {
      this.logger.error(`Calculator error:`, error.message);
      throw new Error(`Cannot evaluate expression: ${error.message}`);
    }
  }

  private sanitizeExpression(expression: string): string {
    // Remove any whitespace
    let sanitized = expression.replace(/\s/g, '');
    
    // Only allow numbers, basic operators, parentheses, and decimal points
    const validChars = /^[0-9+\-*/().]+$/;
    
    if (!validChars.test(sanitized)) {
      throw new Error('Invalid characters in expression. Only numbers and operators (+, -, *, /, parentheses) are allowed.');
    }

    return sanitized;
  }

  private evaluateExpression(expression: string): number {
    try {
      // Use Function constructor (safer than eval)
      // This creates a function that returns the result of the expression
      const func = new Function(`return (${expression})`);
      const result = func();

      // Validate result is a number
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Result is not a valid number');
      }

      // Round to 10 decimal places to avoid floating point issues
      return Math.round(result * 10000000000) / 10000000000;
    } catch (error) {
      throw new Error(`Evaluation error: ${error.message}`);
    }
  }

  // Helper functions that can be used in expressions
  static getMathFunctions() {
    return {
      sqrt: Math.sqrt,
      pow: Math.pow,
      abs: Math.abs,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log,
      exp: Math.exp,
      min: Math.min,
      max: Math.max,
    };
  }
}
