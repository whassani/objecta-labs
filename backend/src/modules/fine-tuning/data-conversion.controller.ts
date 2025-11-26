import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataConversionService, ConversionMode } from './data-conversion.service';
import { FineTuningDatasetsService } from './fine-tuning-datasets.service';
import {
  PreviewConversionDto,
  CsvAnalysisResponseDto,
  ConversionPreviewDto,
  TemplateInfoDto,
} from './dto/conversion.dto';
import { DatasetResponseDto } from './dto/dataset.dto';
import { DataConversionGateway } from './data-conversion.gateway';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Data Conversion')
@ApiBearerAuth()
@Controller('fine-tuning/datasets')
@UseGuards(JwtAuthGuard)
export class DataConversionController {
  constructor(
    private readonly dataConversionService: DataConversionService,
    private readonly datasetsService: FineTuningDatasetsService,
    private readonly gateway: DataConversionGateway,
  ) {}

  /**
   * Analyze uploaded data file (CSV/JSON/JSONL)
   * Auto-detects format and returns column analysis with suggestions
   */
  @Post('analyze-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyze data file structure (CSV/JSON/JSONL)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Data analyzed successfully',
    type: CsvAnalysisResponseDto,
  })
  async analyzeData(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CsvAnalysisResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Save file temporarily
    const tempPath = path.join('./uploads/fine-tuning', `temp-${Date.now()}-${file.originalname}`);
    fs.writeFileSync(tempPath, file.buffer);

    try {
      const analysis = await this.dataConversionService.analyzeData(tempPath);
      return analysis as CsvAnalysisResponseDto;
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  /**
   * Preview data conversion before committing
   * Shows 5 example conversions based on selected mode and options
   */
  @Post('preview-conversion')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Preview data conversion with examples' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        mode: { type: 'string', enum: ['guided', 'smart'] },
        template: { type: 'string', enum: ['qa', 'info_extraction', 'classification', 'custom'] },
        keyColumn: { type: 'string' },
        targetColumn: { type: 'string' },
        systemMessage: { type: 'string' },
        multiTurn: { type: 'string' },
        customUserPrompt: { type: 'string' },
        customAssistantResponse: { type: 'string' },
        aiProvider: { type: 'string', enum: ['openai', 'ollama'] },
        aiModel: { type: 'string' },
        maxExamplesPerRow: { type: 'number' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Preview generated successfully',
    type: ConversionPreviewDto,
  })
  async previewConversion(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<ConversionPreviewDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Save file temporarily
    const tempPath = path.join('./uploads/fine-tuning', `temp-${Date.now()}-${file.originalname}`);
    fs.writeFileSync(tempPath, file.buffer);

    try {
      // Parse body data (FormData sends everything as strings)
      const previewDto: PreviewConversionDto = {
        mode: body.mode,
        template: body.template,
        keyColumn: body.keyColumn,
        targetColumn: body.targetColumn,
        columnsToInclude: body.columnsToInclude ? JSON.parse(body.columnsToInclude) : undefined,
        systemMessage: body.systemMessage,
        multiTurn: body.multiTurn === 'true' || body.multiTurn === true,
        customUserPrompt: body.customUserPrompt,
        customAssistantResponse: body.customAssistantResponse,
        aiProvider: body.aiProvider,
        aiModel: body.aiModel,
        maxExamplesPerRow: body.maxExamplesPerRow ? parseInt(body.maxExamplesPerRow) : undefined,
      };

      // Analyze data
      const analysis = await this.dataConversionService.analyzeData(tempPath);
      
      // Generate preview examples
      const examples = await this.dataConversionService.generatePreview(
        tempPath,
        previewDto.mode,
        previewDto,
      );

      // Estimate total examples
      let estimatedTotal = analysis.totalRows;
      if (previewDto.multiTurn) {
        estimatedTotal *= 3; // Roughly 3 examples per row in multi-turn
      }
      if (previewDto.mode === ConversionMode.SMART && previewDto.maxExamplesPerRow) {
        estimatedTotal = analysis.totalRows * previewDto.maxExamplesPerRow;
      }

      return {
        analysis: analysis as CsvAnalysisResponseDto,
        examples,
        estimatedTotal,
      };
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  /**
   * Convert data file to fine-tuning format
   * Creates a new dataset with converted JSONL data
   */
  @Post('convert-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Convert data file to fine-tuning format' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        description: { type: 'string' },
        mode: { type: 'string', enum: ['guided', 'smart'] },
        template: { type: 'string', enum: ['qa', 'info_extraction', 'classification', 'custom'] },
        keyColumn: { type: 'string' },
        targetColumn: { type: 'string' },
        columnsToInclude: { type: 'string' },
        systemMessage: { type: 'string' },
        multiTurn: { type: 'string' },
        customUserPrompt: { type: 'string' },
        customAssistantResponse: { type: 'string' },
        aiProvider: { type: 'string', enum: ['openai', 'ollama'] },
        aiModel: { type: 'string' },
        maxExamplesPerRow: { type: 'string' },
      },
      required: ['file', 'name', 'mode'],
    },
  })
  @ApiResponse({ 
    status: 202, 
    description: 'Conversion job started successfully',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        message: { type: 'string' },
        estimatedRows: { type: 'number' },
      },
    },
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async convertData(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ): Promise<{ jobId: string; message: string; estimatedRows?: number }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { organizationId, id: userId } = req.user;
    const jobId = uuidv4();

    // Save original file
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join('./uploads/fine-tuning', fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Get estimated rows for progress tracking
    let estimatedRows: number | undefined;
    try {
      const analysis = await this.dataConversionService.analyzeData(filePath);
      estimatedRows = analysis.totalRows;
    } catch (error) {
      // If analysis fails, continue without estimated rows
    }

    // Start background conversion job
    this.convertInBackground(
      jobId,
      filePath,
      body,
      file.originalname,
      organizationId,
      userId,
    ).catch((error) => {
      this.gateway.sendError(jobId, error.message);
    });

    return {
      jobId,
      message: 'Conversion started. You will be notified when complete.',
      estimatedRows,
    };
  }

  /**
   * Get available conversion templates
   */
  @Get('conversion-templates')
  @ApiOperation({ summary: 'Get available conversion templates' })
  @ApiResponse({ 
    status: 200, 
    description: 'Templates retrieved successfully',
    type: [TemplateInfoDto],
  })
  async getConversionTemplates(): Promise<TemplateInfoDto[]> {
    return this.dataConversionService.getTemplates();
  }

  /**
   * Get supported data formats
   */
  @Get('supported-formats')
  @ApiOperation({ summary: 'Get supported data formats for upload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Supported formats list',
    schema: {
      type: 'object',
      properties: {
        formats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              extensions: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              autoDetect: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  async getSupportedFormats() {
    return {
      formats: [
        {
          format: 'CSV',
          extensions: ['.csv'],
          description: 'Comma-separated values with header row',
          autoDetect: true,
        },
        {
          format: 'JSON',
          extensions: ['.json'],
          description: 'JSON array of objects or object with array property. Supports nested structures (auto-flattened).',
          autoDetect: true,
        },
        {
          format: 'JSONL',
          extensions: ['.jsonl', '.ndjson'],
          description: 'JSON Lines - one JSON object per line',
          autoDetect: true,
        },
      ],
      notes: [
        'All formats are auto-detected - no need to specify format',
        'Nested JSON structures are automatically flattened (e.g., user.name)',
        'Numbers and booleans are preserved from JSON',
        'CSV values are inferred as numbers/booleans where possible',
      ],
    };
  }

  /**
   * Background conversion job
   */
  private async convertInBackground(
    jobId: string,
    filePath: string,
    body: any,
    originalFilename: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Convert based on mode
      let result;
      
      if (body.mode === ConversionMode.GUIDED || body.mode === 'guided') {
        result = await this.dataConversionService.convertWithGuided(filePath, {
          template: body.template,
          keyColumn: body.keyColumn,
          targetColumn: body.targetColumn,
          columnsToInclude: body.columnsToInclude ? JSON.parse(body.columnsToInclude) : undefined,
          systemMessage: body.systemMessage,
          multiTurn: body.multiTurn === 'true' || body.multiTurn === true,
          customUserPrompt: body.customUserPrompt,
          customAssistantResponse: body.customAssistantResponse,
        });
      } else {
        result = await this.dataConversionService.convertWithSmart(
          filePath,
          {
            aiProvider: body.aiProvider || 'openai',
            aiModel: body.aiModel,
            multiTurn: body.multiTurn === 'true' || body.multiTurn === true,
            maxExamplesPerRow: body.maxExamplesPerRow ? parseInt(body.maxExamplesPerRow) : 3,
          },
          jobId, // Pass jobId for progress tracking
        );
      }

      // Create dataset record with converted file
      const dataset = await this.datasetsService.create(
        {
          name: body.name,
          description: body.description || `Converted from ${originalFilename} using ${body.mode} mode`,
          format: 'jsonl',
        },
        {
          originalname: path.basename(result.outputPath),
          buffer: fs.readFileSync(result.outputPath),
          mimetype: 'application/jsonl',
          size: fs.statSync(result.outputPath).size,
        } as Express.Multer.File,
        organizationId,
        userId,
      );

      // Send completion notification
      this.gateway.sendCompletion(jobId, dataset.id);

      // Cleanup temp files
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(result.outputPath)) {
        fs.unlinkSync(result.outputPath);
      }
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.gateway.sendError(jobId, error.message);
      throw error;
    }
  }
}
