import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';
import { AgentsService } from '../../agents/agents.service';
import { LLMService } from '../../agents/llm.service';

@Injectable()
export class AgentNodeExecutor extends BaseNodeExecutor {
  constructor(
    private agentsService: AgentsService,
    private llmService: LLMService,
  ) {
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

      // Get prompt - check previous step outputs first, then trigger data
      let finalPrompt: string;
      
      // Debug logging - SUPER DETAILED
      console.log('=== AGENT EXECUTOR DEBUG ===');
      console.log('context.triggerData:', JSON.stringify(context.triggerData, null, 2));
      console.log('context.stepOutputs:', JSON.stringify(context.stepOutputs, null, 2));
      console.log('node.data.prompt:', prompt);
      
      // Look for prompt/message in previous step outputs (trigger node output)
      let testPrompt: string | null = null;
      
      // Check trigger node output (usually first step)
      const stepOutputKeys = Object.keys(context.stepOutputs);
      console.log('Step output keys:', stepOutputKeys);
      
      if (stepOutputKeys.length > 0) {
        const firstStepKey = stepOutputKeys[0];
        const triggerStep = context.stepOutputs[firstStepKey];
        console.log(`Trigger step [${firstStepKey}]:`, JSON.stringify(triggerStep, null, 2));
        
        if (triggerStep && typeof triggerStep === 'object' && 'data' in triggerStep) {
          const stepData = (triggerStep as any).data;
          console.log('Step data:', JSON.stringify(stepData, null, 2));
          testPrompt = stepData.message || stepData.prompt;
          console.log('testPrompt from step:', testPrompt);
        }
      }
      
      // Fallback to checking context.triggerData directly
      if (!testPrompt) {
        testPrompt = context.triggerData.message || context.triggerData.prompt;
        console.log('testPrompt from triggerData:', testPrompt);
      }
      
      // Decide which prompt to use
      if (testPrompt) {
        finalPrompt = testPrompt;
        console.log('  Using test prompt!');
      } else if (prompt) {
        finalPrompt = this.interpolateTemplate(prompt, context);
        console.log('  Using node config prompt');
      } else {
        finalPrompt = 'Execute agent task';
        console.log('  Using default prompt');
      }
      
      console.log('  FINAL PROMPT:', finalPrompt);

      // Get organizationId from context (passed through trigger data or variables)
      const organizationId = context.variables?.organizationId || 
                            context.triggerData?.organizationId;

      if (!organizationId) {
        throw new Error('Organization ID is required for agent execution');
      }

      // Fetch agent from database
      const agent = await this.agentsService.findOne(agentId, organizationId);

      // Make actual LLM call
      try {
        const llmResponse = await this.llmService.chat({
          model: agent.model,
          messages: [
            { role: 'system', content: agent.systemPrompt || 'You are a helpful AI assistant.' },
            { role: 'user', content: finalPrompt },
          ],
          temperature: agent.temperature || 0.7,
        });

        return {
          success: true,
          data: {
            agentId: agent.id,
            agentName: agent.name,
            prompt: finalPrompt,
            response: llmResponse.text,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
            temperature: agent.temperature,
            timestamp: new Date().toISOString(),
            usage: llmResponse.usage,
            finishReason: llmResponse.finishReason,
          },
        };
      } catch (llmError) {
        // If LLM call fails, return error with details
        return {
          success: false,
          error: `LLM execution failed: ${llmError.message}`,
          data: {
            agentId: agent.id,
            agentName: agent.name,
            prompt: finalPrompt,
            model: agent.model,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Agent execution failed: ${error.message}`,
      };
    }
  }
}
