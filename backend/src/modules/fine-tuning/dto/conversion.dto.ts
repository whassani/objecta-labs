import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber, IsArray } from 'class-validator';

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

export class PreviewConversionDto {
  @ApiProperty({ 
    enum: ConversionMode, 
    description: 'Conversion mode: guided (template-based) or smart (AI-powered)' 
  })
  @IsEnum(ConversionMode)
  mode: ConversionMode;

  @ApiPropertyOptional({ 
    enum: ConversionTemplateType, 
    description: 'Template to use for guided conversion' 
  })
  @IsOptional()
  @IsEnum(ConversionTemplateType)
  template?: ConversionTemplateType;

  @ApiPropertyOptional({ description: 'Key column name (identifier)' })
  @IsOptional()
  @IsString()
  keyColumn?: string;

  @ApiPropertyOptional({ description: 'Target column for classification' })
  @IsOptional()
  @IsString()
  targetColumn?: string;

  @ApiPropertyOptional({ description: 'Columns to include in conversion' })
  @IsOptional()
  @IsArray()
  columnsToInclude?: string[];

  @ApiPropertyOptional({ description: 'System message for conversations' })
  @IsOptional()
  @IsString()
  systemMessage?: string;

  @ApiPropertyOptional({ description: 'Generate multiple Q&As per row' })
  @IsOptional()
  @IsBoolean()
  multiTurn?: boolean;

  @ApiPropertyOptional({ description: 'Custom user prompt pattern (for custom template)' })
  @IsOptional()
  @IsString()
  customUserPrompt?: string;

  @ApiPropertyOptional({ description: 'Custom assistant response pattern (for custom template)' })
  @IsOptional()
  @IsString()
  customAssistantResponse?: string;

  @ApiPropertyOptional({ description: 'AI provider for smart conversion', enum: ['openai', 'ollama'] })
  @IsOptional()
  @IsString()
  aiProvider?: 'openai' | 'ollama';

  @ApiPropertyOptional({ description: 'AI model to use for smart conversion (e.g., llama3.2, gpt-3.5-turbo)' })
  @IsOptional()
  @IsString()
  aiModel?: string;

  @ApiPropertyOptional({ description: 'Max examples per row for smart conversion', default: 3 })
  @IsOptional()
  @IsNumber()
  maxExamplesPerRow?: number;
}

export class ConvertCsvDto extends PreviewConversionDto {
  @ApiProperty({ description: 'Dataset ID to associate with conversion' })
  @IsString()
  datasetId: string;

  @ApiProperty({ description: 'Name for the converted dataset' })
  @IsString()
  name: string;
}

export class CsvAnalysisResponseDto {
  @ApiProperty({ description: 'Total number of rows in CSV' })
  totalRows: number;

  @ApiProperty({ description: 'Total number of columns' })
  totalColumns: number;

  @ApiProperty({ description: 'Column analysis' })
  columns: ColumnAnalysisDto[];

  @ApiPropertyOptional({ description: 'Suggested key column' })
  suggestedKeyColumn?: string;

  @ApiPropertyOptional({ description: 'Suggested target column for classification' })
  suggestedTargetColumn?: string;

  @ApiPropertyOptional({ description: 'Suggested template based on data structure' })
  suggestedTemplate?: ConversionTemplateType;

  @ApiProperty({ description: 'Preview of first 5 rows' })
  dataPreview: string[][];
}

export class ColumnAnalysisDto {
  @ApiProperty({ description: 'Column name' })
  name: string;

  @ApiProperty({ 
    description: 'Detected column type',
    enum: ['categorical', 'numerical', 'text', 'date', 'boolean', 'unknown']
  })
  type: string;

  @ApiProperty({ description: 'Number of unique values' })
  uniqueValues: number;

  @ApiProperty({ description: 'Sample values from column' })
  samples: string[];

  @ApiProperty({ description: 'Whether this is likely a key/identifier column' })
  isKey: boolean;

  @ApiProperty({ description: 'Whether this could be a target column for classification' })
  isPotentialTarget: boolean;
}

export class ConversionPreviewDto {
  @ApiProperty({ description: 'Preview examples (first 5)' })
  examples: any[];

  @ApiProperty({ description: 'CSV analysis' })
  analysis: CsvAnalysisResponseDto;

  @ApiProperty({ description: 'Estimated total examples that will be generated' })
  estimatedTotal: number;
}

export class ConversionResultDto {
  @ApiProperty({ description: 'Path to converted JSONL file' })
  outputPath: string;

  @ApiProperty({ description: 'Total examples generated' })
  totalExamples: number;

  @ApiProperty({ description: 'Output format' })
  format: string;

  @ApiProperty({ description: 'Preview of first 5 examples' })
  preview: any[];
}

export class TemplateInfoDto {
  @ApiProperty({ description: 'Template identifier' })
  name: string;

  @ApiProperty({ description: 'Human-readable description' })
  description: string;

  @ApiProperty({ description: 'User prompt pattern with placeholders' })
  userPromptPattern: string;

  @ApiProperty({ description: 'Assistant response pattern with placeholders' })
  assistantPattern: string;

  @ApiProperty({ description: 'Default system message' })
  systemMessage: string;

  @ApiPropertyOptional({ description: 'Example of generated output' })
  example?: string;
}
