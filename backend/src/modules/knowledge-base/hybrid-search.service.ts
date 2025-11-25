import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DocumentChunk } from './entities/document-chunk.entity';
import { VectorStoreService, SearchResult } from './vector-store.service';

export interface HybridSearchResult extends SearchResult {
  keywordScore?: number;
  semanticScore: number;
  hybridScore: number;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}

@Injectable()
export class HybridSearchService {
  private readonly logger = new Logger(HybridSearchService.name);

  constructor(
    @InjectRepository(DocumentChunk)
    private documentChunksRepository: Repository<DocumentChunk>,
    private vectorStoreService: VectorStoreService,
  ) {}

  /**
   * Hybrid search: combines keyword (BM25-like) and semantic search
   */
  async hybridSearch(
    query: string,
    organizationId: string,
    limit: number = 10,
    semanticWeight: number = 0.7, // 70% semantic, 30% keyword
    semanticThreshold: number = 0.6,
  ): Promise<HybridSearchResult[]> {
    this.logger.log(`Hybrid search: "${query}" (semantic weight: ${semanticWeight})`);

    const keywordWeight = 1 - semanticWeight;

    // 1. Semantic search via vector store
    const semanticResults = await this.vectorStoreService.searchSimilar(
      query,
      organizationId,
      limit * 2, // Get more candidates for re-ranking
      semanticThreshold,
    );

    // 2. Keyword search via database (simple text matching)
    const keywordResults = await this.keywordSearch(query, organizationId, limit * 2);

    // 3. Merge and re-rank results
    const mergedResults = this.mergeAndRank(
      semanticResults,
      keywordResults,
      semanticWeight,
      keywordWeight,
    );

    // 4. Return top N results
    return mergedResults.slice(0, limit);
  }

  /**
   * Simple keyword search using PostgreSQL full-text search
   */
  private async keywordSearch(
    query: string,
    organizationId: string,
    limit: number,
  ): Promise<Array<{ chunkId: string; score: number }>> {
    try {
      // Extract keywords (split by space, remove special chars)
      const keywords = query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(k => k.length > 2); // Ignore very short words

      if (keywords.length === 0) {
        return [];
      }

      // Search for chunks containing keywords
      const chunks = await this.documentChunksRepository
        .createQueryBuilder('chunk')
        .innerJoin('chunk.document', 'document')
        .where('document.organizationId = :organizationId', { organizationId })
        .andWhere(
          keywords.map((_, i) => `LOWER(chunk.content) LIKE :keyword${i}`).join(' OR '),
          keywords.reduce((acc, keyword, i) => {
            acc[`keyword${i}`] = `%${keyword}%`;
            return acc;
          }, {}),
        )
        .select(['chunk.id', 'chunk.content'])
        .limit(limit)
        .getMany();

      // Calculate simple keyword matching score
      return chunks.map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        const matchCount = keywords.filter(k => contentLower.includes(k)).length;
        const score = matchCount / keywords.length; // Percentage of keywords matched
        
        return {
          chunkId: chunk.id,
          score,
        };
      });
    } catch (error) {
      this.logger.error(`Keyword search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Merge semantic and keyword results with weighted scoring
   */
  private mergeAndRank(
    semanticResults: SearchResult[],
    keywordResults: Array<{ chunkId: string; score: number }>,
    semanticWeight: number,
    keywordWeight: number,
  ): HybridSearchResult[] {
    const resultMap = new Map<string, HybridSearchResult>();

    // Add semantic results
    for (const result of semanticResults) {
      resultMap.set(result.chunkId, {
        ...result,
        semanticScore: result.score,
        hybridScore: result.score * semanticWeight,
        matchType: 'semantic',
      });
    }

    // Add/merge keyword results
    for (const result of keywordResults) {
      const existing = resultMap.get(result.chunkId);
      
      if (existing) {
        // Both semantic and keyword match - combine scores
        existing.keywordScore = result.score;
        existing.hybridScore = 
          existing.semanticScore * semanticWeight + 
          result.score * keywordWeight;
        existing.matchType = 'hybrid';
      } else {
        // Keyword-only match
        // Note: We don't have full metadata for keyword-only results
        // In production, you'd fetch the chunk details
        resultMap.set(result.chunkId, {
          chunkId: result.chunkId,
          documentId: '', // Would need to fetch
          content: '', // Would need to fetch
          score: result.score,
          semanticScore: 0,
          keywordScore: result.score,
          hybridScore: result.score * keywordWeight,
          matchType: 'keyword',
          metadata: {},
        });
      }
    }

    // Sort by hybrid score (descending)
    return Array.from(resultMap.values())
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(
    query: string,
    organizationId: string,
    limit: number = 5,
  ): Promise<string[]> {
    try {
      // Find chunks with similar content to extract keywords
      const chunks = await this.documentChunksRepository
        .createQueryBuilder('chunk')
        .innerJoin('chunk.document', 'document')
        .where('document.organizationId = :organizationId', { organizationId })
        .andWhere('LOWER(chunk.content) LIKE :query', { query: `%${query.toLowerCase()}%` })
        .select('chunk.content')
        .limit(10)
        .getMany();

      // Extract common phrases (simple implementation)
      const phrases = new Set<string>();
      
      for (const chunk of chunks) {
        // Find sentences containing the query
        const sentences = chunk.content
          .split(/[.!?]+/)
          .filter(s => s.toLowerCase().includes(query.toLowerCase()))
          .map(s => s.trim());
        
        sentences.forEach(s => {
          if (s.length > 10 && s.length < 100) {
            phrases.add(s);
          }
        });
      }

      return Array.from(phrases).slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting suggestions: ${error.message}`);
      return [];
    }
  }
}
