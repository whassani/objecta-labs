import { Injectable, Logger } from '@nestjs/common';

export interface SearchHistoryEntry {
  query: string;
  timestamp: Date;
  organizationId: string;
  userId?: string;
  resultsCount: number;
  avgScore?: number;
}

export interface PopularQuery {
  query: string;
  count: number;
  lastSearched: Date;
  avgResults: number;
}

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);
  
  // In-memory storage (consider Redis for production)
  private searchHistory: SearchHistoryEntry[] = [];
  private readonly MAX_HISTORY = 1000; // Keep last 1000 searches

  /**
   * Record a search query
   */
  recordSearch(
    query: string,
    organizationId: string,
    resultsCount: number,
    userId?: string,
    avgScore?: number,
  ): void {
    const entry: SearchHistoryEntry = {
      query,
      timestamp: new Date(),
      organizationId,
      userId,
      resultsCount,
      avgScore,
    };

    this.searchHistory.push(entry);

    // Keep only recent searches
    if (this.searchHistory.length > this.MAX_HISTORY) {
      this.searchHistory = this.searchHistory.slice(-this.MAX_HISTORY);
    }

    this.logger.log(`Recorded search: "${query}" (${resultsCount} results)`);
  }

  /**
   * Get popular queries for an organization
   */
  getPopularQueries(organizationId: string, limit: number = 10): PopularQuery[] {
    const queryMap = new Map<string, { count: number; lastSearched: Date; totalResults: number }>();

    // Aggregate queries
    for (const entry of this.searchHistory) {
      if (entry.organizationId !== organizationId) continue;

      const normalized = entry.query.toLowerCase().trim();
      const existing = queryMap.get(normalized) || {
        count: 0,
        lastSearched: entry.timestamp,
        totalResults: 0,
      };

      existing.count++;
      existing.totalResults += entry.resultsCount;
      if (entry.timestamp > existing.lastSearched) {
        existing.lastSearched = entry.timestamp;
      }

      queryMap.set(normalized, existing);
    }

    // Convert to array and sort by count
    const popular = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        lastSearched: data.lastSearched,
        avgResults: data.totalResults / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return popular;
  }

  /**
   * Get recent searches for an organization
   */
  getRecentSearches(organizationId: string, limit: number = 10): SearchHistoryEntry[] {
    return this.searchHistory
      .filter(entry => entry.organizationId === organizationId)
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get search statistics
   */
  getSearchStats(organizationId: string): {
    totalSearches: number;
    uniqueQueries: number;
    avgResultsPerSearch: number;
    avgScore: number;
  } {
    const orgSearches = this.searchHistory.filter(
      entry => entry.organizationId === organizationId,
    );

    if (orgSearches.length === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultsPerSearch: 0,
        avgScore: 0,
      };
    }

    const uniqueQueries = new Set(orgSearches.map(s => s.query.toLowerCase())).size;
    const totalResults = orgSearches.reduce((sum, s) => sum + s.resultsCount, 0);
    const scoresWithValues = orgSearches.filter(s => s.avgScore !== undefined);
    const totalScore = scoresWithValues.reduce((sum, s) => sum + (s.avgScore || 0), 0);

    return {
      totalSearches: orgSearches.length,
      uniqueQueries,
      avgResultsPerSearch: totalResults / orgSearches.length,
      avgScore: scoresWithValues.length > 0 ? totalScore / scoresWithValues.length : 0,
    };
  }

  /**
   * Clear search history
   */
  clearHistory(organizationId?: string): void {
    if (organizationId) {
      this.searchHistory = this.searchHistory.filter(
        entry => entry.organizationId !== organizationId,
      );
      this.logger.log(`Cleared search history for org: ${organizationId}`);
    } else {
      this.searchHistory = [];
      this.logger.log('Cleared all search history');
    }
  }
}
