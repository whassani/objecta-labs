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
    const url = `${this.baseUrl}/api/chat`;
    const requestBody = {
      model: params.model,
      messages: params.messages,
      options: {
        temperature: params.temperature || 0.7,
        num_predict: params.maxTokens,
      },
      stream: false,
    };

    console.log('=== OLLAMA REQUEST ===');
    console.log('URL:', url);
    console.log('Model:', params.model);
    console.log('Messages:', JSON.stringify(params.messages, null, 2));
    console.log('Options:', requestBody.options);
    console.log('=====================');

    try {
      const response = await axios.post(url, requestBody, {
        timeout: 120000, // 2 minutes timeout for first request (model loading)
      });

      console.log('=== OLLAMA RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('=======================');

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
      console.log('=== OLLAMA ERROR ===');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Response data:', JSON.stringify(error.response?.data, null, 2));
      console.log('Request URL:', url);
      console.log('====================');

      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running with 'ollama serve'`,
        );
      }
      
      if (error.response?.status === 404) {
        throw new Error(
          `Ollama endpoint not found (404): ${url}. Check if model '${params.model}' exists. Try: ollama pull ${params.model}`,
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
