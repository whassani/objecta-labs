import axios from 'axios';
import { Injectable } from '@nestjs/common';
import {
  LLMProvider,
  ChatParams,
  ChatResponse,
  ChatChunk,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OllamaProvider implements LLMProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: params.model,
          messages: params.messages,
          options: {
            temperature: params.temperature || 0.7,
            num_predict: params.maxTokens,
          },
          stream: false,
        },
        {
          timeout: 120000, // 2 minutes timeout for first request (model loading)
        },
      );

      return {
        text: response.data.message.content,
        model: params.model,
        finishReason: response.data.done ? 'stop' : 'length',
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens:
            (response.data.prompt_eval_count || 0) +
            (response.data.eval_count || 0),
        },
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running with 'ollama serve'`,
        );
      }
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async *streamChat(params: ChatParams): AsyncIterator<ChatChunk> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: params.model,
          messages: params.messages,
          options: {
            temperature: params.temperature || 0.7,
            num_predict: params.maxTokens,
          },
          stream: true,
        },
        {
          responseType: 'stream',
          timeout: 120000,
        },
      );

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield {
                text: data.message.content,
                done: data.done || false,
              };
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running with 'ollama serve'`,
        );
      }
      throw new Error(`Ollama streaming error: ${error.message}`);
    }
  }
}
