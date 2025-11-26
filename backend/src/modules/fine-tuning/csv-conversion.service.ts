import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LLMService } from '../agents/llm.service';

export enum ConversionMode {
  GUIDED = 'guided',
  SMART = 'smart',
}

export enum ConversionTemplateType {
  QA = 'qa',
  INFO_EXTRACTION = 'info_extraction',
  CLASSIFICATION = 'classification',
  CUSTOM = 'custom',
}

export interface ColumnAnalysis {
  name: string;
  type: 'categorical' | 'numerical' | 'text' | 'date' | 'boolean' | 'unknown';
  uniqueValues: number;
  samples: string[];
  isKey: boolean;
  isPotentialTarget: boolean;
}

export interface CsvAnalysis {
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  suggestedKeyColumn?: string;
  suggestedTargetColumn?: string;
  suggestedTemplate?: ConversionTemplateType;
  dataPreview: string[][];
}

export interface GuidedConversionOptions {
  template: ConversionTemplateType;
  keyColumn?: string;
  targetColumn?: string;
  columnsToInclude?: string[];
  systemMessage?: string;
  multiTurn?: boolean;
  customUserPrompt?: string;
  customAssistantResponse?: string;
}

export interface SmartConversionOptions {
  aiProvider?: 'openai' | 'ollama';
  multiTurn?: boolean;
  maxExamplesPerRow?: number;
}

export interface ConversionTemplateInfo {
  name: string;
  description: string;
  userPromptPattern: string;
  assistantPattern: string;
  systemMessage: string;
  example?: string;
}

export interface ConversionResult {
  outputPath: string;
  totalExamples: number;
  format: 'jsonl';
  preview: any[];
}

@Injectable()
export class CsvConversionService {
  private readonly logger = new Logger(CsvConversionService.name);
  private templates: Map<string, ConversionTemplateInfo>;

  constructor(private readonly llmService: LLMService) {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates = new Map();

    // Q&A Template
    this.templates.set(ConversionTemplateType.QA, {
      name: 'Q&A Format',
      description: 'Simple question-answer pairs for knowledge retrieval',
      userPromptPattern: 'What is {{key_column}}?',
      assistantPattern: '{{key_column}} is {{first_value}}. {{additional_info}}',
      systemMessage: 'You are a helpful assistant that provides accurate information.',
      example: 'User: What is Product A? → Assistant: Product A is a software tool. It costs $99 and belongs to the Tech category.',
    });

    // Information Extraction Template
    this.templates.set(ConversionTemplateType.INFO_EXTRACTION, {
      name: 'Information Extraction',
      description: 'Extract and present structured information clearly',
      userPromptPattern: 'Extract information about {{key_column}}',
      assistantPattern: 'Here is the information about {{key_column}}:\n{{formatted_list}}',
      systemMessage: 'You are an information extraction assistant that presents data clearly and concisely.',
      example: 'User: Extract information about John → Assistant: Here is the information:\n- Name: John Doe\n- Age: 30\n- Role: Engineer',
    });

    // Classification Template
    this.templates.set(ConversionTemplateType.CLASSIFICATION, {
      name: 'Classification',
      description: 'Classify data based on features',
      userPromptPattern: 'Classify this: {{data_summary}}',
      assistantPattern: 'Classification: {{target_column}}',
      systemMessage: 'You are a classification assistant that categorizes data accurately.',
      example: 'User: Classify this: Product with price $150 in electronics → Assistant: Classification: Premium Electronics',
    });
  }

  /**
   * Analyze CSV file structure and provide insights
   */
  async analyzeCsv(filePath: string): Promise<CsvAnalysis> {
    try {
      this.logger.log(`Analyzing CSV file: ${filePath}`);

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new BadRequestException('CSV file must have at least a header and one data row');
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(line => this.parseCSVLine(line));

      // Analyze each column
      const columns: ColumnAnalysis[] = headers.map((header, index) => {
        const values = dataRows.map(row => row[index]).filter(v => v);
        return this.analyzeColumn(header, values);
      });

      // Suggest key column (likely ID or name field)
      const suggestedKeyColumn = this.suggestKeyColumn(columns);

      // Suggest target column (likely categorical with moderate cardinality)
      const suggestedTargetColumn = this.suggestTargetColumn(columns);

      // Suggest template based on data structure
      const suggestedTemplate = this.suggestTemplate(columns);

      return {
        totalRows: dataRows.length,
        totalColumns: headers.length,
        columns,
        suggestedKeyColumn,
        suggestedTargetColumn,
        suggestedTemplate,
        dataPreview: [headers, ...dataRows.slice(0, 5)],
      };
    } catch (error) {
      this.logger.error(`Failed to analyze CSV: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to analyze CSV: ${error.message}`);
    }
  }

  /**
   * Guided Conversion: Template-based with user configuration
   */
  async convertWithGuided(
    filePath: string,
    options: GuidedConversionOptions,
  ): Promise<ConversionResult> {
    try {
      this.logger.log(`Starting Guided Conversion with template: ${options.template}`);

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const headers = this.parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(line => this.parseCSVLine(line));

      const template = this.templates.get(options.template);
      if (!template && options.template !== ConversionTemplateType.CUSTOM) {
        throw new BadRequestException(`Unknown template: ${options.template}`);
      }

      const examples: any[] = [];

      for (const row of dataRows) {
        const rowData = this.createRowObject(headers, row);

        if (options.multiTurn) {
          // Generate multiple Q&As per row
          const multiTurnExamples = this.generateMultiTurnExamples(
            rowData,
            options,
            template,
          );
          examples.push(...multiTurnExamples);
        } else {
          // Generate single Q&A per row
          const example = this.generateSingleExample(rowData, options, template);
          examples.push(example);
        }
      }

      // Write to JSONL
      const outputPath = filePath.replace('.csv', '_converted.jsonl');
      const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
      fs.writeFileSync(outputPath, jsonlContent);

      this.logger.log(`Guided Conversion complete: ${examples.length} examples generated`);

      return {
        outputPath,
        totalExamples: examples.length,
        format: 'jsonl',
        preview: examples.slice(0, 5),
      };
    } catch (error) {
      this.logger.error(`Guided conversion failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Guided conversion failed: ${error.message}`);
    }
  }

  /**
   * Smart Conversion: AI-powered analysis and generation
   */
  async convertWithSmart(
    filePath: string,
    options: SmartConversionOptions,
  ): Promise<ConversionResult> {
    try {
      this.logger.log('Starting Smart Conversion with AI analysis');

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const headers = this.parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(line => this.parseCSVLine(line));

      // Step 1: Analyze CSV structure with AI
      const analysis = await this.aiAnalyzeCsvStructure(headers, dataRows.slice(0, 5));

      this.logger.log(`AI Analysis: ${JSON.stringify(analysis)}`);

      // Step 2: Generate training examples using AI
      const examples: any[] = [];
      const maxExamplesPerRow = options.maxExamplesPerRow || 3;

      for (const row of dataRows) {
        const rowData = this.createRowObject(headers, row);
        const aiExamples = await this.aiGenerateExamples(
          rowData,
          analysis,
          maxExamplesPerRow,
        );
        examples.push(...aiExamples);
      }

      // Write to JSONL
      const outputPath = filePath.replace('.csv', '_smart_converted.jsonl');
      const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
      fs.writeFileSync(outputPath, jsonlContent);

      this.logger.log(`Smart Conversion complete: ${examples.length} examples generated`);

      return {
        outputPath,
        totalExamples: examples.length,
        format: 'jsonl',
        preview: examples.slice(0, 5),
      };
    } catch (error) {
      this.logger.error(`Smart conversion failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Smart conversion failed: ${error.message}`);
    }
  }

  /**
   * Generate preview without saving
   */
  async generatePreview(
    filePath: string,
    mode: ConversionMode,
    options: GuidedConversionOptions | SmartConversionOptions,
  ): Promise<any[]> {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    const dataRows = lines.slice(1, 6).map(line => this.parseCSVLine(line)); // First 5 rows

    if (mode === ConversionMode.GUIDED) {
      const guidedOptions = options as GuidedConversionOptions;
      const template = this.templates.get(guidedOptions.template);
      const examples: any[] = [];

      for (const row of dataRows) {
        const rowData = this.createRowObject(headers, row);
        const example = this.generateSingleExample(rowData, guidedOptions, template);
        examples.push(example);
      }

      return examples;
    } else {
      // Smart mode preview
      const analysis = await this.aiAnalyzeCsvStructure(headers, dataRows);
      const examples: any[] = [];

      for (const row of dataRows) {
        const rowData = this.createRowObject(headers, row);
        const aiExamples = await this.aiGenerateExamples(rowData, analysis, 2);
        examples.push(...aiExamples.slice(0, 1)); // One example per row for preview
      }

      return examples;
    }
  }

  // ==================== Helper Methods ====================

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private createRowObject(headers: string[], row: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  }

  private analyzeColumn(name: string, values: string[]): ColumnAnalysis {
    const uniqueValues = new Set(values).size;
    const samples = [...new Set(values)].slice(0, 5);

    // Detect type
    let type: ColumnAnalysis['type'] = 'unknown';

    // Check if numerical
    if (values.every(v => !isNaN(Number(v)))) {
      type = 'numerical';
    }
    // Check if boolean
    else if (values.every(v => ['true', 'false', '0', '1', 'yes', 'no'].includes(v.toLowerCase()))) {
      type = 'boolean';
    }
    // Check if date
    else if (values.some(v => !isNaN(Date.parse(v)))) {
      type = 'date';
    }
    // Check if categorical (low cardinality)
    else if (uniqueValues < values.length * 0.5 && uniqueValues < 20) {
      type = 'categorical';
    }
    // Otherwise text
    else {
      type = 'text';
    }

    // Check if likely key column
    const isKey = uniqueValues === values.length || name.toLowerCase().includes('id') || name.toLowerCase().includes('name');

    // Check if potential target (categorical with moderate cardinality)
    const isPotentialTarget = type === 'categorical' && uniqueValues >= 2 && uniqueValues <= 10;

    return {
      name,
      type,
      uniqueValues,
      samples,
      isKey,
      isPotentialTarget,
    };
  }

  private suggestKeyColumn(columns: ColumnAnalysis[]): string | undefined {
    const keyCandidate = columns.find(col => col.isKey);
    return keyCandidate?.name || columns[0]?.name;
  }

  private suggestTargetColumn(columns: ColumnAnalysis[]): string | undefined {
    const targetCandidate = columns.find(col => col.isPotentialTarget);
    return targetCandidate?.name;
  }

  private suggestTemplate(columns: ColumnAnalysis[]): ConversionTemplateType {
    const hasTarget = columns.some(col => col.isPotentialTarget);
    const hasText = columns.some(col => col.type === 'text');

    if (hasTarget) {
      return ConversionTemplateType.CLASSIFICATION;
    } else if (hasText) {
      return ConversionTemplateType.INFO_EXTRACTION;
    } else {
      return ConversionTemplateType.QA;
    }
  }

  private generateSingleExample(
    rowData: Record<string, string>,
    options: GuidedConversionOptions,
    template: ConversionTemplateInfo | undefined,
  ): any {
    let userPrompt: string;
    let assistantResponse: string;
    const systemMessage = options.systemMessage || template?.systemMessage || 'You are a helpful assistant.';

    if (options.template === ConversionTemplateType.CUSTOM) {
      userPrompt = this.replacePlaceholders(options.customUserPrompt || '', rowData);
      assistantResponse = this.replacePlaceholders(options.customAssistantResponse || '', rowData);
    } else if (template) {
      userPrompt = this.replacePlaceholders(template.userPromptPattern, rowData, options);
      assistantResponse = this.replacePlaceholders(template.assistantPattern, rowData, options);
    } else {
      throw new BadRequestException('No template or custom prompts provided');
    }

    return {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: assistantResponse },
      ],
    };
  }

  private generateMultiTurnExamples(
    rowData: Record<string, string>,
    options: GuidedConversionOptions,
    template: ConversionTemplateInfo | undefined,
  ): any[] {
    const examples: any[] = [];
    const keyColumn = options.keyColumn || Object.keys(rowData)[0];
    const keyValue = rowData[keyColumn];
    const systemMessage = options.systemMessage || template?.systemMessage || 'You are a helpful assistant.';

    // Example 1: Ask about specific column
    examples.push({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `What is ${keyColumn} ${keyValue}?` },
        { role: 'assistant', content: this.formatRowAsResponse(rowData, keyColumn) },
      ],
    });

    // Example 2: Ask about specific attribute
    const otherColumns = Object.keys(rowData).filter(col => col !== keyColumn);
    if (otherColumns.length > 0) {
      const targetCol = otherColumns[0];
      examples.push({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `What is the ${targetCol} of ${keyValue}?` },
          { role: 'assistant', content: `The ${targetCol} is ${rowData[targetCol]}.` },
        ],
      });
    }

    // Example 3: Full information request
    if (otherColumns.length > 1) {
      examples.push({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: `Tell me everything about ${keyValue}` },
          { role: 'assistant', content: this.formatRowAsDetailedResponse(rowData) },
        ],
      });
    }

    return examples;
  }

  private replacePlaceholders(
    pattern: string,
    rowData: Record<string, string>,
    options?: GuidedConversionOptions,
  ): string {
    let result = pattern;

    // Replace {{column_name}} with actual values
    Object.keys(rowData).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), rowData[key]);
    });

    // Replace special placeholders
    const keyColumn = options?.keyColumn || Object.keys(rowData)[0];
    result = result.replace(/{{key_column}}/g, rowData[keyColumn]);
    result = result.replace(/{{first_value}}/g, Object.values(rowData)[1] || '');

    // Replace {{additional_info}}
    const otherInfo = Object.entries(rowData)
      .slice(1)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    result = result.replace(/{{additional_info}}/g, otherInfo);

    // Replace {{formatted_list}}
    const formattedList = Object.entries(rowData)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
    result = result.replace(/{{formatted_list}}/g, formattedList);

    // Replace {{data_summary}}
    const dataSummary = Object.entries(rowData)
      .map(([key, value]) => `${key} is ${value}`)
      .join(', ');
    result = result.replace(/{{data_summary}}/g, dataSummary);

    // Replace {{target_column}}
    if (options?.targetColumn) {
      result = result.replace(/{{target_column}}/g, rowData[options.targetColumn]);
    }

    return result;
  }

  private formatRowAsResponse(rowData: Record<string, string>, keyColumn: string): string {
    const entries = Object.entries(rowData).filter(([key]) => key !== keyColumn);
    return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
  }

  private formatRowAsDetailedResponse(rowData: Record<string, string>): string {
    return Object.entries(rowData)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
  }

  // ==================== AI-Powered Methods ====================

  private async aiAnalyzeCsvStructure(
    headers: string[],
    sampleRows: string[][],
  ): Promise<any> {
    const prompt = `Analyze this CSV data and provide insights for generating training examples:

Headers: ${headers.join(', ')}

Sample rows:
${sampleRows.map(row => row.join(' | ')).join('\n')}

Provide:
1. What type of data is this? (e.g., products, people, transactions)
2. What's the primary identifier column?
3. What types of questions would users ask about this data?
4. Suggest 3-4 question patterns for training examples

Respond in JSON format:
{
  "dataType": "...",
  "keyColumn": "...",
  "questionPatterns": ["...", "...", "..."],
  "systemMessage": "..."
}`;

    // Use LLM service to generate response
    // Note: This is a placeholder - actual implementation depends on LLMService interface
    const response = prompt; // TODO: Call actual LLM service when available

    try {
      return JSON.parse(response);
    } catch (e) {
      this.logger.warn('Failed to parse AI analysis, using defaults');
      return {
        dataType: 'general data',
        keyColumn: headers[0],
        questionPatterns: [
          `What is {{${headers[0]}}}?`,
          `Tell me about {{${headers[0]}}}`,
          `Describe {{${headers[0]}}}`,
        ],
        systemMessage: 'You are a helpful assistant.',
      };
    }
  }

  private async aiGenerateExamples(
    rowData: Record<string, string>,
    analysis: any,
    maxExamples: number,
  ): Promise<any[]> {
    const prompt = `Generate ${maxExamples} diverse training examples for this data:

Data: ${JSON.stringify(rowData, null, 2)}

Context: ${analysis.dataType}
Question patterns: ${analysis.questionPatterns.join(', ')}

Generate ${maxExamples} different question-answer pairs that would be useful for fine-tuning.
Vary the question types (specific details, comparisons, summaries, etc.)

Respond in JSON format:
[
  {
    "user": "...",
    "assistant": "..."
  }
]`;

    // Use LLM service to generate response
    // Note: This is a placeholder - actual implementation depends on LLMService interface
    const response = '[]'; // TODO: Call actual LLM service when available

    try {
      const pairs = JSON.parse(response);
      return pairs.map((pair: any) => ({
        messages: [
          { role: 'system', content: analysis.systemMessage },
          { role: 'user', content: pair.user },
          { role: 'assistant', content: pair.assistant },
        ],
      }));
    } catch (e) {
      this.logger.warn('Failed to parse AI examples, generating fallback');
      // Fallback to simple example
      return [
        {
          messages: [
            { role: 'system', content: analysis.systemMessage },
            { role: 'user', content: `Tell me about ${Object.values(rowData)[0]}` },
            { role: 'assistant', content: this.formatRowAsDetailedResponse(rowData) },
          ],
        },
      ];
    }
  }

  /**
   * Get available templates
   */
  getTemplates(): ConversionTemplateInfo[] {
    return Array.from(this.templates.values());
  }
}
