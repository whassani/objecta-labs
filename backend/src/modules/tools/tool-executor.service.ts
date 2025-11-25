import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from './entities/tool.entity';
import { HttpApiTool } from './built-in/http-api.tool';
import { CalculatorTool } from './built-in/calculator.tool';

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  toolId: string;
  toolName: string;
  timestamp: Date;
}

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);
  private readonly httpApiTool: HttpApiTool;
  private readonly calculatorTool: CalculatorTool;

  constructor(
    @InjectRepository(Tool)
    private toolsRepository: Repository<Tool>,
  ) {
    this.httpApiTool = new HttpApiTool();
    this.calculatorTool = new CalculatorTool();
  }

  /**
   * Execute a tool by ID
   */
  async executeTool(
    toolId: string,
    input: any,
    organizationId: string,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Fetch tool configuration
      const tool = await this.toolsRepository.findOne({
        where: { id: toolId, organizationId },
      });

      if (!tool) {
        throw new NotFoundException(`Tool with ID ${toolId} not found`);
      }

      if (!tool.isEnabled) {
        throw new BadRequestException(`Tool ${tool.name} is disabled`);
      }

      this.logger.log(`Executing tool: ${tool.name} (${tool.toolType})`);

      // Execute based on tool type
      let result: any;
      
      switch (tool.toolType) {
        case 'http-api':
        case 'api':
          result = await this.executeHttpApiTool(tool, input);
          break;
        
        case 'calculator':
          result = await this.executeCalculatorTool(tool, input);
          break;
        
        case 'custom':
          result = await this.executeCustomTool(tool, input);
          break;
        
        default:
          throw new BadRequestException(`Unsupported tool type: ${tool.toolType}`);
      }

      const executionTime = Date.now() - startTime;
      
      this.logger.log(`Tool ${tool.name} executed successfully in ${executionTime}ms`);

      return {
        success: true,
        result,
        executionTime,
        toolId: tool.id,
        toolName: tool.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(
        `Tool execution failed after ${executionTime}ms:`,
        error.message,
        error.stack,
      );

      return {
        success: false,
        error: error.message,
        executionTime,
        toolId,
        toolName: 'unknown',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute HTTP API tool
   */
  private async executeHttpApiTool(tool: Tool, input: any): Promise<any> {
    const config = tool.config;
    
    if (!config.url) {
      throw new BadRequestException('HTTP API tool requires a URL in config');
    }

    return await this.httpApiTool.execute(config, input);
  }

  /**
   * Execute calculator tool
   */
  private async executeCalculatorTool(tool: Tool, input: any): Promise<any> {
    // Input can be an object with expression or just a string
    const expression = typeof input === 'string' ? input : input.expression;
    
    if (!expression) {
      throw new BadRequestException('Calculator tool requires an expression');
    }

    return await this.calculatorTool.execute(expression);
  }

  /**
   * Execute custom tool (placeholder for future implementation)
   */
  private async executeCustomTool(tool: Tool, input: any): Promise<any> {
    // This would execute custom JavaScript code in a sandboxed environment
    // For now, we'll throw an error
    throw new BadRequestException('Custom tools are not yet implemented');
  }

  /**
   * Get all tools for an agent
   */
  async getAgentTools(agentId: string, organizationId: string): Promise<Tool[]> {
    return await this.toolsRepository.find({
      where: {
        agentId,
        organizationId,
        isEnabled: true,
      },
    });
  }

  /**
   * Test a tool without saving execution
   */
  async testTool(
    toolId: string,
    input: any,
    organizationId: string,
  ): Promise<ToolExecutionResult> {
    this.logger.log(`Testing tool ${toolId}`);
    return await this.executeTool(toolId, input, organizationId);
  }
}
