import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

// Sync services
import { SyncController } from './sync/sync.controller';
import { DataSourceSyncService } from './sync/data-source-sync.service';
import { SyncSchedulerService } from './sync/sync-scheduler.service';
import { GoogleDriveSyncAdapter } from './sync/adapters/google-drive.adapter';
import { ConfluenceSyncAdapter } from './sync/adapters/confluence.adapter';
import { GitHubSyncAdapter } from './sync/adapters/github.adapter';
import { NotionSyncAdapter } from './sync/adapters/notion.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSource, Document, DocumentChunk, DocumentCollection]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [KnowledgeBaseController, SyncController],
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
    // Sync services
    DataSourceSyncService,
    SyncSchedulerService,
    GoogleDriveSyncAdapter,
    ConfluenceSyncAdapter,
    GitHubSyncAdapter,
    NotionSyncAdapter,
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
    DataSourceSyncService,
    SyncSchedulerService,
  ],
})
export class KnowledgeBaseModule {}
