import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from '../entities/data-source.entity';
import { DataSourceSyncService } from './data-source-sync.service';

/**
 * Service to schedule and run periodic syncs
 */
@Injectable()
export class SyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
    private syncService: DataSourceSyncService,
  ) {}

  async onModuleInit() {
    this.logger.log('Sync scheduler initialized');
  }

  /**
   * Run every hour to check for data sources that need syncing
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync() {
    this.logger.log('Running hourly sync check');
    await this.syncByFrequency('hourly');
  }

  /**
   * Run daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySync() {
    this.logger.log('Running daily sync check');
    await this.syncByFrequency('daily');
  }

  /**
   * Sync data sources with specific frequency
   */
  private async syncByFrequency(frequency: string): Promise<void> {
    try {
      const dataSources = await this.getDataSourcesToSync(frequency);
      this.logger.log(`Found ${dataSources.length} data sources to sync (${frequency})`);

      for (const dataSource of dataSources) {
        try {
          this.logger.log(`Syncing data source: ${dataSource.name}`);
          await this.syncService.syncDataSource(dataSource.id, dataSource.organizationId);
        } catch (error) {
          this.logger.error(`Failed to sync ${dataSource.name}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in sync scheduler:', error);
    }
  }

  /**
   * Get data sources that need syncing
   */
  private async getDataSourcesToSync(frequency: string): Promise<DataSource[]> {
    const now = new Date();
    const cutoffTime = this.getCutoffTime(frequency);

    return this.dataSourcesRepository.find({
      where: [
        {
          syncFrequency: frequency,
          isEnabled: true,
          lastSyncedAt: LessThan(cutoffTime),
        },
        {
          syncFrequency: frequency,
          isEnabled: true,
          lastSyncedAt: null,
        },
      ],
    });
  }

  /**
   * Calculate cutoff time for sync frequency
   */
  private getCutoffTime(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      default:
        return new Date(0); // Beginning of time
    }
  }

  /**
   * Manually trigger sync for a data source
   */
  async triggerManualSync(dataSourceId: string, organizationId: string): Promise<void> {
    this.logger.log(`Manually triggering sync for data source: ${dataSourceId}`);
    await this.syncService.syncDataSource(dataSourceId, organizationId);
  }

  /**
   * Trigger sync for all data sources in an organization
   */
  async triggerOrganizationSync(organizationId: string): Promise<void> {
    this.logger.log(`Triggering sync for all data sources in organization: ${organizationId}`);
    await this.syncService.syncAllDataSources(organizationId);
  }
}
