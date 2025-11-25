import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';
import { AgentsService } from '../../agents/agents.service';

@Injectable()
export class AgentNodeExecutor extends BaseNodeExecutor {
  constructor(private agentsService: AgentsService) {
    super();
  }

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { agentId, prompt, agentName } = node.data;

      if (!agentId && !agentName) {
        return {
          success: false,
          error: 'Agent not configured. Please select an agent in the node editor.',
        };
      }

      // Get prompt from node data or interpolate from context
      const finalPrompt = prompt 
        ? this.interpolateTemplate(prompt, context)
        : this.getInputValue('prompt', context) || 'Execute agent task';

      // Get organizationId from context (passed through trigger data or variables)
      const organizationId = context.variables?.organizationId || 
                            context.triggerData?.organizationId;

      if (!organizationId) {
        throw new Error('Organization ID is required for agent execution');
      }

      // Fetch agent from database
      const agent = await this.agentsService.findOne(agentId, organizationId);

      // TODO: In a future phase, integrate with actual LLM to get real AI responses
      // For now, return agent configuration and prompt
      // This would be replaced with:
      // const llmResponse = await this.llmService.chat(agent.model, finalPrompt, agent.systemPrompt);

      return {
        success: true,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          prompt: finalPrompt,
          response: `Agent "${agent.name}" received prompt: ${finalPrompt}. [Note: LLM integration pending]`,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          temperature: agent.temperature,
          timestamp: new Date().toISOString(),
          // Future: tokens, actualResponse, etc.
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Agent execution failed: ${error.message}`,
      };
    }
  }
}
