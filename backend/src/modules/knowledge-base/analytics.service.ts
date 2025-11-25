import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

export interface DocumentUsageStats {
  documentId: string;
  documentTitle: string;
  timesUsed: number;
  avgScore: number;
  lastUsed: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  
  // In-memory storage for document usage (could be moved to Redis/DB)
  private documentUsage: Map<string, {
    count: number;
    totalScore: number;
    lastUsed: Date;
  }> = new Map();

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  /**
   * Track document usage from search results
   */
  trackDocumentUsage(sources: Array<{ documentId: string; score: number }>): void {
    for (const source of sources) {
      const existing = this.documentUsage.get(source.documentId) || {
        count: 0,
        totalScore: 0,
        lastUsed: new Date(),
      };

      existing.count += 1;
      existing.totalScore += source.score;
      existing.lastUsed = new Date();

      this.documentUsage.set(source.documentId, existing);
    }

    this.logger.log(`Tracked usage for ${sources.length} documents`);
  }

  /**
   * Get document usage statistics
   */
  async getDocumentStats(organizationId: string): Promise<DocumentUsageStats[]> {
    const documents = await this.documentsRepository.find({
      where: { organizationId },
      select: ['id', 'title'],
    });

    const stats: DocumentUsageStats[] = documents
      .map(doc => {
        const usage = this.documentUsage.get(doc.id);
        if (!usage) return null;

        return {
          documentId: doc.id,
          documentTitle: doc.title,
          timesUsed: usage.count,
          avgScore: usage.totalScore / usage.count,
          lastUsed: usage.lastUsed,
        };
      })
      .filter(s => s !== null)
      .sort((a, b) => b.timesUsed - a.timesUsed);

    return stats;
  }

  /**
   * Get top N most used documents
   */
  async getTopDocuments(organizationId: string, limit: number = 10): Promise<DocumentUsageStats[]> {
    const stats = await this.getDocumentStats(organizationId);
    return stats.slice(0, limit);
  }

  /**
   * Clear analytics data (for testing or reset)
   */
  clearAnalytics(documentId?: string): void {
    if (documentId) {
      this.documentUsage.delete(documentId);
      this.logger.log(`Cleared analytics for document: ${documentId}`);
    } else {
      this.documentUsage.clear();
      this.logger.log('Cleared all analytics data');
    }
  }
}
