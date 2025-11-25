import { Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';

export interface HttpApiToolConfig {
  url: string;
  method: Method;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: any;
  };
}

export class HttpApiTool {
  private readonly logger = new Logger(HttpApiTool.name);

  async execute(config: HttpApiToolConfig, input: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Executing HTTP API tool: ${config.method} ${config.url}`);

      // Set default headers with a more acceptable User-Agent
      const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; AIAgent/1.0; +https://ai-agent-platform.com)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      };

      const finalHeaders = { ...defaultHeaders, ...(config.headers || {}) };

      const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        headers: finalHeaders,
        timeout: config.timeout || 30000,
      };

      // Add authentication if configured
      if (config.auth) {
        switch (config.auth.type) {
          case 'bearer':
            axiosConfig.headers['Authorization'] = `Bearer ${config.auth.credentials.token}`;
            break;
          case 'basic':
            axiosConfig.auth = {
              username: config.auth.credentials.username,
              password: config.auth.credentials.password,
            };
            break;
          case 'api-key':
            axiosConfig.headers[config.auth.credentials.headerName || 'X-API-Key'] = 
              config.auth.credentials.apiKey;
            break;
        }
      }

      // Add body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())) {
        axiosConfig.data = input;
      } else if (input) {
        // Add query params for GET, DELETE
        axiosConfig.params = input;
      }

      const response = await axios(axiosConfig);
      
      const executionTime = Date.now() - startTime;
      this.logger.log(`HTTP API tool completed in ${executionTime}ms`);

      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        // Phase 2: Include request details for debugging
        _debug: {
          request: {
            method: axiosConfig.method,
            url: axiosConfig.url,
            headers: axiosConfig.headers,
            body: axiosConfig.data,
            params: axiosConfig.params,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          },
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`HTTP API tool failed after ${executionTime}ms:`, error.message);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP request failed: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      
      throw error;
    }
  }
}
