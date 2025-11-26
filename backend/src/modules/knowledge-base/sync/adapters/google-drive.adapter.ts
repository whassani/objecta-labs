import { Injectable, Logger } from '@nestjs/common';
import { BaseSyncAdapter, SyncDocument, SyncConfig } from '../base-sync-adapter.interface';
import { google, drive_v3 } from 'googleapis';

/**
 * Google Drive sync adapter
 * Supports OAuth2 authentication
 */
@Injectable()
export class GoogleDriveSyncAdapter extends BaseSyncAdapter {
  private readonly logger = new Logger(GoogleDriveSyncAdapter.name);

  getAdapterName(): string {
    return 'Google Drive';
  }

  getRequiredCredentials(): string[] {
    return ['accessToken', 'refreshToken', 'clientId', 'clientSecret'];
  }

  validateCredentials(credentials: any): boolean {
    const required = this.getRequiredCredentials();
    return required.every(field => credentials[field]);
  }

  getConfigSchema(): any {
    return {
      folderId: {
        type: 'string',
        description: 'Google Drive folder ID to sync (optional, syncs all if not provided)',
        required: false,
      },
      includeSharedDrives: {
        type: 'boolean',
        description: 'Include shared drives',
        default: false,
      },
      fileTypes: {
        type: 'array',
        description: 'File types to sync (e.g., ["document", "pdf", "text"])',
        default: ['document', 'pdf'],
      },
    };
  }

  async testConnection(credentials: any, config: any): Promise<boolean> {
    try {
      const drive = this.getDriveClient(credentials);
      await drive.files.list({ pageSize: 1 });
      return true;
    } catch (error) {
      this.logger.error('Google Drive connection test failed:', error);
      return false;
    }
  }

  async fetchDocuments(
    credentials: any,
    config: SyncConfig & { folderId?: string; includeSharedDrives?: boolean; fileTypes?: string[] },
  ): Promise<SyncDocument[]> {
    this.logger.log('Fetching documents from Google Drive');
    const drive = this.getDriveClient(credentials);
    const documents: SyncDocument[] = [];

    try {
      // Build query
      let query = this.buildQuery(config);

      // If last sync timestamp is provided, only fetch modified files
      if (config.lastSyncTimestamp) {
        const isoDate = config.lastSyncTimestamp.toISOString();
        query += ` and modifiedTime > '${isoDate}'`;
      }

      // Fetch files
      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime, webViewLink, size, description)',
        pageSize: config.maxDocuments || 100,
        supportsAllDrives: config.includeSharedDrives || false,
        includeItemsFromAllDrives: config.includeSharedDrives || false,
      });

      const files = response.data.files || [];
      this.logger.log(`Found ${files.length} files in Google Drive`);

      // Process each file
      for (const file of files) {
        try {
          const content = await this.extractFileContent(drive, file);
          if (content) {
            documents.push({
              externalId: file.id!,
              title: file.name || 'Untitled',
              content,
              contentType: this.mapMimeType(file.mimeType || ''),
              url: file.webViewLink || '',
              lastModified: new Date(file.modifiedTime || new Date()),
              metadata: {
                mimeType: file.mimeType,
                size: file.size,
                description: file.description,
              },
            });
          }
        } catch (error) {
          this.logger.error(`Error processing file ${file.name}:`, error);
        }
      }

      this.logger.log(`Successfully processed ${documents.length} documents from Google Drive`);
      return documents;
    } catch (error) {
      this.logger.error('Error fetching documents from Google Drive:', error);
      throw error;
    }
  }

  private getDriveClient(credentials: any): drive_v3.Drive {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  private buildQuery(config: any): string {
    let query = "trashed = false";

    // Filter by folder
    if (config.folderId) {
      query += ` and '${config.folderId}' in parents`;
    }

    // Filter by file types
    if (config.fileTypes && config.fileTypes.length > 0) {
      const mimeTypes = config.fileTypes.map((type: string) => this.getMimeTypeForFileType(type));
      const mimeQuery = mimeTypes.map((mime: string) => `mimeType='${mime}'`).join(' or ');
      query += ` and (${mimeQuery})`;
    }

    return query;
  }

  private getMimeTypeForFileType(fileType: string): string {
    const mimeTypeMap: Record<string, string> = {
      document: 'application/vnd.google-apps.document',
      pdf: 'application/pdf',
      text: 'text/plain',
      spreadsheet: 'application/vnd.google-apps.spreadsheet',
      presentation: 'application/vnd.google-apps.presentation',
    };
    return mimeTypeMap[fileType] || fileType;
  }

  private mapMimeType(googleMimeType: string): string {
    const mimeTypeMap: Record<string, string> = {
      'application/vnd.google-apps.document': 'text/plain',
      'application/pdf': 'application/pdf',
      'text/plain': 'text/plain',
      'text/markdown': 'text/markdown',
    };
    return mimeTypeMap[googleMimeType] || 'text/plain';
  }

  private async extractFileContent(drive: drive_v3.Drive, file: drive_v3.Schema$File): Promise<string | null> {
    try {
      // Google Docs - export as plain text
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const response = await drive.files.export({
          fileId: file.id!,
          mimeType: 'text/plain',
        }, { responseType: 'text' });
        return response.data as string;
      }

      // PDF or text files - download directly
      if (file.mimeType === 'application/pdf' || file.mimeType?.startsWith('text/')) {
        const response = await drive.files.get({
          fileId: file.id!,
          alt: 'media',
        }, { responseType: 'text' });
        return response.data as string;
      }

      // Unsupported file type
      this.logger.warn(`Unsupported file type: ${file.mimeType} for file ${file.name}`);
      return null;
    } catch (error) {
      this.logger.error(`Error extracting content from file ${file.name}:`, error);
      return null;
    }
  }
}
