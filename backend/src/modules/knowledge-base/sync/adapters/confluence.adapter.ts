import { Injectable, Logger } from '@nestjs/common';
import { BaseSyncAdapter, SyncDocument, SyncConfig } from '../base-sync-adapter.interface';
import axios, { AxiosInstance } from 'axios';

/**
 * Confluence sync adapter
 * Supports basic auth and API tokens
 */
@Injectable()
export class ConfluenceSyncAdapter extends BaseSyncAdapter {
  private readonly logger = new Logger(ConfluenceSyncAdapter.name);

  getAdapterName(): string {
    return 'Confluence';
  }

  getRequiredCredentials(): string[] {
    return ['baseUrl', 'username', 'apiToken'];
  }

  validateCredentials(credentials: any): boolean {
    const required = this.getRequiredCredentials();
    return required.every(field => credentials[field]);
  }

  getConfigSchema(): any {
    return {
      spaceKey: {
        type: 'string',
        description: 'Confluence space key to sync (optional, syncs all spaces if not provided)',
        required: false,
      },
      includeArchived: {
        type: 'boolean',
        description: 'Include archived pages',
        default: false,
      },
      expandContent: {
        type: 'boolean',
        description: 'Expand page content in API calls',
        default: true,
      },
    };
  }

  async testConnection(credentials: any, config: any): Promise<boolean> {
    try {
      const client = this.getConfluenceClient(credentials);
      await client.get('/rest/api/space?limit=1');
      return true;
    } catch (error) {
      this.logger.error('Confluence connection test failed:', error);
      return false;
    }
  }

  async fetchDocuments(
    credentials: any,
    config: SyncConfig & { spaceKey?: string; includeArchived?: boolean; expandContent?: boolean },
  ): Promise<SyncDocument[]> {
    this.logger.log('Fetching documents from Confluence');
    const client = this.getConfluenceClient(credentials);
    const documents: SyncDocument[] = [];

    try {
      // Build CQL query
      let cql = 'type=page';
      
      if (config.spaceKey) {
        cql += ` and space="${config.spaceKey}"`;
      }

      if (!config.includeArchived) {
        cql += ' and status=current';
      }

      if (config.lastSyncTimestamp) {
        const dateStr = config.lastSyncTimestamp.toISOString().split('T')[0];
        cql += ` and lastModified >= "${dateStr}"`;
      }

      // Fetch pages using CQL search
      const searchResponse = await client.get('/rest/api/content/search', {
        params: {
          cql,
          limit: config.maxDocuments || 100,
          expand: 'body.storage,version,space,history.lastUpdated',
        },
      });

      const pages = searchResponse.data.results || [];
      this.logger.log(`Found ${pages.length} pages in Confluence`);

      // Process each page
      for (const page of pages) {
        try {
          const content = this.extractContent(page);
          const pageUrl = `${credentials.baseUrl}/wiki${page._links.webui}`;

          documents.push({
            externalId: page.id,
            title: page.title,
            content,
            contentType: 'text/html',
            url: pageUrl,
            lastModified: new Date(page.version.when),
            metadata: {
              spaceKey: page.space.key,
              spaceName: page.space.name,
              version: page.version.number,
              author: page.version.by?.displayName,
            },
            tags: page.metadata?.labels?.results?.map((l: any) => l.name) || [],
          });
        } catch (error) {
          this.logger.error(`Error processing page ${page.title}:`, error);
        }
      }

      this.logger.log(`Successfully processed ${documents.length} documents from Confluence`);
      return documents;
    } catch (error) {
      this.logger.error('Error fetching documents from Confluence:', error);
      throw error;
    }
  }

  private getConfluenceClient(credentials: any): AxiosInstance {
    return axios.create({
      baseURL: credentials.baseUrl,
      auth: {
        username: credentials.username,
        password: credentials.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  private extractContent(page: any): string {
    // Extract text from Confluence storage format (HTML)
    const storageValue = page.body?.storage?.value || '';
    
    // Remove HTML tags for plain text
    const textContent = storageValue
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    return textContent;
  }
}
