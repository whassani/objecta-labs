import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { DocumentProcessorService } from './document-processor.service';
import { VectorStoreService } from './vector-store.service';
import { AnalyticsService } from './analytics.service';
import { HybridSearchService } from './hybrid-search.service';
import { SearchHistoryService } from './search-history.service';
import { DocumentSimilarityService } from './document-similarity.service';
import { QuerySuggestionsService } from './query-suggestions.service';
import { ExportImportService } from './export-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto/data-source.dto';

@ApiTags('knowledge-base')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(
    private knowledgeBaseService: KnowledgeBaseService,
    private documentProcessorService: DocumentProcessorService,
    private vectorStoreService: VectorStoreService,
    private analyticsService: AnalyticsService,
    private hybridSearchService: HybridSearchService,
    private searchHistoryService: SearchHistoryService,
    private documentSimilarityService: DocumentSimilarityService,
    private querySuggestionsService: QuerySuggestionsService,
    private exportImportService: ExportImportService,
  ) {}

  @Get('data-sources')
  @ApiOperation({ summary: 'Get all data sources' })
  async findAllDataSources(@Request() req) {
    return this.knowledgeBaseService.findAllDataSources(req.user.organizationId);
  }

  @Get('data-sources/:id')
  @ApiOperation({ summary: 'Get data source by ID' })
  async findOneDataSource(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.findOneDataSource(id, req.user.organizationId);
  }

  @Post('data-sources')
  @ApiOperation({ summary: 'Create data source' })
  async createDataSource(@Body() createDto: CreateDataSourceDto, @Request() req) {
    return this.knowledgeBaseService.createDataSource(createDto, req.user.organizationId);
  }

  @Put('data-sources/:id')
  @ApiOperation({ summary: 'Update data source' })
  async updateDataSource(@Param('id') id: string, @Body() updateDto: UpdateDataSourceDto, @Request() req) {
    return this.knowledgeBaseService.updateDataSource(id, updateDto, req.user.organizationId);
  }

  @Delete('data-sources/:id')
  @ApiOperation({ summary: 'Delete data source' })
  async removeDataSource(@Param('id') id: string, @Request() req) {
    // Get all documents associated with this data source
    const documents = await this.knowledgeBaseService.findAllDocuments(req.user.organizationId, id);
    
    let totalVectorsDeleted = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Delete vectors for all documents in this data source
    for (const doc of documents) {
      try {
        const result = await this.vectorStoreService.deleteDocumentVectors(doc.id);
        totalVectorsDeleted += result.deleted;
        successCount++;
      } catch (error) {
        console.error(`Failed to delete vectors for document ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    // Delete data source from database (will cascade to documents and chunks)
    await this.knowledgeBaseService.removeDataSource(id, req.user.organizationId);
    
    return {
      message: 'Data source deleted successfully',
      documentsProcessed: documents.length,
      vectorsDeleted: totalVectorsDeleted,
      successful: successCount,
      failed: errorCount,
    };
  }

  @Post('data-sources/:id/sync')
  @ApiOperation({ summary: 'Trigger sync for data source' })
  async syncDataSource(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.syncDataSource(id, req.user.organizationId);
  }

  // Document endpoints
  @Get('documents')
  @ApiOperation({ summary: 'Get all documents' })
  async findAllDocuments(@Request() req, @Query('dataSourceId') dataSourceId?: string) {
    return this.knowledgeBaseService.findAllDocuments(req.user.organizationId, dataSourceId);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document by ID' })
  async findOneDocument(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.findOneDocument(id, req.user.organizationId);
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
        dataSourceId: {
          type: 'string',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept PDF, text, and markdown files
      const allowedMimeTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only PDF, TXT, and MD files are allowed'), false);
      }
    },
  }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('dataSourceId') dataSourceId: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!title) {
      // Use original filename as title if not provided
      title = file.originalname;
    }

    return this.documentProcessorService.processDocument(
      file,
      req.user.organizationId,
      title,
      dataSourceId,
    );
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete document' })
  async removeDocument(@Param('id') id: string, @Request() req) {
    let vectorsDeleted = 0;
    
    // Delete vectors from Qdrant first
    try {
      const result = await this.vectorStoreService.deleteDocumentVectors(id);
      vectorsDeleted = result.deleted;
    } catch (error) {
      // Log but don't fail if vector deletion fails
      console.error(`Failed to delete vectors for document ${id}:`, error);
    }
    
    // Delete document from database (will cascade to chunks)
    await this.knowledgeBaseService.removeDocument(id, req.user.organizationId);
    
    return { 
      message: 'Document deleted successfully',
      vectorsDeleted,
    };
  }

  @Get('documents/:id/chunks')
  @ApiOperation({ summary: 'Get document chunks' })
  async getDocumentChunks(@Param('id') id: string, @Request() req) {
    return this.knowledgeBaseService.getDocumentChunks(id, req.user.organizationId);
  }

  @Post('documents/:id/index')
  @ApiOperation({ summary: 'Generate embeddings and index document in vector store' })
  async indexDocument(@Param('id') id: string, @Request() req) {
    await this.vectorStoreService.indexDocument(id, req.user.organizationId);
    return { message: 'Document indexed successfully' };
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search across documents' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async searchDocuments(
    @Body('query') query: string,
    @Query('limit') limit?: number,
    @Query('threshold') threshold?: number,
    @Request() req?,
  ) {
    if (!query) {
      throw new BadRequestException('Query is required');
    }

    const results = await this.vectorStoreService.searchSimilar(
      query,
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 5,
      threshold ? parseFloat(threshold.toString()) : 0.7,
    );

    return results;
  }

  @Get('vector-store/info')
  @ApiOperation({ summary: 'Get vector store collection information' })
  async getVectorStoreInfo() {
    return this.vectorStoreService.getCollectionInfo();
  }

  @Post('documents/reindex-all')
  @ApiOperation({ summary: 'Re-index all documents in the vector store' })
  async reindexAllDocuments(@Request() req) {
    const documents = await this.knowledgeBaseService.findAllDocuments(req.user.organizationId);
    
    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        await this.vectorStoreService.indexDocument(doc.id, req.user.organizationId);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    return {
      message: `Re-indexing completed`,
      total: documents.length,
      successful: successCount,
      failed: errorCount,
    };
  }

  @Get('analytics/document-stats')
  @ApiOperation({ summary: 'Get document usage statistics' })
  async getDocumentStats(@Request() req, @Query('limit') limit?: number) {
    if (limit) {
      return this.analyticsService.getTopDocuments(req.user.organizationId, parseInt(limit.toString()));
    }
    return this.analyticsService.getDocumentStats(req.user.organizationId);
  }

  @Get('documents/:id/chunk/:chunkId')
  @ApiOperation({ summary: 'Get specific chunk content' })
  async getChunkContent(
    @Param('id') documentId: string,
    @Param('chunkId') chunkId: string,
    @Request() req,
  ) {
    // Verify document belongs to organization
    await this.knowledgeBaseService.findOneDocument(documentId, req.user.organizationId);
    
    const chunks = await this.knowledgeBaseService.getDocumentChunks(documentId, req.user.organizationId);
    const chunk = chunks.find(c => c.id === chunkId);
    
    if (!chunk) {
      throw new BadRequestException('Chunk not found');
    }
    
    return chunk;
  }

  @Post('search/hybrid')
  @ApiOperation({ summary: 'Hybrid search (semantic + keyword)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'semanticWeight', required: false, type: Number })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async hybridSearch(
    @Body('query') query: string,
    @Query('limit') limit?: number,
    @Query('semanticWeight') semanticWeight?: number,
    @Query('threshold') threshold?: number,
    @Request() req?,
  ) {
    if (!query) {
      throw new BadRequestException('Query is required');
    }

    const results = await this.hybridSearchService.hybridSearch(
      query,
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 10,
      semanticWeight ? parseFloat(semanticWeight.toString()) : 0.7,
      threshold ? parseFloat(threshold.toString()) : 0.6,
    );

    // Record search
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.hybridScore, 0) / results.length
      : 0;
    
    this.searchHistoryService.recordSearch(
      query,
      req.user.organizationId,
      results.length,
      req.user.userId,
      avgScore,
    );

    return results;
  }

  @Get('search/popular')
  @ApiOperation({ summary: 'Get popular search queries' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularQueries(@Request() req, @Query('limit') limit?: number) {
    return this.searchHistoryService.getPopularQueries(
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('search/recent')
  @ApiOperation({ summary: 'Get recent search queries' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentSearches(@Request() req, @Query('limit') limit?: number) {
    return this.searchHistoryService.getRecentSearches(
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('search/stats')
  @ApiOperation({ summary: 'Get search statistics' })
  async getSearchStats(@Request() req) {
    return this.searchHistoryService.getSearchStats(req.user.organizationId);
  }

  @Put('documents/:id/tags')
  @ApiOperation({ summary: 'Update document tags' })
  async updateDocumentTags(
    @Param('id') id: string,
    @Body('tags') tags: string[],
    @Request() req,
  ) {
    const document = await this.knowledgeBaseService.findOneDocument(id, req.user.organizationId);
    document.tags = tags;
    await this.knowledgeBaseService.updateDocument(document);
    return document;
  }

  @Get('documents/:id/similar')
  @ApiOperation({ summary: 'Find similar documents' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findSimilarDocuments(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.documentSimilarityService.findSimilarDocuments(
      id,
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 5,
    );
  }

  @Get('documents/duplicates/detect')
  @ApiOperation({ summary: 'Detect potential duplicate documents' })
  async detectDuplicates(@Request() req) {
    return this.documentSimilarityService.findDuplicates(req.user.organizationId);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get query suggestions' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getQuerySuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.querySuggestionsService.getSuggestions(
      query,
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 5,
    );
  }

  @Get('search/related')
  @ApiOperation({ summary: 'Get related queries' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRelatedQueries(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Request() req?,
  ) {
    return this.querySuggestionsService.getRelatedQueries(
      query,
      req.user.organizationId,
      limit ? parseInt(limit.toString()) : 5,
    );
  }

  @Post('export')
  @ApiOperation({ summary: 'Export knowledge base' })
  async exportKnowledgeBase(@Request() req) {
    return this.exportImportService.exportKnowledgeBase(req.user.organizationId);
  }

  @Get('export/stats')
  @ApiOperation({ summary: 'Get export statistics' })
  async getExportStats(@Request() req) {
    return this.exportImportService.getExportStats(req.user.organizationId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import knowledge base' })
  @ApiBody({ description: 'Export data JSON' })
  async importKnowledgeBase(
    @Body() exportData: any,
    @Query('skipExisting') skipExisting?: boolean,
    @Query('updateExisting') updateExisting?: boolean,
    @Request() req?,
  ) {
    return this.exportImportService.importKnowledgeBase(
      exportData,
      req.user.organizationId,
      { skipExisting, updateExisting },
    );
  }

  @Post('vector-store/cleanup-orphaned')
  @ApiOperation({ summary: 'Clean up orphaned vectors from the vector store' })
  async cleanupOrphanedVectors(@Request() req) {
    return this.vectorStoreService.cleanupOrphanedVectors(req.user.organizationId);
  }

  @Get('vector-store/document-ids')
  @ApiOperation({ summary: 'Get all document IDs in vector store' })
  async getVectorStoreDocumentIds(@Request() req) {
    const documentIds = await this.vectorStoreService.getVectorStoreDocumentIds(req.user.organizationId);
    return {
      count: documentIds.length,
      documentIds,
    };
  }
}
