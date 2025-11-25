import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { DataSource } from './entities/data-source.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportData {
  version: string;
  exportDate: Date;
  organizationId: string;
  documents: any[];
  chunks: any[];
  dataSources: any[];
  metadata: any;
}

@Injectable()
export class ExportImportService {
  private readonly logger = new Logger(ExportImportService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private documentChunksRepository: Repository<DocumentChunk>,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
  ) {}

  /**
   * Export knowledge base to JSON
   */
  async exportKnowledgeBase(organizationId: string): Promise<ExportData> {
    this.logger.log(`Exporting knowledge base for org: ${organizationId}`);

    // Get all documents
    const documents = await this.documentsRepository.find({
      where: { organizationId },
    });

    // Get all chunks for these documents
    const documentIds = documents.map(d => d.id);
    const chunks = await this.documentChunksRepository
      .createQueryBuilder('chunk')
      .where('chunk.documentId IN (:...documentIds)', { documentIds })
      .getMany();

    // Get all data sources
    const dataSources = await this.dataSourcesRepository.find({
      where: { organizationId },
    });

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date(),
      organizationId,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        content: d.content,
        contentType: d.contentType,
        tags: d.tags,
        category: d.category,
        metadata: d.metadata,
        chunkCount: d.chunkCount,
        version: d.version,
      })),
      chunks: chunks.map(c => ({
        id: c.id,
        documentId: c.documentId,
        content: c.content,
        chunkIndex: c.chunkIndex,
        metadata: c.metadata,
      })),
      dataSources: dataSources.map(ds => ({
        id: ds.id,
        name: ds.name,
        sourceType: ds.sourceType,
        config: ds.config,
      })),
      metadata: {
        totalDocuments: documents.length,
        totalChunks: chunks.length,
        totalDataSources: dataSources.length,
      },
    };

    this.logger.log(`Export completed: ${documents.length} docs, ${chunks.length} chunks`);
    return exportData;
  }

  /**
   * Import knowledge base from JSON
   */
  async importKnowledgeBase(
    exportData: ExportData,
    organizationId: string,
    options: {
      skipExisting?: boolean;
      updateExisting?: boolean;
    } = {},
  ): Promise<{
    imported: number;
    skipped: number;
    updated: number;
    errors: string[];
  }> {
    this.logger.log(`Importing knowledge base for org: ${organizationId}`);

    const result = {
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Import documents
    for (const docData of exportData.documents) {
      try {
        const existing = await this.documentsRepository.findOne({
          where: { id: docData.id, organizationId },
        });

        if (existing) {
          if (options.skipExisting) {
            result.skipped++;
            continue;
          } else if (options.updateExisting) {
            Object.assign(existing, docData);
            await this.documentsRepository.save(existing);
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          const newDoc = this.documentsRepository.create({
            ...docData,
            organizationId,
            processingStatus: 'completed',
          });
          await this.documentsRepository.save(newDoc);
          result.imported++;
        }
      } catch (error) {
        result.errors.push(`Document ${docData.id}: ${error.message}`);
      }
    }

    // Import chunks
    for (const chunkData of exportData.chunks) {
      try {
        const existing = await this.documentChunksRepository.findOne({
          where: { id: chunkData.id },
        });

        if (!existing) {
          const newChunk = this.documentChunksRepository.create(chunkData);
          await this.documentChunksRepository.save(newChunk);
        }
      } catch (error) {
        result.errors.push(`Chunk ${chunkData.id}: ${error.message}`);
      }
    }

    this.logger.log(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.updated} updated`);
    return result;
  }

  /**
   * Export to file
   */
  async exportToFile(organizationId: string, filePath: string): Promise<void> {
    const data = await this.exportKnowledgeBase(organizationId);
    const json = JSON.stringify(data, null, 2);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, json, 'utf-8');
    this.logger.log(`Exported to file: ${filePath}`);
  }

  /**
   * Import from file
   */
  async importFromFile(
    filePath: string,
    organizationId: string,
    options?: { skipExisting?: boolean; updateExisting?: boolean },
  ): Promise<any> {
    const json = fs.readFileSync(filePath, 'utf-8');
    const data: ExportData = JSON.parse(json);
    
    return this.importKnowledgeBase(data, organizationId, options);
  }

  /**
   * Get export statistics
   */
  async getExportStats(organizationId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    totalDataSources: number;
    estimatedSize: string;
  }> {
    const documents = await this.documentsRepository.count({
      where: { organizationId },
    });

    const chunks = await this.documentChunksRepository
      .createQueryBuilder('chunk')
      .innerJoin('chunk.document', 'document')
      .where('document.organizationId = :organizationId', { organizationId })
      .getCount();

    const dataSources = await this.dataSourcesRepository.count({
      where: { organizationId },
    });

    // Rough estimate: avg 1KB per chunk
    const estimatedSizeKB = chunks * 1;
    const estimatedSize = estimatedSizeKB > 1024
      ? `${(estimatedSizeKB / 1024).toFixed(2)} MB`
      : `${estimatedSizeKB} KB`;

    return {
      totalDocuments: documents,
      totalChunks: chunks,
      totalDataSources: dataSources,
      estimatedSize,
    };
  }
}
