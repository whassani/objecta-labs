// Custom hook for data conversion API calls

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  DataAnalysis,
  ConversionPreview,
  ConversionOptions,
  TemplateInfo,
  SupportedFormat,
} from './types';

export function useDataConversion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeData = async (file: File): Promise<DataAnalysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/fine-tuning/datasets/analyze-data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const previewConversion = async (
    file: File,
    options: ConversionOptions
  ): Promise<ConversionPreview | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', options.mode);
      
      if (options.template) formData.append('template', options.template);
      if (options.keyColumn) formData.append('keyColumn', options.keyColumn);
      if (options.targetColumn) formData.append('targetColumn', options.targetColumn);
      if (options.systemMessage) formData.append('systemMessage', options.systemMessage);
      if (options.multiTurn !== undefined) formData.append('multiTurn', String(options.multiTurn));
      if (options.customUserPrompt) formData.append('customUserPrompt', options.customUserPrompt);
      if (options.customAssistantResponse) formData.append('customAssistantResponse', options.customAssistantResponse);
      if (options.aiProvider) formData.append('aiProvider', options.aiProvider);
      if (options.aiModel) formData.append('aiModel', options.aiModel);
      if (options.maxExamplesPerRow) formData.append('maxExamplesPerRow', String(options.maxExamplesPerRow));

      const response = await api.post('/fine-tuning/datasets/preview-conversion', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to preview conversion');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const convertData = async (
    file: File,
    name: string,
    description: string,
    options: ConversionOptions
  ): Promise<{ jobId?: string; message?: string; estimatedRows?: number; id?: string } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('mode', options.mode);
      
      if (options.template) formData.append('template', options.template);
      if (options.keyColumn) formData.append('keyColumn', options.keyColumn);
      if (options.targetColumn) formData.append('targetColumn', options.targetColumn);
      if (options.columnsToInclude) {
        formData.append('columnsToInclude', JSON.stringify(options.columnsToInclude));
      }
      if (options.systemMessage) formData.append('systemMessage', options.systemMessage);
      if (options.multiTurn !== undefined) formData.append('multiTurn', String(options.multiTurn));
      if (options.customUserPrompt) formData.append('customUserPrompt', options.customUserPrompt);
      if (options.customAssistantResponse) formData.append('customAssistantResponse', options.customAssistantResponse);
      if (options.aiProvider) formData.append('aiProvider', options.aiProvider);
      if (options.aiModel) formData.append('aiModel', options.aiModel);
      if (options.maxExamplesPerRow) formData.append('maxExamplesPerRow', String(options.maxExamplesPerRow));

      const response = await api.post('/fine-tuning/datasets/convert-data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to convert data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTemplates = async (): Promise<TemplateInfo[]> => {
    try {
      const response = await api.get('/fine-tuning/datasets/conversion-templates');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      return [];
    }
  };

  const getSupportedFormats = async (): Promise<{ formats: SupportedFormat[]; notes: string[] }> => {
    try {
      const response = await api.get('/fine-tuning/datasets/supported-formats');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch supported formats:', err);
      return { formats: [], notes: [] };
    }
  };

  return {
    loading,
    error,
    analyzeData,
    previewConversion,
    convertData,
    getTemplates,
    getSupportedFormats,
  };
}
