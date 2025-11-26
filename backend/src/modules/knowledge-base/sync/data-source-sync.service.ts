import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from '../entities/data-source.entity';
import { Document } from '../entities/document.entity';
import { DocumentProcessorService } from '../document-processor.service';
import { BaseSyncAdapter, SyncResult, SyncDocument } from './base-sync-adapter.interface';
import { GoogleDriveSyncAdapter } from './adapters/google-drive.adapter';
import { ConfluenceSyncAdapter } from './adapters/confluence.adapter';
import { GitHubSyncAdapter } from './adapters/github.adapter';
import { NotionSyncAdapter } from './adapters/notion.adapter';

/**
 * Service to orchestrate syncing from external data sources
 */
@Injectable()
export class DataSourceSyncService {
  private readonly logger = new Logger(DataSourceSyncService.name);
  private readonly adapters: Map<string, BaseSyncAdapter> = new Map();

  constructor(
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private documentProcessorService: DocumentProcessorService,
    private googleDriveAdapter: GoogleDriveSyncAdapter,
    private confluenceAdapter: ConfluenceSyncAdapter,
    private githubAdapter: GitHubSyncAdapter,
    private notionAdapter: NotionSyncAdapter,
  ) {
    // Register adapters
    this.adapters.set('google-drive', googleDriveAdapter);
    this.adapters.set('confluence', confluenceAdapter);
    this.adapters.set('github', githubAdapter);
    this.adapters.set('notion', notionAdapter);
  }

  /**
   * Get adapter for a data source type
   */
  getAdapter(sourceType: string): BaseSyncAdapter | undefined {
    return this.adapters.get(sourceType);
  }

  /**
   * Get list of supported data source types
   */
  getSupportedSourceTypes(): Array<{ type: string; name: string; schema: any }> {
    return Array.from(this.adapters.entries()).map(([type, adapter]) => ({
      type,
      name: adapter.getAdapterName(),
      schema: adapter.getConfigSchema(),
    }));
  }

  /**
   * Test connection to a data source
   */
  async testConnection(sourceType: string, credentials: any, config: any): Promise<boolean> {
    const adapter = this.getAdapter(sourceType);
    if (!adapter) {
      throw new NotFoundException(`Adapter for source type '${sourceType}' not found`);
    }

    if (!adapter.validateCredentials(credentials)) {
      throw new Error('Invalid credentials format');
    }

    return adapter.testConnection(credentials, config);
  }

  /**
   * Sync a data source
   */
  async syncDataSource(dataSourceId: string, organizationId: string): Promise<SyncResult> {
    this.logger.log(`Starting sync for data source: ${dataSourceId}`);

    // Get data source
    const dataSource = await this.dataSourcesRepository.findOne({
      where: { id: dataSourceId, organizationId },
    });

    if (!dataSource) {
      throw new NotFoundException('Data source not found');
    }

    if (!dataSource.isEnabled) {
      throw new Error('Data source is disabled');
    }

    // Get adapter
    const adapter = this.getAdapter(dataSource.sourceType);
    if (!adapter) {
      throw new NotFoundException(`Adapter for source type '${dataSource.sourceType}' not found`);
    }

    // Update status
    dataSource.status = 'syncing';
    await this.dataSourcesRepository.save(dataSource);

    const result: SyncResult = {
      success: false,
      documentsProcessed: 0,
      documentsAdded: 0,
      documentsUpdated: 0,
      documentsDeleted: 0,
      errors: [],
      lastSyncTimestamp: new Date(),
    };

    try {
      // Fetch documents from external source
      const syncConfig = {
        ...dataSource.config,
        lastSyncTimestamp: dataSource.lastSyncedAt,
      };

      const externalDocuments = await adapter.fetchDocuments(
        dataSource.credentials,
        syncConfig,
      );

      this.logger.log(`Fetched ${externalDocuments.length} documents from ${dataSource.sourceType}`);
      result.documentsProcessed = externalDocuments.length;

      // Get existing documents for this data source
      const existingDocuments = await this.documentsRepository.find({
        where: { dataSourceId, organizationId },
      });

      const existingDocMap = new Map(
        existingDocuments.map(doc => [doc.metadata?.externalId, doc])
      );

      // Process each external document
      for (const extDoc of externalDocuments) {
        try {
          const existing = existingDocMap.get(extDoc.externalId);

          if (existing) {
            // Update existing document if modified
            if (new Date(extDoc.lastModified) > existing.updatedAt) {
              await this.updateDocument(existing, extDoc);
              result.documentsUpdated++;
            }
            existingDocMap.delete(extDoc.externalId);
          } else {
            // Create new document
            await this.createDocument(dataSourceId, organizationId, extDoc);
            result.documentsAdded++;
          }
        } catch (error) {
          this.logger.error(`Error processing document ${extDoc.title}:`, error);
          result.errors.push(`${extDoc.title}: ${error.message}`);
        }
      }

      // Handle deletions if enabled
      if (dataSource.config.syncDeletes) {
        for (const [externalId, doc] of existingDocMap) {
          try {
            await this.documentProcessorService.deleteDocument(doc.id, organizationId);
            result.documentsDeleted++;
          } catch (error) {
            this.logger.error(`Error deleting document ${doc.title}:`, error);
            result.errors.push(`Delete ${doc.title}: ${error.message}`);
          }
        }
      }

      // Update data source status
      dataSource.status = 'active';
      dataSource.lastSyncedAt = result.lastSyncTimestamp;
      dataSource.errorMessage = null;
      result.success = true;

      this.logger.log(
        `Sync completed for ${dataSource.name}: ` +
        `${result.documentsAdded} added, ${result.documentsUpdated} updated, ` +
        `${result.documentsDeleted} deleted`
      );

    } catch (error) {
      this.logger.error(`Sync failed for data source ${dataSourceId}:`, error);
      dataSource.status = 'error';
      dataSource.errorMessage = error.message;
      result.errors.push(error.message);
    }

    await this.dataSourcesRepository.save(dataSource);
    return result;
  }

  /**
   * Create a new document from synced data
   */
  private async createDocument(
    dataSourceId: string,
    organizationId: string,
    syncDoc: SyncDocument,
  ): Promise<Document> {
    this.logger.log(`Creating document: ${syncDoc.title}`);

    const document = this.documentsRepository.create({
      organizationId,
      dataSourceId,
      title: syncDoc.title,
      content: syncDoc.content,
      contentType: syncDoc.contentType,
      url: syncDoc.url,
      sourcePath: syncDoc.metadata?.path || null, // Store the full path from source
      tags: syncDoc.tags,
      category: syncDoc.category,
      metadata: {
        ...syncDoc.metadata,
        externalId: syncDoc.externalId,
      },
      processingStatus: 'completed',
    });

    const savedDoc = await this.documentsRepository.save(document);

    // Chunk and index the document
    try {
      const chunks = await this.chunkText(syncDoc.content);
      await this.saveChunks(savedDoc.id, chunks);
      savedDoc.chunkCount = chunks.length;
      await this.documentsRepository.save(savedDoc);
    } catch (error) {
      this.logger.error(`Error processing document ${syncDoc.title}:`, error);
    }

    return savedDoc;
  }

  /**
   * Update an existing document
   */
  private async updateDocument(
    existing: Document,
    syncDoc: SyncDocument,
  ): Promise<Document> {
    this.logger.log(`Updating document: ${syncDoc.title}`);

    existing.title = syncDoc.title;
    existing.content = syncDoc.content;
    existing.contentType = syncDoc.contentType;
    existing.url = syncDoc.url;
    existing.tags = syncDoc.tags;
    existing.category = syncDoc.category;
    existing.metadata = {
      ...existing.metadata,
      ...syncDoc.metadata,
      externalId: syncDoc.externalId,
    };
    existing.version = (existing.version || 1) + 1;

    const savedDoc = await this.documentsRepository.save(existing);

    // Re-chunk and re-index the document
    try {
      // Delete old chunks
      // Note: This assumes you have a method to delete chunks
      // await this.documentProcessorService.deleteChunks(existing.id);

      const chunks = await this.chunkText(syncDoc.content);
      await this.saveChunks(savedDoc.id, chunks);
      savedDoc.chunkCount = chunks.length;
      await this.documentsRepository.save(savedDoc);
    } catch (error) {
      this.logger.error(`Error updating document ${syncDoc.title}:`, error);
    }

    return savedDoc;
  }

  /**
   * Chunk text using LangChain
   */
  private async chunkText(text: string): Promise<string[]> {
    const { RecursiveCharacterTextSplitter } = await import('langchain/text_splitter');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map(doc => doc.pageContent);
  }

  /**
   * Save chunks to database
   */
  private async saveChunks(documentId: string, chunks: string[]): Promise<void> {
    const { DocumentChunk } = await import('../entities/document-chunk.entity');
    const { Repository } = await import('typeorm');
    const { InjectRepository } = await import('@nestjs/typeorm');
    
    // Get document chunks repository from the document processor
    const savedChunks = await this.documentProcessorService['documentChunksRepository'].save(
      chunks.map((content, index) => ({
        documentId,
        content,
        chunkIndex: index,
        metadata: {},
      }))
    );
    
    this.logger.log(`Saved ${savedChunks.length} chunks for document ${documentId}`);
  }

  /**
   * Sync all active data sources
   */
  async syncAllDataSources(organizationId: string): Promise<Map<string, SyncResult>> {
    const dataSources = await this.dataSourcesRepository.find({
      where: { organizationId, isEnabled: true },
    });

    const results = new Map<string, SyncResult>();

    for (const dataSource of dataSources) {
      try {
        const result = await this.syncDataSource(dataSource.id, organizationId);
        results.set(dataSource.id, result);
      } catch (error) {
        this.logger.error(`Failed to sync data source ${dataSource.name}:`, error);
        results.set(dataSource.id, {
          success: false,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: [error.message],
          lastSyncTimestamp: new Date(),
        });
      }
    }

    return results;
  }
}
