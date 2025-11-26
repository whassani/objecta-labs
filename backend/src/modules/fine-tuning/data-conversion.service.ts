import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LLMService } from '../agents/llm.service';
import { DataConversionGateway } from './data-conversion.gateway';
import { IDataParser, ParsedDataResult } from './parsers/data-parser.interface';
import { CsvParser } from './parsers/csv.parser';
import { JsonParser } from './parsers/json.parser';
import { JsonlParser } from './parsers/jsonl.parser';

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

export interface DataAnalysis {
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  suggestedKeyColumn?: string;
  suggestedTargetColumn?: string;
  suggestedTemplate?: ConversionTemplateType;
  dataPreview: any[];
  detectedFormat: string;
  wasNested: boolean;
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
  aiModel?: string;
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
export class DataConversionService {
  private readonly logger = new Logger(DataConversionService.name);
  private templates: Map<string, ConversionTemplateInfo>;
  private parsers: IDataParser[];

  constructor(
    private readonly llmService: LLMService,
    private readonly gateway: DataConversionGateway,
  ) {
    this.initializeTemplates();
    this.initializeParsers();
  }

  private initializeParsers() {
    // Register parsers in priority order (highest first)
    this.parsers = [
      new JsonlParser(),
      new JsonParser(),
      new CsvParser(),
    ].sort((a, b) => b.getPriority() - a.getPriority());
    
    this.logger.log(`Registered ${this.parsers.length} data parsers`);
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
   * Auto-detect format and parse data
   */
  private async parseData(filePath: string): Promise<ParsedDataResult> {
    const content = fs.readFileSync(filePath);
    
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        this.logger.log(`Detected format: ${parser.getFormatName()}`);
        return await parser.parse(content);
      }
    }
    
    throw new BadRequestException(
      'Unsupported data format. Supported formats: CSV, JSON, JSONL'
    );
  }

  /**
   * Analyze data file structure and provide insights
   * Works with CSV, JSON, and JSONL formats
   */
  async analyzeData(filePath: string): Promise<DataAnalysis> {
    try {
      this.logger.log(`Analyzing data file: ${filePath}`);

      // Parse data (auto-detects format)
      const parsed = await this.parseData(filePath);

      // Analyze each column
      const columns: ColumnAnalysis[] = parsed.columns.map(colName => {
        const values = parsed.rows
          .map(row => String(row[colName] ?? ''))
          .filter(v => v);
        return this.analyzeColumn(colName, values);
      });

      // Suggest key column
      const suggestedKeyColumn = this.suggestKeyColumn(columns);

      // Suggest target column
      const suggestedTargetColumn = this.suggestTargetColumn(columns);

      // Suggest template based on data structure
      const suggestedTemplate = this.suggestTemplate(columns);

      return {
        totalRows: parsed.rows.length,
        totalColumns: parsed.columns.length,
        columns,
        suggestedKeyColumn,
        suggestedTargetColumn,
        suggestedTemplate,
        dataPreview: parsed.rows.slice(0, 5),
        detectedFormat: parsed.originalFormat,
        wasNested: parsed.format === 'nested',
      };
    } catch (error) {
      this.logger.error(`Failed to analyze data: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to analyze data: ${error.message}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use analyzeData() instead
   */
  async analyzeCsv(filePath: string): Promise<DataAnalysis> {
    return this.analyzeData(filePath);
  }

  /**
   * Guided Conversion: Template-based with user configuration
   * Works with CSV, JSON, and JSONL formats
   */
  async convertWithGuided(
    filePath: string,
    options: GuidedConversionOptions,
  ): Promise<ConversionResult> {
    try {
      this.logger.log(`Starting Guided Conversion with template: ${options.template}`);

      // Parse data (auto-detects format)
      const parsed = await this.parseData(filePath);

      const template = this.templates.get(options.template);
      if (!template && options.template !== ConversionTemplateType.CUSTOM) {
        throw new BadRequestException(`Unknown template: ${options.template}`);
      }

      const examples: any[] = [];

      for (const row of parsed.rows) {
        if (options.multiTurn) {
          // Generate multiple Q&As per row
          const multiTurnExamples = this.generateMultiTurnExamples(
            row,
            options,
            template,
          );
          examples.push(...multiTurnExamples);
        } else {
          // Generate single Q&A per row
          const example = this.generateSingleExample(row, options, template);
          examples.push(example);
        }
      }

      // Write to JSONL
      const outputPath = filePath.replace(/\.(csv|json|jsonl)$/i, '_converted.jsonl');
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
   * Works with CSV, JSON, and JSONL formats
   */
  async convertWithSmart(
    filePath: string,
    options: SmartConversionOptions,
    jobId?: string,
  ): Promise<ConversionResult> {
    try {
      this.logger.log(`Starting Smart Conversion with AI analysis (Job: ${jobId})`);

      // Parse data (auto-detects format)
      const parsed = await this.parseData(filePath);
      const totalRows = parsed.rows.length;

      // Send initial progress
      if (jobId) {
        this.gateway.sendProgress({
          jobId,
          status: 'analyzing',
          currentRow: 0,
          totalRows,
          percentage: 0,
          message: 'Analyzing data structure with AI...',
        });
      }

      // Step 1: Analyze data structure with AI
      const analysis = await this.aiAnalyzeDataStructure(
        parsed.columns,
        parsed.rows.slice(0, 5),
        options.aiModel,
      );

      this.logger.log(`AI Analysis: ${JSON.stringify(analysis)}`);

      // Send progress after analysis
      if (jobId) {
        this.gateway.sendProgress({
          jobId,
          status: 'converting',
          currentRow: 0,
          totalRows,
          percentage: 5,
          message: 'Starting conversion of rows...',
        });
      }

      // Step 2: Generate training examples using AI with progress updates
      const examples: any[] = [];
      const maxExamplesPerRow = options.maxExamplesPerRow || 3;

      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i];
        
        try {
          const aiExamples = await this.aiGenerateExamples(
            row,
            analysis,
            maxExamplesPerRow,
            options.aiModel,
          );
          examples.push(...aiExamples);

          // Send progress update every row
          if (jobId) {
            const currentRow = i + 1;
            const percentage = Math.round((currentRow / totalRows) * 90) + 5; // 5-95%
            
            this.gateway.sendProgress({
              jobId,
              status: 'converting',
              currentRow,
              totalRows,
              percentage,
              message: `Processing row ${currentRow} of ${totalRows}... (${examples.length} examples generated)`,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to generate examples for row ${i + 1}: ${error.message}`);
          // Continue with next row
        }
      }

      // Step 3: Write to JSONL
      if (jobId) {
        this.gateway.sendProgress({
          jobId,
          status: 'converting',
          currentRow: totalRows,
          totalRows,
          percentage: 95,
          message: 'Writing converted data to file...',
        });
      }

      const outputPath = filePath.replace(/\.(csv|json|jsonl)$/i, '_smart_converted.jsonl');
      const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
      fs.writeFileSync(outputPath, jsonlContent);

      this.logger.log(`Smart Conversion complete: ${examples.length} examples generated`);

      // Send completion
      if (jobId) {
        this.gateway.sendProgress({
          jobId,
          status: 'completed',
          currentRow: totalRows,
          totalRows,
          percentage: 100,
          message: `Conversion completed! Generated ${examples.length} training examples.`,
        });
      }

      return {
        outputPath,
        totalExamples: examples.length,
        format: 'jsonl',
        preview: examples.slice(0, 5),
      };
    } catch (error) {
      this.logger.error(`Smart conversion failed: ${error.message}`, error.stack);
      
      if (jobId) {
        this.gateway.sendError(jobId, error.message);
      }
      
      throw new BadRequestException(`Smart conversion failed: ${error.message}`);
    }
  }

  /**
   * Generate preview without saving
   * Works with CSV, JSON, and JSONL formats
   */
  async generatePreview(
    filePath: string,
    mode: ConversionMode,
    options: GuidedConversionOptions | SmartConversionOptions,
  ): Promise<any[]> {
    try {
      this.logger.log(`Generating preview in ${mode} mode for ${filePath}`);
      
      // Parse data (auto-detects format)
      const parsed = await this.parseData(filePath);
      this.logger.log(`Parsed ${parsed.rows.length} rows for preview`);
      
      const previewRows = parsed.rows.slice(0, 5); // First 5 rows

      if (mode === ConversionMode.GUIDED) {
        const guidedOptions = options as GuidedConversionOptions;
        const template = this.templates.get(guidedOptions.template);
        const examples: any[] = [];

        for (const row of previewRows) {
          const example = this.generateSingleExample(row, guidedOptions, template);
          examples.push(example);
        }

        this.logger.log(`Generated ${examples.length} preview examples in GUIDED mode`);
        return examples;
      } else {
        // Smart mode preview
        const smartOptions = options as SmartConversionOptions;
        this.logger.log(`Starting AI analysis for smart preview with model: ${smartOptions.aiModel || 'default'}`);
        const analysis = await this.aiAnalyzeDataStructure(parsed.columns, previewRows, smartOptions.aiModel);
        this.logger.log(`AI Analysis complete: ${JSON.stringify(analysis)}`);
        
        const examples: any[] = [];

        for (let i = 0; i < previewRows.length; i++) {
          const row = previewRows[i];
          this.logger.log(`Generating AI examples for preview row ${i + 1}/${previewRows.length}`);
          
          try {
            const aiExamples = await this.aiGenerateExamples(row, analysis, 2, smartOptions.aiModel);
            if (aiExamples && aiExamples.length > 0) {
              examples.push(...aiExamples.slice(0, 1)); // One example per row for preview
              this.logger.log(`Added ${aiExamples.length} examples for row ${i + 1}`);
            } else {
              this.logger.warn(`No examples generated for preview row ${i + 1}`);
            }
          } catch (error) {
            this.logger.error(`Failed to generate examples for preview row ${i + 1}: ${error.message}`);
            // Continue with other rows even if one fails
          }
        }

        this.logger.log(`Generated ${examples.length} preview examples in SMART mode`);
        return examples;
      }
    } catch (error) {
      this.logger.error(`Failed to generate preview: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to generate preview: ${error.message}`);
    }
  }

  // ==================== Helper Methods ====================

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
    rowData: Record<string, string | number | boolean>,
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
    rowData: Record<string, string | number | boolean>,
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
    rowData: Record<string, string | number | boolean>,
    options?: GuidedConversionOptions,
  ): string {
    let result = pattern;

    // Replace {{column_name}} with actual values
    Object.keys(rowData).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(rowData[key]));
    });

    // Replace special placeholders
    const keyColumn = options?.keyColumn || Object.keys(rowData)[0];
    result = result.replace(/{{key_column}}/g, String(rowData[keyColumn]));
    result = result.replace(/{{first_value}}/g, String(Object.values(rowData)[1] || ''));

    // Replace {{additional_info}}
    const otherInfo = Object.entries(rowData)
      .slice(1)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');
    result = result.replace(/{{additional_info}}/g, otherInfo);

    // Replace {{formatted_list}}
    const formattedList = Object.entries(rowData)
      .map(([key, value]) => `- ${key}: ${String(value)}`)
      .join('\n');
    result = result.replace(/{{formatted_list}}/g, formattedList);

    // Replace {{data_summary}}
    const dataSummary = Object.entries(rowData)
      .map(([key, value]) => `${key} is ${String(value)}`)
      .join(', ');
    result = result.replace(/{{data_summary}}/g, dataSummary);

    // Replace {{target_column}}
    if (options?.targetColumn) {
      result = result.replace(/{{target_column}}/g, String(rowData[options.targetColumn]));
    }

    return result;
  }

  private formatRowAsResponse(rowData: Record<string, string | number | boolean>, keyColumn: string): string {
    const entries = Object.entries(rowData).filter(([key]) => key !== keyColumn);
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
  }

  private formatRowAsDetailedResponse(rowData: Record<string, string | number | boolean>): string {
    return Object.entries(rowData)
      .map(([key, value]) => `- ${key}: ${String(value)}`)
      .join('\n');
  }

  // ==================== AI-Powered Methods ====================

  private async aiAnalyzeDataStructure(
    columns: string[],
    sampleRows: any[],
    model?: string,
  ): Promise<any> {
    const prompt = `Analyze this data and provide insights for generating training examples:

Columns: ${columns.join(', ')}

Sample rows:
${sampleRows.map(row => 
  columns.map(col => `${col}: ${row[col]}`).join(' | ')
).join('\n')}

Provide:
1. What type of data is this? (e.g., products, people, transactions)
2. What's the primary identifier column?
3. What types of questions would users ask about this data?
4. Suggest 3-4 question patterns for training examples

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "dataType": "description of data type",
  "keyColumn": "column name",
  "questionPatterns": ["pattern1", "pattern2", "pattern3"],
  "systemMessage": "system message for assistant"
}`;

    try {
      // Call LLM service
      const llmResponse = await this.llmService.chat({
        model: model || process.env.DEFAULT_MODEL || 'llama3.2',
        messages: [
          { role: 'system', content: 'You are a data analysis assistant that responds only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more structured output
      });

      const responseText = llmResponse.text.trim();
      
      // Try to extract JSON if wrapped in markdown
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else if (responseText.includes('{') && responseText.includes('}')) {
        // Extract JSON object
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}') + 1;
        jsonText = responseText.substring(start, end);
      }

      return JSON.parse(jsonText);
    } catch (e) {
      this.logger.warn(`Failed to get AI analysis: ${e.message}, using defaults`);
      return {
        dataType: 'general data',
        keyColumn: columns[0],
        questionPatterns: [
          `What is {{${columns[0]}}}?`,
          `Tell me about {{${columns[0]}}}`,
          `Describe {{${columns[0]}}}`,
        ],
        systemMessage: 'You are a helpful assistant that provides accurate information.',
      };
    }
  }

  private async aiGenerateExamples(
    rowData: Record<string, string | number | boolean>,
    analysis: any,
    maxExamples: number,
    model?: string,
  ): Promise<any[]> {
    const prompt = `Generate ${maxExamples} diverse training examples for this data:

Data: ${JSON.stringify(rowData, null, 2)}

Context: ${analysis.dataType}
Question patterns to inspire variety: ${analysis.questionPatterns.join(', ')}

Generate ${maxExamples} different question-answer pairs that would be useful for fine-tuning.
Vary the question types (specific details, comparisons, summaries, listing attributes, etc.)

Respond ONLY with valid JSON array in this exact format (no markdown, no extra text):
[
  {
    "user": "question text",
    "assistant": "answer text"
  }
]`;

    try {
      // Call LLM service
      const llmResponse = await this.llmService.chat({
        model: model || process.env.DEFAULT_MODEL || 'llama3.2',
        messages: [
          { role: 'system', content: 'You are a training data generator that responds only with valid JSON arrays.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7, // Higher temperature for more variety
      });

      const responseText = llmResponse.text.trim();
      
      // Try to extract JSON if wrapped in markdown
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else if (responseText.includes('[') && responseText.includes(']')) {
        // Extract JSON array
        const start = responseText.indexOf('[');
        const end = responseText.lastIndexOf(']') + 1;
        jsonText = responseText.substring(start, end);
      }

      const pairs = JSON.parse(jsonText);
      
      if (!Array.isArray(pairs) || pairs.length === 0) {
        throw new Error('Invalid response format or empty array');
      }

      return pairs.map((pair: any) => ({
        messages: [
          { role: 'system', content: analysis.systemMessage },
          { role: 'user', content: pair.user },
          { role: 'assistant', content: pair.assistant },
        ],
      }));
    } catch (e) {
      this.logger.warn(`Failed to generate AI examples: ${e.message}, using fallback`);
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
