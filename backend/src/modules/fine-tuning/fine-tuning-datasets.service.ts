import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FineTuningDataset } from './entities/fine-tuning-dataset.entity';
import { TrainingExample } from './entities/training-example.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../conversations/entities/message.entity';
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  ImportFromConversationsDto,
  DatasetStatsDto,
} from './dto/dataset.dto';
import { DataConversionService } from './data-conversion.service';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

@Injectable()
export class FineTuningDatasetsService {
  private readonly logger = new Logger(FineTuningDatasetsService.name);
  private readonly uploadDir = './uploads/fine-tuning';

  constructor(
    @InjectRepository(FineTuningDataset)
    private datasetsRepository: Repository<FineTuningDataset>,
    @InjectRepository(TrainingExample)
    private examplesRepository: Repository<TrainingExample>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private readonly dataConversionService: DataConversionService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(
    createDatasetDto: CreateDatasetDto,
    file: Express.Multer.File,
    organizationId: string,
    userId: string,
  ): Promise<FineTuningDataset> {
    try {
      // Save file to disk
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(this.uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      // Convert CSV to JSONL if needed
      let finalFilePath = filePath;
      if (createDatasetDto.format === 'csv') {
        finalFilePath = await this.convertCsvToJsonl(filePath);
        // Delete original CSV file
        fs.unlinkSync(filePath);
      }

      // Create dataset record
      const dataset = this.datasetsRepository.create({
        ...createDatasetDto,
        organizationId,
        createdBy: userId,
        filePath: finalFilePath,
        fileSizeBytes: fs.statSync(finalFilePath).size,
        format: 'jsonl', // Always store as JSONL internally
      });

      await this.datasetsRepository.save(dataset);

      this.logger.log(`Created dataset: ${dataset.id}`);

      // Parse and store examples asynchronously
      this.parseAndStoreExamples(dataset.id, finalFilePath).catch((error) => {
        this.logger.error(`Failed to parse examples for dataset ${dataset.id}: ${error.message}`);
      });

      return dataset;
    } catch (error) {
      this.logger.error(`Failed to create dataset: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(
    organizationId: string,
    workspaceId?: string,
  ): Promise<FineTuningDataset[]> {
    const query = this.datasetsRepository
      .createQueryBuilder('dataset')
      .leftJoinAndSelect('dataset.creator', 'creator')
      .where('dataset.organizationId = :organizationId', { organizationId })
      .andWhere('dataset.deletedAt IS NULL');

    if (workspaceId) {
      query.andWhere('dataset.workspaceId = :workspaceId', { workspaceId });
    }

    query.orderBy('dataset.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, organizationId: string): Promise<FineTuningDataset> {
    const dataset = await this.datasetsRepository.findOne({
      where: { id, organizationId, deletedAt: null },
      relations: ['creator', 'workspace'],
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    return dataset;
  }

  async update(
    id: string,
    updateDatasetDto: UpdateDatasetDto,
    organizationId: string,
  ): Promise<FineTuningDataset> {
    const dataset = await this.findOne(id, organizationId);

    Object.assign(dataset, updateDatasetDto);
    await this.datasetsRepository.save(dataset);

    this.logger.log(`Updated dataset: ${id}`);
    return dataset;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const dataset = await this.findOne(id, organizationId);

    // Soft delete
    dataset.deletedAt = new Date();
    await this.datasetsRepository.save(dataset);

    // Delete file from disk
    try {
      if (fs.existsSync(dataset.filePath)) {
        fs.unlinkSync(dataset.filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${dataset.filePath}`);
    }

    this.logger.log(`Deleted dataset: ${id}`);
  }

  async validate(id: string, organizationId: string): Promise<{
    valid: boolean;
    errors?: string[];
    totalExamples: number;
    totalTokens: number;
  }> {
    const dataset = await this.findOne(id, organizationId);

    const errors: string[] = [];
    let totalExamples = 0;
    let totalTokens = 0;

    try {
      const fileStream = fs.createReadStream(dataset.filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        totalExamples++;

        try {
          const example = JSON.parse(line);

          if (!example.messages || !Array.isArray(example.messages)) {
            errors.push(`Line ${totalExamples}: Missing or invalid 'messages' array`);
            continue;
          }

          for (const msg of example.messages) {
            if (!msg.role || !msg.content) {
              errors.push(`Line ${totalExamples}: Invalid message format`);
              break;
            }
            if (!['system', 'user', 'assistant'].includes(msg.role)) {
              errors.push(`Line ${totalExamples}: Invalid role '${msg.role}'`);
              break;
            }
            totalTokens += Math.ceil(msg.content.length / 4);
          }

          const hasUser = example.messages.some((m) => m.role === 'user');
          const hasAssistant = example.messages.some((m) => m.role === 'assistant');
          
          if (!hasUser || !hasAssistant) {
            errors.push(`Line ${totalExamples}: Must have user and assistant messages`);
          }
        } catch (parseError) {
          errors.push(`Line ${totalExamples}: Invalid JSON`);
        }

        if (errors.length > 50) {
          errors.push('Too many errors. Validation stopped.');
          break;
        }
      }

      if (totalExamples < 10) {
        errors.push(`Insufficient examples: ${totalExamples} (minimum 10 required)`);
      }

      // Update dataset
      dataset.validated = errors.length === 0;
      dataset.validationErrors = errors.length > 0 ? errors : null;
      dataset.totalExamples = totalExamples;
      await this.datasetsRepository.save(dataset);

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        totalExamples,
        totalTokens,
      };
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }
  }

  async importFromConversations(
    importDto: ImportFromConversationsDto,
    organizationId: string,
    userId: string,
  ): Promise<FineTuningDataset> {
    try {
      // Build query to fetch conversations
      const query = this.conversationsRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.messages', 'message')
        .where('conversation.organizationId = :organizationId', { organizationId })
        .andWhere('conversation.deletedAt IS NULL');

      if (importDto.workspaceId) {
        query.andWhere('conversation.workspaceId = :workspaceId', {
          workspaceId: importDto.workspaceId,
        });
      }

      if (importDto.agentId) {
        query.andWhere('conversation.agentId = :agentId', {
          agentId: importDto.agentId,
        });
      }

      if (importDto.startDate) {
        query.andWhere('conversation.createdAt >= :startDate', {
          startDate: new Date(importDto.startDate),
        });
      }

      if (importDto.endDate) {
        query.andWhere('conversation.createdAt <= :endDate', {
          endDate: new Date(importDto.endDate),
        });
      }

      query.orderBy('conversation.createdAt', 'DESC');

      if (importDto.maxExamples) {
        query.limit(importDto.maxExamples);
      }

      const conversations = await query.getMany();

      if (conversations.length === 0) {
        throw new BadRequestException('No conversations found matching the criteria');
      }

      // Generate JSONL file
      const fileName = `imported-${Date.now()}.jsonl`;
      const filePath = path.join(this.uploadDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      let exampleCount = 0;
      let totalSize = 0;

      for (const conversation of conversations) {
        // Convert messages to training format
        const messages = conversation.messages
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        if (messages.length < 2) continue;

        const example = { messages };
        const line = JSON.stringify(example) + '\n';
        writeStream.write(line);
        totalSize += line.length;
        exampleCount++;
      }

      writeStream.end();

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      // Create dataset record
      const dataset = this.datasetsRepository.create({
        name: importDto.name,
        description: importDto.description,
        organizationId,
        workspaceId: importDto.workspaceId,
        createdBy: userId,
        filePath,
        fileSizeBytes: totalSize,
        format: 'jsonl',
        source: 'conversations',
        sourceFilters: {
          agentId: importDto.agentId,
          startDate: importDto.startDate,
          endDate: importDto.endDate,
          minQualityScore: importDto.minQualityScore,
        },
        totalExamples: exampleCount,
      });

      await this.datasetsRepository.save(dataset);

      this.logger.log(`Imported ${exampleCount} examples from conversations`);

      return dataset;
    } catch (error) {
      this.logger.error(`Failed to import from conversations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStats(organizationId: string, workspaceId?: string): Promise<DatasetStatsDto> {
    const query = this.datasetsRepository
      .createQueryBuilder('dataset')
      .where('dataset.organizationId = :organizationId', { organizationId })
      .andWhere('dataset.deletedAt IS NULL');

    if (workspaceId) {
      query.andWhere('dataset.workspaceId = :workspaceId', { workspaceId });
    }

    const datasets = await query.getMany();

    const stats: DatasetStatsDto = {
      totalDatasets: datasets.length,
      totalExamples: datasets.reduce((sum, d) => sum + d.totalExamples, 0),
      totalSizeBytes: datasets.reduce((sum, d) => sum + Number(d.fileSizeBytes), 0),
      validatedDatasets: datasets.filter((d) => d.validated).length,
      byFormat: {},
      bySource: {},
    };

    datasets.forEach((dataset) => {
      stats.byFormat[dataset.format] = (stats.byFormat[dataset.format] || 0) + 1;
      if (dataset.source) {
        stats.bySource[dataset.source] = (stats.bySource[dataset.source] || 0) + 1;
      }
    });

    return stats;
  }

  // Private helper methods
  private async parseAndStoreExamples(datasetId: string, filePath: string): Promise<void> {
    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      const examples: Partial<TrainingExample>[] = [];
      let lineNumber = 0;

      for await (const line of rl) {
        if (!line.trim()) continue;

        lineNumber++;

        try {
          const example = JSON.parse(line);
          const tokenCount = this.estimateTokenCount(example.messages);

          examples.push({
            datasetId,
            messages: example.messages,
            tokenCount,
          });

          // Batch insert every 100 examples
          if (examples.length >= 100) {
            await this.examplesRepository.save(examples);
            examples.length = 0;
          }
        } catch (error) {
          this.logger.warn(`Failed to parse line ${lineNumber}: ${error.message}`);
        }
      }

      // Insert remaining examples
      if (examples.length > 0) {
        await this.examplesRepository.save(examples);
      }

      // Update dataset total examples
      const totalExamples = await this.examplesRepository.count({
        where: { datasetId },
      });

      await this.datasetsRepository.update(datasetId, { totalExamples });

      this.logger.log(`Parsed and stored ${totalExamples} examples for dataset ${datasetId}`);
    } catch (error) {
      this.logger.error(`Failed to parse examples: ${error.message}`, error.stack);
    }
  }

  private estimateTokenCount(messages: any[]): number {
    let totalChars = 0;
    for (const msg of messages) {
      totalChars += msg.content?.length || 0;
    }
    return Math.ceil(totalChars / 4);
  }

  /**
   * Convert CSV/JSON file to JSONL format
   * DEPRECATED: Use DataConversionService for new conversions
   * This method is kept for backward compatibility
   * 
   * Supports CSV, JSON, and JSONL formats
   */
  private async convertCsvToJsonl(csvFilePath: string): Promise<string> {
    // Use new data conversion service with default guided mode
    this.logger.log('Using legacy conversion - consider using Guided or Smart conversion');
    
    try {
      const result = await this.dataConversionService.convertWithGuided(csvFilePath, {
        template: 'qa' as any,
        multiTurn: false,
      });
      return result.outputPath;
    } catch (error) {
      // Fallback to legacy method if new service fails
      this.logger.warn('New conversion failed, falling back to legacy method');
      return this.legacyConvertCsvToJsonl(csvFilePath);
    }
  }

  /**
   * Legacy CSV conversion method (kept for backward compatibility)
   */
  private async legacyConvertCsvToJsonl(csvFilePath: string): Promise<string> {
    const jsonlFilePath = csvFilePath.replace(/\.csv$/i, '.jsonl');
    const readStream = fs.createReadStream(csvFilePath, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(jsonlFilePath);
    
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;
    let headers: string[] = [];
    let examplesWritten = 0;

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (isFirstLine) {
        // Parse header row
        headers = this.parseCsvLine(line);
        isFirstLine = false;
        
        // Check if it's training format (has system, user, assistant columns)
        const hasTrainingColumns = headers.some(h => 
          ['system', 'user', 'assistant'].includes(h.trim().toLowerCase())
        );
        
        if (!hasTrainingColumns) {
          this.logger.warn(
            `CSV does not have training format columns (system, user, assistant). ` +
            `Found columns: ${headers.join(', ')}. Converting to Q&A format...`
          );
        }
        
        continue;
      }

      try {
        const values = this.parseCsvLine(line);
        
        // Build messages array
        const messages: any[] = [];
        
        // Check if this is training format
        const hasSystemCol = headers.some(h => h.trim().toLowerCase() === 'system');
        const hasUserCol = headers.some(h => h.trim().toLowerCase() === 'user');
        const hasAssistantCol = headers.some(h => h.trim().toLowerCase() === 'assistant');
        
        if (hasSystemCol || hasUserCol || hasAssistantCol) {
          // Training format - use specified columns
          for (let i = 0; i < Math.min(headers.length, values.length); i++) {
            const role = headers[i].trim().toLowerCase();
            const content = values[i].trim();
            
            if (content && ['system', 'user', 'assistant'].includes(role)) {
              messages.push({ role, content });
            }
          }
        } else {
          // Data format - generate Q&A from row data
          // Create a summary of the row data
          const dataPoints: string[] = [];
          for (let i = 0; i < Math.min(headers.length, values.length); i++) {
            const header = headers[i].trim();
            const value = values[i].trim();
            if (value) {
              dataPoints.push(`${header}: ${value}`);
            }
          }
          
          if (dataPoints.length > 0) {
            // Create training examples from the data
            const firstValue = values[0]?.trim();
            if (firstValue) {
              messages.push(
                { role: 'system', content: 'You are a helpful assistant that provides information based on data.' },
                { role: 'user', content: `Tell me about ${firstValue}` },
                { role: 'assistant', content: dataPoints.join('. ') + '.' }
              );
            }
          }
        }

        if (messages.length >= 2) { // Need at least user and assistant
          const jsonlLine = JSON.stringify({ messages }) + '\n';
          writeStream.write(jsonlLine);
          examplesWritten++;
        }
      } catch (error) {
        this.logger.warn(`Failed to parse CSV line: ${error.message}`);
      }
    }

    writeStream.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    this.logger.log(`Converted CSV to JSONL: ${jsonlFilePath} (${examplesWritten} examples)`);
    
    if (examplesWritten === 0) {
      throw new BadRequestException(
        'No valid training examples could be generated from CSV. ' +
        'Please ensure CSV has either (system, user, assistant) columns or valid data rows.'
      );
    }
    
    return jsonlFilePath;
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add last value
    values.push(currentValue);

    return values;
  }
}
