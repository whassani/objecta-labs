import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { Document } from './entities/document.entity';

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: any;
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private qdrantClient: QdrantClient;
  private embeddings: OllamaEmbeddings;
  private collectionName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(DocumentChunk)
    private documentChunksRepository: Repository<DocumentChunk>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {
    // Initialize Qdrant client
    const qdrantUrl = this.configService.get('QDRANT_URL', 'http://localhost:6333');
    this.qdrantClient = new QdrantClient({ url: qdrantUrl });
    
    // Initialize Ollama embeddings with multilingual model
    const ollamaBaseUrl = this.configService.get('OLLAMA_BASE_URL', 'http://localhost:11434');
    const embeddingModel = this.configService.get('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text');
    
    this.embeddings = new OllamaEmbeddings({
      baseUrl: ollamaBaseUrl,
      model: embeddingModel,
    });
    
    this.collectionName = this.configService.get('QDRANT_COLLECTION', 'objecta_labs');
    
    this.logger.log(`Initialized VectorStoreService with Ollama embeddings (${embeddingModel})`);
    
    // Initialize collection on startup
    this.initializeCollection().catch(err => {
      this.logger.error('Failed to initialize collection', err);
    });
  }

  /**
   * Initialize Qdrant collection if it doesn't exist
   */
  private async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);

      if (!exists) {
        this.logger.log(`Creating collection: ${this.collectionName}`);
        
        // Create collection with appropriate vector size for nomic-embed-text (768 dimensions)
        await this.qdrantClient.createCollection(this.collectionName, {
          vectors: {
            size: 768, // nomic-embed-text produces 768-dimensional vectors
            distance: 'Cosine',
          },
        });
        
        this.logger.log(`Collection ${this.collectionName} created successfully`);
      } else {
        this.logger.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      this.logger.error(`Error initializing collection: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate embeddings for a document's chunks and store in Qdrant
   */
  async indexDocument(documentId: string, organizationId: string): Promise<void> {
    this.logger.log(`Indexing document: ${documentId}`);

    try {
      // Get document
      const document = await this.documentsRepository.findOne({
        where: { id: documentId, organizationId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Get all chunks for the document
      const chunks = await this.documentChunksRepository.find({
        where: { documentId },
        order: { chunkIndex: 'ASC' },
      });

      if (chunks.length === 0) {
        this.logger.warn(`No chunks found for document ${documentId}`);
        return;
      }

      // Generate embeddings for all chunks
      this.logger.log(`Generating embeddings for ${chunks.length} chunks`);
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddings.embedDocuments(texts);

      // Prepare points for Qdrant
      const points = chunks.map((chunk, index) => ({
        id: chunk.id,
        vector: embeddings[index],
        payload: {
          documentId: document.id,
          chunkId: chunk.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          organizationId: document.organizationId,
          documentTitle: document.title,
          contentType: document.contentType,
          metadata: {
            ...document.metadata,
            ...chunk.metadata,
          },
        },
      }));

      // Upsert points to Qdrant
      await this.qdrantClient.upsert(this.collectionName, {
        wait: true,
        points,
      });

      this.logger.log(`Successfully indexed ${chunks.length} chunks for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Error indexing document ${documentId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search for similar chunks using semantic search
   */
  async searchSimilar(
    query: string,
    organizationId: string,
    limit: number = 5,
    scoreThreshold: number = 0.7,
  ): Promise<SearchResult[]> {
    this.logger.log(`Searching for: "${query}" (org: ${organizationId})`);

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Search in Qdrant
      const searchResults = await this.qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: scoreThreshold,
        filter: {
          must: [
            {
              key: 'organizationId',
              match: { value: organizationId },
            },
          ],
        },
        with_payload: true,
      });

      // Map results
      const results: SearchResult[] = searchResults.map(result => ({
        chunkId: result.payload.chunkId as string,
        documentId: result.payload.documentId as string,
        content: result.payload.content as string,
        score: result.score,
        metadata: {
          documentTitle: result.payload.documentTitle,
          contentType: result.payload.contentType,
          chunkIndex: result.payload.chunkIndex,
          ...((result.payload.metadata as any) || {}),
        },
      }));

      this.logger.log(`Found ${results.length} similar chunks`);
      return results;
    } catch (error) {
      this.logger.error(`Error searching: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete document vectors from Qdrant
   */
  async deleteDocumentVectors(documentId: string): Promise<{ deleted: number }> {
    const startTime = Date.now();
    this.logger.log(`[Vector Deletion] Starting deletion for document: ${documentId}`);

    try {
      // First, count how many vectors exist for this document
      const countResult = await this.qdrantClient.count(this.collectionName, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId },
            },
          ],
        },
      });

      const vectorCount = countResult.count || 0;
      this.logger.log(`[Vector Deletion] Found ${vectorCount} vectors to delete for document ${documentId}`);

      if (vectorCount === 0) {
        this.logger.warn(`[Vector Deletion] No vectors found for document ${documentId} - may already be deleted`);
        return { deleted: 0 };
      }

      // Delete the vectors
      await this.qdrantClient.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId },
            },
          ],
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(`[Vector Deletion] Successfully deleted ${vectorCount} vectors for document ${documentId} in ${duration}ms`);
      
      return { deleted: vectorCount };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[Vector Deletion] Failed to delete vectors for document ${documentId} after ${duration}ms: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionInfo(): Promise<any> {
    try {
      const info = await this.qdrantClient.getCollection(this.collectionName);
      return {
        name: this.collectionName,
        vectorsCount: info.indexed_vectors_count || 0,
        pointsCount: info.points_count || 0,
        status: info.status,
        segmentsCount: info.segments_count,
      };
    } catch (error) {
      this.logger.error(`Error getting collection info: ${error.message}`);
      return null;
    }
  }

  /**
   * Find and cleanup orphaned vectors (vectors in Qdrant without corresponding documents in DB)
   */
  async cleanupOrphanedVectors(organizationId: string): Promise<{
    scanned: number;
    orphaned: number;
    deleted: number;
    errors: number;
  }> {
    this.logger.log(`[Orphan Cleanup] Starting cleanup for organization: ${organizationId}`);
    const startTime = Date.now();

    let scanned = 0;
    let orphaned = 0;
    let deleted = 0;
    let errors = 0;

    try {
      // Scroll through all vectors for this organization
      let offset: string | number | Record<string, unknown> | null = null;
      const limit = 100;

      do {
        const scrollResult = await this.qdrantClient.scroll(this.collectionName, {
          filter: {
            must: [
              {
                key: 'organizationId',
                match: { value: organizationId },
              },
            ],
          },
          limit,
          offset: offset || undefined,
          with_payload: true,
        });

        const points = scrollResult.points || [];
        scanned += points.length;

        // Check each point's document existence
        for (const point of points) {
          const documentId = point.payload?.documentId as string;
          
          if (!documentId) {
            this.logger.warn(`[Orphan Cleanup] Vector ${point.id} has no documentId in payload`);
            continue;
          }

          // Check if document exists in database
          const document = await this.documentsRepository.findOne({
            where: { id: documentId, organizationId },
          });

          if (!document) {
            orphaned++;
            this.logger.log(`[Orphan Cleanup] Found orphaned vector for document ${documentId}`);
            
            try {
              // Delete the orphaned vector
              await this.qdrantClient.delete(this.collectionName, {
                wait: true,
                points: [point.id],
              });
              deleted++;
            } catch (error) {
              errors++;
              this.logger.error(`[Orphan Cleanup] Failed to delete orphaned vector ${point.id}: ${error.message}`);
            }
          }
        }

        offset = scrollResult.next_page_offset;
      } while (offset !== null && offset !== undefined);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[Orphan Cleanup] Completed for organization ${organizationId} in ${duration}ms. ` +
        `Scanned: ${scanned}, Orphaned: ${orphaned}, Deleted: ${deleted}, Errors: ${errors}`
      );

      return { scanned, orphaned, deleted, errors };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[Orphan Cleanup] Failed for organization ${organizationId} after ${duration}ms: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get list of all document IDs in vector store for an organization
   */
  async getVectorStoreDocumentIds(organizationId: string): Promise<string[]> {
    const documentIds = new Set<string>();
    let offset: string | number | Record<string, unknown> | null = null;
    const limit = 100;

    try {
      do {
        const scrollResult = await this.qdrantClient.scroll(this.collectionName, {
          filter: {
            must: [
              {
                key: 'organizationId',
                match: { value: organizationId },
              },
            ],
          },
          limit,
          offset: offset || undefined,
          with_payload: ['documentId'],
        });

        const points = scrollResult.points || [];
        
        for (const point of points) {
          const documentId = point.payload?.documentId as string;
          if (documentId) {
            documentIds.add(documentId);
          }
        }

        offset = scrollResult.next_page_offset;
      } while (offset !== null && offset !== undefined);

      return Array.from(documentIds);
    } catch (error) {
      this.logger.error(`Error getting vector store document IDs: ${error.message}`);
      throw error;
    }
  }
}
