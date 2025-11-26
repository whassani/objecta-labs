/**
 * Base interface for all data source sync adapters
 */
export interface SyncResult {
  success: boolean;
  documentsProcessed: number;
  documentsAdded: number;
  documentsUpdated: number;
  documentsDeleted: number;
  errors: string[];
  lastSyncTimestamp: Date;
}

export interface SyncDocument {
  externalId: string;
  title: string;
  content: string;
  contentType: string;
  url: string;
  lastModified: Date;
  metadata: Record<string, any>;
  tags?: string[];
  category?: string;
}

export interface SyncConfig {
  includePatterns?: string[];
  excludePatterns?: string[];
  maxDocuments?: number;
  syncDeletes?: boolean;
  lastSyncTimestamp?: Date;
}

export abstract class BaseSyncAdapter {
  /**
   * Test connection to the data source
   */
  abstract testConnection(credentials: any, config: any): Promise<boolean>;

  /**
   * Fetch documents from the data source
   */
  abstract fetchDocuments(
    credentials: any,
    config: SyncConfig,
  ): Promise<SyncDocument[]>;

  /**
   * Get the display name for this adapter
   */
  abstract getAdapterName(): string;

  /**
   * Get required credential fields for this adapter
   */
  abstract getRequiredCredentials(): string[];

  /**
   * Validate credentials format
   */
  abstract validateCredentials(credentials: any): boolean;

  /**
   * Get configuration schema for this adapter
   */
  abstract getConfigSchema(): any;
}
