import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { ToolExecutorService } from './tool-executor.service';
import { TestHistoryService } from './test-history.service';
import { RetryService } from './retry.service';
import { ResponseTransformService } from './response-transform.service';
import { EnvironmentService } from './environment.service';
import { VersioningService } from './versioning.service';
import { AnalyticsService } from './analytics.service';
import { CacheService } from './cache.service';
import { Tool } from './entities/tool.entity';
import { ToolExecution } from './entities/tool-execution.entity';
import { ToolEnvironment } from './entities/tool-environment.entity';
import { ToolVersion } from './entities/tool-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tool, ToolExecution, ToolEnvironment, ToolVersion])],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    ToolExecutorService,
    TestHistoryService,
    RetryService,
    ResponseTransformService,
    EnvironmentService,
    VersioningService,
    AnalyticsService,
    CacheService,
  ],
  exports: [
    ToolsService,
    ToolExecutorService,
    TestHistoryService,
    RetryService,
    ResponseTransformService,
    EnvironmentService,
    VersioningService,
    AnalyticsService,
  ],
})
export class ToolsModule {}
