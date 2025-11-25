import { Injectable, HttpException } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpNodeExecutor extends BaseNodeExecutor {
  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { url, method = 'GET', headers = {}, body } = node.data;

      if (!url) {
        throw new Error('URL is required for HTTP node');
      }

      // Interpolate URL with context variables
      const interpolatedUrl = this.interpolateTemplate(url, context);

      // Prepare request config
      const config: AxiosRequestConfig = {
        method: method.toUpperCase(),
        url: interpolatedUrl,
        headers: headers || {},
      };

      // Add body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(config.method) && body) {
        config.data = typeof body === 'string' 
          ? JSON.parse(this.interpolateTemplate(body, context))
          : body;
      }

      // Make HTTP request
      const response = await axios(config);

      return {
        success: true,
        data: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: `HTTP request failed: ${error.message}`,
          data: {
            statusCode: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          },
        };
      }

      return {
        success: false,
        error: `HTTP node execution failed: ${error.message}`,
      };
    }
  }
}
