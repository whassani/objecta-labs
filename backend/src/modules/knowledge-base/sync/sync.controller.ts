import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DataSourceSyncService } from './data-source-sync.service';
import { SyncSchedulerService } from './sync-scheduler.service';

@ApiTags('knowledge-base-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge-base/sync')
export class SyncController {
  constructor(
    private syncService: DataSourceSyncService,
    private schedulerService: SyncSchedulerService,
  ) {}

  @Get('supported-sources')
  @ApiOperation({ summary: 'Get list of supported data source types' })
  getSupportedSources() {
    return this.syncService.getSupportedSourceTypes();
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test connection to a data source' })
  async testConnection(
    @Body('sourceType') sourceType: string,
    @Body('credentials') credentials: any,
    @Body('config') config: any,
  ) {
    const isValid = await this.syncService.testConnection(sourceType, credentials, config);
    return { 
      success: isValid,
      message: isValid ? 'Connection successful' : 'Connection failed'
    };
  }

  @Post('data-sources/:id')
  @ApiOperation({ summary: 'Sync a specific data source' })
  async syncDataSource(@Param('id') id: string, @Request() req) {
    const result = await this.syncService.syncDataSource(id, req.user.organizationId);
    return result;
  }

  @Post('organization')
  @ApiOperation({ summary: 'Sync all data sources in organization' })
  async syncOrganization(@Request() req) {
    await this.schedulerService.triggerOrganizationSync(req.user.organizationId);
    return { message: 'Organization sync triggered' };
  }

  @Get('adapters/:sourceType/schema')
  @ApiOperation({ summary: 'Get configuration schema for a data source type' })
  getAdapterSchema(@Param('sourceType') sourceType: string) {
    const adapter = this.syncService.getAdapter(sourceType);
    if (!adapter) {
      return { error: 'Adapter not found' };
    }

    return {
      sourceType,
      name: adapter.getAdapterName(),
      requiredCredentials: adapter.getRequiredCredentials(),
      configSchema: adapter.getConfigSchema(),
    };
  }
}
