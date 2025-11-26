import axios from 'axios';
import { Injectable } from '@nestjs/common';
import {
  LLMProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY not set. OpenAI provider will not work.');
    }
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: params.model,
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens,
          stream: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const choice = response.data.choices[0];
      return {
        text: choice.message.content,
        model: response.data.model,
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async *streamChat(params: ChatParams): AsyncIterator<ChatChunk> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: params.model,
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens,
          stream: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 60000,
        },
      );

      for await (const chunk of response.data) {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line) => line.trim().startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') {
            yield { text: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield {
                text: content,
                done: false,
              };
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }
}
