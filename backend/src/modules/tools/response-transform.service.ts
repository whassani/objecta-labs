import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as jp from 'jsonpath';
import { VM } from 'vm2';

export interface ResponseTransformConfig {
  enabled: boolean;
  type: 'jsonpath' | 'javascript';
  expression: string;
}

@Injectable()
export class ResponseTransformService {
  private readonly logger = new Logger(ResponseTransformService.name);

  /**
   * Transform response data based on configuration
   */
  transform(data: any, config: ResponseTransformConfig): any {
    if (!config.enabled || !config.expression) {
      return data;
    }

    try {
      switch (config.type) {
        case 'jsonpath':
          return this.transformWithJSONPath(data, config.expression);
        case 'javascript':
          return this.transformWithJavaScript(data, config.expression);
        default:
          this.logger.warn(`Unknown transform type: ${config.type}`);
          return data;
      }
    } catch (error) {
      this.logger.error(`Transform failed: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Response transformation failed: ${error.message}`,
      );
    }
  }

  /**
   * Transform using JSONPath expression
   */
  private transformWithJSONPath(data: any, expression: string): any {
    try {
      // JSONPath query
      const result = jp.query(data, expression);
      
      // If single result, unwrap array
      if (Array.isArray(result) && result.length === 1) {
        return result[0];
      }
      
      return result;
    } catch (error) {
      throw new Error(`JSONPath error: ${error.message}`);
    }
  }

  /**
   * Transform using JavaScript expression (sandboxed)
   */
  private transformWithJavaScript(data: any, expression: string): any {
    try {
      const vm = new VM({
        timeout: 1000, // 1 second timeout
        sandbox: {
          data,
          console: {
            log: (...args: any[]) => this.logger.debug('VM log:', ...args),
          },
        },
      });

      // The expression should return the transformed data
      const result = vm.run(`
        (function() {
          ${expression}
        })()
      `);

      return result;
    } catch (error) {
      throw new Error(`JavaScript execution error: ${error.message}`);
    }
  }

  /**
   * Validate transformation expression
   */
  validateExpression(type: string, expression: string): boolean {
    try {
      const testData = { test: 'value', nested: { prop: 123 } };
      
      if (type === 'jsonpath') {
        jp.query(testData, expression);
      } else if (type === 'javascript') {
        const vm = new VM({ timeout: 100 });
        vm.run(`(function() { ${expression} })()`);
      }
      
      return true;
    } catch (error) {
      this.logger.warn(`Expression validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get example expressions
   */
  static getExamples(): Record<string, string[]> {
    return {
      jsonpath: [
        '$.data[*]',
        '$.results[?(@.status=="active")]',
        '$.users[0].email',
        '$..price',
      ],
      javascript: [
        'return data.map(item => item.id);',
        'return { count: data.length, items: data };',
        'return data.filter(x => x.value > 10);',
        'return data.reduce((sum, x) => sum + x.amount, 0);',
      ],
    };
  }
}
