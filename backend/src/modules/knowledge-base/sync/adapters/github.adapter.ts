import { Injectable, Logger } from '@nestjs/common';
import { BaseSyncAdapter, SyncDocument, SyncConfig } from '../base-sync-adapter.interface';
import { Octokit } from '@octokit/rest';

/**
 * GitHub sync adapter
 * Supports personal access tokens
 */
@Injectable()
export class GitHubSyncAdapter extends BaseSyncAdapter {
  private readonly logger = new Logger(GitHubSyncAdapter.name);

  getAdapterName(): string {
    return 'GitHub';
  }

  getRequiredCredentials(): string[] {
    return ['accessToken'];
  }

  validateCredentials(credentials: any): boolean {
    return !!credentials.accessToken;
  }

  getConfigSchema(): any {
    return {
      owner: {
        type: 'string',
        description: 'Repository owner (username or organization)',
        required: true,
      },
      repo: {
        type: 'string',
        description: 'Repository name',
        required: true,
      },
      branch: {
        type: 'string',
        description: 'Branch to sync',
        default: 'main',
      },
      path: {
        type: 'string',
        description: 'Path within repository to sync (e.g., "docs/")',
        required: false,
      },
      fileExtensions: {
        type: 'array',
        description: 'File extensions to sync (e.g., [".md", ".txt"])',
        default: ['.md', '.txt', '.mdx'],
      },
    };
  }

  async testConnection(credentials: any, config: any): Promise<boolean> {
    try {
      const octokit = this.getOctokit(credentials);
      await octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      this.logger.error('GitHub connection test failed:', error);
      return false;
    }
  }

  async fetchDocuments(
    credentials: any,
    config: SyncConfig & { owner: string; repo: string; branch?: string; path?: string; fileExtensions?: string[] },
  ): Promise<SyncDocument[]> {
    this.logger.log('Fetching documents from GitHub');
    const octokit = this.getOctokit(credentials);
    const documents: SyncDocument[] = [];

    if (!config.owner || !config.repo) {
      throw new Error('GitHub sync requires owner and repo configuration');
    }

    const branch = config.branch || 'main';
    const path = config.path || '';
    const fileExtensions = config.fileExtensions || ['.md', '.txt', '.mdx'];

    try {
      // Get repository tree
      const { data: tree } = await octokit.git.getTree({
        owner: config.owner,
        repo: config.repo,
        tree_sha: branch,
        recursive: 'true',
      });

      // Filter files by path and extension
      const files = tree.tree.filter((item: any) => {
        if (item.type !== 'blob') return false;
        if (path && !item.path?.startsWith(path)) return false;
        return fileExtensions.some(ext => item.path?.endsWith(ext));
      });

      this.logger.log(`Found ${files.length} files in GitHub repository`);

      // Fetch content for each file
      const limit = Math.min(files.length, config.maxDocuments || 100);
      for (let i = 0; i < limit; i++) {
        const file = files[i];
        try {
          const { data: fileData } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: file.path!,
            ref: branch,
          });

          if ('content' in fileData && fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            
            documents.push({
              externalId: file.sha!,
              title: this.getFileName(file.path!),
              content,
              contentType: this.getContentType(file.path!),
              url: fileData.html_url || '',
              lastModified: new Date(), // GitHub tree doesn't include timestamps, would need commits API
              metadata: {
                path: file.path,
                size: file.size,
                sha: file.sha,
                repo: `${config.owner}/${config.repo}`,
                branch,
              },
            });
          }
        } catch (error) {
          this.logger.error(`Error processing file ${file.path}:`, error);
        }
      }

      this.logger.log(`Successfully processed ${documents.length} documents from GitHub`);
      return documents;
    } catch (error) {
      this.logger.error('Error fetching documents from GitHub:', error);
      throw error;
    }
  }

  private getOctokit(credentials: any): Octokit {
    return new Octokit({
      auth: credentials.accessToken,
    });
  }

  private getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  private getContentType(path: string): string {
    if (path.endsWith('.md') || path.endsWith('.mdx')) {
      return 'text/markdown';
    }
    if (path.endsWith('.txt')) {
      return 'text/plain';
    }
    return 'text/plain';
  }
}
