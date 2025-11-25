import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { VectorStoreService } from './vector-store.service';

export interface SimilarDocument {
  documentId: string;
  title: string;
  similarity: number;
  reason: string; // 'content', 'title', 'hash'
}

@Injectable()
export class DocumentSimilarityService {
  private readonly logger = new Logger(DocumentSimilarityService.name);

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Find similar documents using multiple strategies
   */
  async findSimilarDocuments(
    documentId: string,
    organizationId: string,
    limit: number = 5,
  ): Promise<SimilarDocument[]> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, organizationId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const similarDocs = new Map<string, SimilarDocument>();

    // 1. Check for exact duplicates by file hash
    if (document.fileHash) {
      const hashDuplicates = await this.findByHash(document.fileHash, organizationId, documentId);
      hashDuplicates.forEach(doc => {
        similarDocs.set(doc.id, {
          documentId: doc.id,
          title: doc.title,
          similarity: 1.0,
          reason: 'hash',
        });
      });
    }

    // 2. Check for title similarity
    const titleSimilar = await this.findByTitleSimilarity(document.title, organizationId, documentId);
    titleSimilar.forEach(doc => {
      if (!similarDocs.has(doc.id)) {
        similarDocs.set(doc.id, {
          documentId: doc.id,
          title: doc.title,
          similarity: doc.similarity,
          reason: 'title',
        });
      }
    });

    // 3. Check for content similarity using vector search
    if (document.content) {
      const contentSimilar = await this.findByContentSimilarity(
        document.content.substring(0, 1000), // Use first 1000 chars
        organizationId,
        documentId,
        5,
      );
      
      contentSimilar.forEach(doc => {
        if (!similarDocs.has(doc.documentId)) {
          similarDocs.set(doc.documentId, doc);
        }
      });
    }

    // Convert to array and sort by similarity
    return Array.from(similarDocs.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Find documents with same file hash (exact duplicates)
   */
  private async findByHash(
    fileHash: string,
    organizationId: string,
    excludeId: string,
  ): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { fileHash, organizationId },
      select: ['id', 'title'],
    }).then(docs => docs.filter(d => d.id !== excludeId));
  }

  /**
   * Find documents with similar titles
   */
  private async findByTitleSimilarity(
    title: string,
    organizationId: string,
    excludeId: string,
  ): Promise<Array<{ id: string; title: string; similarity: number }>> {
    const allDocs = await this.documentsRepository.find({
      where: { organizationId },
      select: ['id', 'title'],
    });

    const titleLower = title.toLowerCase();
    const results: Array<{ id: string; title: string; similarity: number }> = [];

    for (const doc of allDocs) {
      if (doc.id === excludeId) continue;

      const similarity = this.calculateStringSimilarity(titleLower, doc.title.toLowerCase());
      if (similarity > 0.5) {
        results.push({
          id: doc.id,
          title: doc.title,
          similarity,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * Find documents with similar content using vector search
   */
  private async findByContentSimilarity(
    content: string,
    organizationId: string,
    excludeId: string,
    limit: number,
  ): Promise<SimilarDocument[]> {
    try {
      const results = await this.vectorStoreService.searchSimilar(
        content,
        organizationId,
        limit * 2, // Get more candidates
        0.6, // Lower threshold for similarity detection
      );

      // Group by document and calculate average similarity
      const docScores = new Map<string, { title: string; scores: number[] }>();
      
      for (const result of results) {
        if (result.documentId === excludeId) continue;

        const existing = docScores.get(result.documentId) || {
          title: result.metadata.documentTitle,
          scores: [],
        };
        
        existing.scores.push(result.score);
        docScores.set(result.documentId, existing);
      }

      // Calculate average scores
      const similarDocs: SimilarDocument[] = [];
      for (const [docId, data] of docScores.entries()) {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        if (avgScore > 0.7) {
          similarDocs.push({
            documentId: docId,
            title: data.title,
            similarity: avgScore,
            reason: 'content',
          });
        }
      }

      return similarDocs.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
    } catch (error) {
      this.logger.error(`Error finding content similarity: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find potential duplicate documents across organization
   */
  async findDuplicates(organizationId: string): Promise<Array<{
    originalId: string;
    originalTitle: string;
    duplicates: SimilarDocument[];
  }>> {
    const allDocs = await this.documentsRepository.find({
      where: { organizationId },
      select: ['id', 'title', 'fileHash'],
    });

    const duplicateGroups: Array<{
      originalId: string;
      originalTitle: string;
      duplicates: SimilarDocument[];
    }> = [];

    const processed = new Set<string>();

    for (const doc of allDocs) {
      if (processed.has(doc.id)) continue;

      const similar = await this.findSimilarDocuments(doc.id, organizationId, 10);
      const highSimilarity = similar.filter(s => s.similarity > 0.9);

      if (highSimilarity.length > 0) {
        duplicateGroups.push({
          originalId: doc.id,
          originalTitle: doc.title,
          duplicates: highSimilarity,
        });

        // Mark all as processed
        processed.add(doc.id);
        highSimilarity.forEach(s => processed.add(s.documentId));
      }
    }

    return duplicateGroups;
  }
}
