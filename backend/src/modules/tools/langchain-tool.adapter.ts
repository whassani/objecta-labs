import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Tool } from './entities/tool.entity';
import { ToolExecutorService } from './tool-executor.service';

/**
 * Adapter to convert our Tool entities to LangChain tools
 */
export class LangChainToolAdapter {
  constructor(private toolExecutorService: ToolExecutorService) {}

  /**
   * Convert a Tool entity to a LangChain DynamicStructuredTool
   */
  async convertToLangChainTool(tool: Tool, organizationId: string): Promise<DynamicStructuredTool> {
    // Parse schema or create a default one
    const schema = this.createZodSchema(tool);

    return new DynamicStructuredTool({
      name: this.sanitizeToolName(tool.name),
      description: tool.description || `Execute ${tool.name} tool`,
      schema: schema,
      func: async (input: any) => {
        try {
          const result = await this.toolExecutorService.executeTool(
            tool.id,
            input,
            organizationId,
          );

          if (!result.success) {
            return `Error executing ${tool.name}: ${result.error}`;
          }

          // Format the result for LLM consumption
          return this.formatResultForLLM(result.result, tool.toolType);
        } catch (error) {
          return `Error: ${error.message}`;
        }
      },
    });
  }

  /**
   * Convert multiple tools to LangChain tools
   */
  async convertMultipleTools(tools: Tool[], organizationId: string): Promise<DynamicStructuredTool[]> {
    const langchainTools: DynamicStructuredTool[] = [];

    for (const tool of tools) {
      try {
        const langchainTool = await this.convertToLangChainTool(tool, organizationId);
        langchainTools.push(langchainTool);
      } catch (error) {
        console.error(`Failed to convert tool ${tool.name}:`, error);
      }
    }

    return langchainTools;
  }

  /**
   * Create a Zod schema from tool configuration
   */
  private createZodSchema(tool: Tool): z.ZodObject<any> {
    // If tool has a custom schema, try to use it
    if (tool.schema && typeof tool.schema === 'object') {
      return this.buildZodSchemaFromConfig(tool.schema);
    }

    // Default schema based on tool type
    switch (tool.toolType) {
      case 'http-api':
      case 'api':
        return z.object({
          params: z.record(z.any()).optional().describe('Query parameters or request body'),
        });

      case 'calculator':
        return z.object({
          expression: z.string().describe('Mathematical expression to evaluate'),
        });

      case 'database':
        return z.object({
          query: z.string().describe('Database query to execute'),
          params: z.record(z.any()).optional().describe('Query parameters'),
        });

      default:
        return z.object({
          input: z.any().describe('Tool input'),
        });
    }
  }

  /**
   * Build Zod schema from configuration object
   */
  private buildZodSchemaFromConfig(config: any): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const [key, value] of Object.entries(config)) {
      const fieldConfig = value as any;

      switch (fieldConfig.type) {
        case 'string':
          schemaFields[key] = fieldConfig.required
            ? z.string().describe(fieldConfig.description || key)
            : z.string().optional().describe(fieldConfig.description || key);
          break;

        case 'number':
          schemaFields[key] = fieldConfig.required
            ? z.number().describe(fieldConfig.description || key)
            : z.number().optional().describe(fieldConfig.description || key);
          break;

        case 'boolean':
          schemaFields[key] = fieldConfig.required
            ? z.boolean().describe(fieldConfig.description || key)
            : z.boolean().optional().describe(fieldConfig.description || key);
          break;

        case 'object':
          schemaFields[key] = fieldConfig.required
            ? z.record(z.any()).describe(fieldConfig.description || key)
            : z.record(z.any()).optional().describe(fieldConfig.description || key);
          break;

        default:
          schemaFields[key] = z.any().optional().describe(fieldConfig.description || key);
      }
    }

    return z.object(schemaFields);
  }

  /**
   * Sanitize tool name for LangChain (no spaces, special chars)
   */
  private sanitizeToolName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Format tool result for LLM consumption
   */
  private formatResultForLLM(result: any, toolType: string): string {
    if (typeof result === 'string') {
      return result;
    }

    switch (toolType) {
      case 'http-api':
      case 'api':
        if (result.data) {
          return JSON.stringify(result.data, null, 2);
        }
        return JSON.stringify(result, null, 2);

      case 'calculator':
        if (result.formatted) {
          return result.formatted;
        }
        return `Result: ${result.result}`;

      default:
        return JSON.stringify(result, null, 2);
    }
  }
}
