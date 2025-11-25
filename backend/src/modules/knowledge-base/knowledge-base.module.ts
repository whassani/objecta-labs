import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { DocumentProcessorService } from './document-processor.service';
import { VectorStoreService } from './vector-store.service';
import { AnalyticsService } from './analytics.service';
import { HybridSearchService } from './hybrid-search.service';
import { SearchHistoryService } from './search-history.service';
import { DocumentSimilarityService } from './document-similarity.service';
import { QuerySuggestionsService } from './query-suggestions.service';
import { ExportImportService } from './export-import.service';
import { DataSource } from './entities/data-source.entity';
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';
import { DocumentCollection } from './entities/collection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSource, Document, DocumentChunk, DocumentCollection]),
    ConfigModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    DocumentProcessorService,
    VectorStoreService,
    AnalyticsService,
    HybridSearchService,
    SearchHistoryService,
    DocumentSimilarityService,
    QuerySuggestionsService,
    ExportImportService,
  ],
  exports: [
    KnowledgeBaseService,
    DocumentProcessorService,
    VectorStoreService,
    AnalyticsService,
    HybridSearchService,
    SearchHistoryService,
    DocumentSimilarityService,
    QuerySuggestionsService,
    ExportImportService,
  ],
})
export class KnowledgeBaseModule {}
