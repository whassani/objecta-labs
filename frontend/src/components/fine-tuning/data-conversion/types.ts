// Types for Data Conversion Wizard

export type ConversionMode = 'guided' | 'smart';
export type ConversionTemplate = 'qa' | 'info_extraction' | 'classification' | 'custom';

export interface ColumnAnalysis {
  name: string;
  type: 'categorical' | 'numerical' | 'text' | 'date' | 'boolean' | 'unknown';
  uniqueValues: number;
  samples: string[];
  isKey: boolean;
  isPotentialTarget: boolean;
}

export interface DataAnalysis {
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  suggestedKeyColumn?: string;
  suggestedTargetColumn?: string;
  suggestedTemplate?: ConversionTemplate;
  dataPreview: any[];
  detectedFormat: string;
  wasNested: boolean;
}

export interface ConversionPreview {
  analysis: DataAnalysis;
  examples: Array<{
    messages: Array<{
      role: string;
      content: string;
    }>;
  }>;
  estimatedTotal: number;
}

export interface ConversionOptions {
  mode: ConversionMode;
  template?: ConversionTemplate;
  keyColumn?: string;
  targetColumn?: string;
  columnsToInclude?: string[];
  systemMessage?: string;
  multiTurn?: boolean;
  customUserPrompt?: string;
  customAssistantResponse?: string;
  aiProvider?: 'openai' | 'ollama';
  aiModel?: string;
  maxExamplesPerRow?: number;
}

export interface TemplateInfo {
  name: string;
  description: string;
  userPromptPattern: string;
  assistantPattern: string;
  systemMessage: string;
  example?: string;
}

export interface SupportedFormat {
  format: string;
  extensions: string[];
  description: string;
  autoDetect: boolean;
}

export type WizardStep = 'upload' | 'analyze' | 'configure' | 'preview' | 'convert' | 'complete';
