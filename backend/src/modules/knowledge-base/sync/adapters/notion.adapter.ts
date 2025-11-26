import { Injectable, Logger } from '@nestjs/common';
import { BaseSyncAdapter, SyncDocument, SyncConfig } from '../base-sync-adapter.interface';
import { Client } from '@notionhq/client';

/**
 * Notion sync adapter
 * Supports integration tokens
 */
@Injectable()
export class NotionSyncAdapter extends BaseSyncAdapter {
  private readonly logger = new Logger(NotionSyncAdapter.name);

  getAdapterName(): string {
    return 'Notion';
  }

  getRequiredCredentials(): string[] {
    return ['integrationToken'];
  }

  validateCredentials(credentials: any): boolean {
    return !!credentials.integrationToken;
  }

  getConfigSchema(): any {
    return {
      databaseId: {
        type: 'string',
        description: 'Notion database ID to sync (optional, syncs all accessible pages if not provided)',
        required: false,
      },
      includeArchived: {
        type: 'boolean',
        description: 'Include archived pages',
        default: false,
      },
    };
  }

  async testConnection(credentials: any, config: any): Promise<boolean> {
    try {
      const notion = this.getNotionClient(credentials);
      await notion.users.me({});
      return true;
    } catch (error) {
      this.logger.error('Notion connection test failed:', error);
      return false;
    }
  }

  async fetchDocuments(
    credentials: any,
    config: SyncConfig & { databaseId?: string; includeArchived?: boolean },
  ): Promise<SyncDocument[]> {
    this.logger.log('Fetching documents from Notion');
    const notion = this.getNotionClient(credentials);
    const documents: SyncDocument[] = [];

    try {
      let pages: any[] = [];

      // If database ID is provided, query that database
      if (config.databaseId) {
        const response = await notion.databases.query({
          database_id: config.databaseId,
          page_size: config.maxDocuments || 100,
          filter: config.includeArchived ? undefined : {
            property: 'archived',
            checkbox: {
              equals: false,
            },
          },
        });
        pages = response.results;
      } else {
        // Otherwise, search for all pages
        const response = await notion.search({
          filter: {
            property: 'object',
            value: 'page',
          },
          page_size: config.maxDocuments || 100,
        });
        pages = response.results.filter((p: any) => 
          config.includeArchived || !p.archived
        );
      }

      this.logger.log(`Found ${pages.length} pages in Notion`);

      // Process each page
      for (const page of pages) {
        try {
          const content = await this.extractPageContent(notion, page.id);
          const title = this.extractTitle(page);

          documents.push({
            externalId: page.id,
            title,
            content,
            contentType: 'text/plain',
            url: page.url,
            lastModified: new Date(page.last_edited_time),
            metadata: {
              createdTime: page.created_time,
              lastEditedBy: page.last_edited_by,
              icon: page.icon,
              cover: page.cover,
            },
          });
        } catch (error) {
          this.logger.error(`Error processing Notion page ${page.id}:`, error);
        }
      }

      this.logger.log(`Successfully processed ${documents.length} documents from Notion`);
      return documents;
    } catch (error) {
      this.logger.error('Error fetching documents from Notion:', error);
      throw error;
    }
  }

  private getNotionClient(credentials: any): Client {
    return new Client({
      auth: credentials.integrationToken,
    });
  }

  private extractTitle(page: any): string {
    // Try to get title from properties
    if (page.properties) {
      for (const [key, value] of Object.entries(page.properties)) {
        const prop = value as any;
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          return prop.title.map((t: any) => t.plain_text).join('');
        }
      }
    }

    // Fallback to page ID
    return `Notion Page ${page.id}`;
  }

  private async extractPageContent(notion: Client, pageId: string): Promise<string> {
    try {
      const blocks = await this.getBlocks(notion, pageId);
      return this.blocksToText(blocks);
    } catch (error) {
      this.logger.error(`Error extracting content from page ${pageId}:`, error);
      return '';
    }
  }

  private async getBlocks(notion: Client, blockId: string): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response: any = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
      });

      blocks.push(...response.results);
      cursor = response.next_cursor;
    } while (cursor);

    // Recursively get child blocks
    for (const block of blocks) {
      if (block.has_children) {
        block.children = await this.getBlocks(notion, block.id);
      }
    }

    return blocks;
  }

  private blocksToText(blocks: any[]): string {
    let text = '';

    for (const block of blocks) {
      const blockText = this.blockToText(block);
      if (blockText) {
        text += blockText + '\n\n';
      }

      if (block.children) {
        text += this.blocksToText(block.children);
      }
    }

    return text.trim();
  }

  private blockToText(block: any): string {
    const type = block.type;
    const data = block[type];

    if (!data) return '';

    // Extract rich text
    if (data.rich_text) {
      return data.rich_text.map((t: any) => t.plain_text).join('');
    }

    // Handle specific block types
    switch (type) {
      case 'code':
        return data.rich_text?.map((t: any) => t.plain_text).join('') || '';
      case 'equation':
        return data.expression || '';
      case 'divider':
        return '---';
      default:
        return '';
    }
  }
}
