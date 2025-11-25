import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { VectorStoreService } from './vector-store.service';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as pdf from 'pdf-parse';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private documentChunksRepository: Repository<DocumentChunk>,
    @Inject(forwardRef(() => VectorStoreService))
    private vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Process an uploaded document file
   */
  async processDocument(
    file: Express.Multer.File,
    organizationId: string,
    title: string,
    dataSourceId?: string,
  ): Promise<Document> {
    this.logger.log(`Processing document: ${title}`);

    // Create document record
    const document = this.documentsRepository.create({
      organizationId,
      dataSourceId,
      title,
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        size: file.size,
      },
      processingStatus: 'processing',
    });

    await this.documentsRepository.save(document);

    try {
      // Extract text based on file type
      let text: string;
      
      if (file.mimetype === 'application/pdf') {
        text = await this.extractTextFromPDF(file.buffer);
      } else if (file.mimetype === 'text/plain') {
        text = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'text/markdown') {
        text = file.buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      // Update document with content
      document.content = text;

      // Chunk the text
      const chunks = await this.chunkText(text);
      
      // Save chunks to database
      await this.saveChunks(document.id, chunks);

      // Update document status
      document.processingStatus = 'completed';
      document.chunkCount = chunks.length;
      await this.documentsRepository.save(document);

      this.logger.log(`Successfully processed document: ${title} (${chunks.length} chunks)`);
      
      // Generate embeddings and index in vector store (async, don't wait)
      this.indexDocumentInBackground(document.id, organizationId);
      
      return document;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);
      
      // Update document status to failed
      document.processingStatus = 'failed';
      document.metadata = {
        ...document.metadata,
        error: error.message,
      };
      await this.documentsRepository.save(document);
      
      throw error;
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      this.logger.error(`Error extracting text from PDF: ${error.message}`);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Chunk text into smaller pieces using LangChain's text splitter
   */
  private async chunkText(text: string): Promise<string[]> {
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
    const chunkEntities = chunks.map((content, index) => {
      return this.documentChunksRepository.create({
        documentId,
        content,
        chunkIndex: index,
        metadata: {},
      });
    });

    await this.documentChunksRepository.save(chunkEntities);
  }

  /**
   * Get all chunks for a document
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return this.documentChunksRepository.find({
      where: { documentId },
      order: { chunkIndex: 'ASC' },
    });
  }

  /**
   * Delete document and its chunks
   */
  async deleteDocument(documentId: string, organizationId: string): Promise<void> {
    this.logger.log(`Deleting document: ${documentId}`);
    
    // Delete vectors from Qdrant first
    try {
      await this.vectorStoreService.deleteDocumentVectors(documentId);
      this.logger.log(`Successfully deleted vectors for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete vectors for document ${documentId}:`, error);
      // Continue with database deletion even if vector deletion fails
    }
    
    // Delete from database (chunks will be cascade deleted)
    await this.documentsRepository.delete({ id: documentId, organizationId });
    this.logger.log(`Successfully deleted document ${documentId} from database`);
  }

  /**
   * Index document in vector store (background task)
   */
  private async indexDocumentInBackground(documentId: string, organizationId: string): Promise<void> {
    try {
      this.logger.log(`Starting background indexing for document: ${documentId}`);
      
      if (this.vectorStoreService && typeof this.vectorStoreService.indexDocument === 'function') {
        await this.vectorStoreService.indexDocument(documentId, organizationId);
        this.logger.log(`Successfully indexed document: ${documentId}`);
      } else {
        this.logger.warn('VectorStoreService not available, skipping indexing');
      }
    } catch (error) {
      this.logger.error(`Failed to index document ${documentId}: ${error.message}`, error.stack);
      // Don't throw - this is a background task
    }
  }
}
