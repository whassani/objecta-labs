import { Injectable, Logger } from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';

export interface QuerySuggestion {
  query: string;
  score: number;
  reason: string; // 'popular', 'recent', 'autocomplete'
}

@Injectable()
export class QuerySuggestionsService {
  private readonly logger = new Logger(QuerySuggestionsService.name);

  // Common query templates
  private queryTemplates = [
    'How to {topic}',
    'What is {topic}',
    'Configure {topic}',
    'Setup {topic}',
    '{topic} documentation',
    '{topic} tutorial',
    '{topic} examples',
    'Troubleshoot {topic}',
    'Best practices for {topic}',
  ];

  constructor(private searchHistoryService: SearchHistoryService) {}

  /**
   * Get query suggestions based on partial input
   */
  async getSuggestions(
    partialQuery: string,
    organizationId: string,
    limit: number = 5,
  ): Promise<QuerySuggestion[]> {
    const suggestions = new Map<string, QuerySuggestion>();

    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const partial = partialQuery.toLowerCase().trim();

    // 1. Get popular queries that match
    const popular = this.searchHistoryService.getPopularQueries(organizationId, 20);
    for (const query of popular) {
      if (query.query.toLowerCase().includes(partial)) {
        suggestions.set(query.query, {
          query: query.query,
          score: query.count * 2, // Weight popular queries
          reason: 'popular',
        });
      }
    }

    // 2. Get recent queries that match
    const recent = this.searchHistoryService.getRecentSearches(organizationId, 20);
    for (const search of recent) {
      if (search.query.toLowerCase().includes(partial) && !suggestions.has(search.query)) {
        suggestions.set(search.query, {
          query: search.query,
          score: 1,
          reason: 'recent',
        });
      }
    }

    // 3. Generate template-based suggestions
    const templateSuggestions = this.generateTemplateSuggestions(partial);
    for (const suggestion of templateSuggestions) {
      if (!suggestions.has(suggestion.query)) {
        suggestions.set(suggestion.query, suggestion);
      }
    }

    // Sort by score and return top N
    return Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate suggestions from templates
   */
  private generateTemplateSuggestions(topic: string): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = [];

    for (const template of this.queryTemplates) {
      const query = template.replace('{topic}', topic);
      suggestions.push({
        query,
        score: 0.5,
        reason: 'autocomplete',
      });
    }

    return suggestions;
  }

  /**
   * Expand query with synonyms and related terms
   */
  expandQuery(query: string): string[] {
    const expansions: string[] = [query];

    // Simple synonym mapping (can be enhanced with NLP library)
    const synonyms: Record<string, string[]> = {
      'auth': ['authentication', 'authorization', 'login', 'access'],
      'config': ['configuration', 'setup', 'settings'],
      'error': ['issue', 'problem', 'bug', 'failure'],
      'api': ['endpoint', 'service', 'interface'],
      'db': ['database', 'data store', 'storage'],
      'user': ['account', 'profile', 'member'],
    };

    const words = query.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (synonyms[word]) {
        for (const synonym of synonyms[word]) {
          const expanded = query.replace(new RegExp(word, 'gi'), synonym);
          if (expanded !== query) {
            expansions.push(expanded);
          }
        }
      }
    }

    return expansions.slice(0, 5); // Limit expansions
  }

  /**
   * Get related queries based on co-occurrence
   */
  getRelatedQueries(query: string, organizationId: string, limit: number = 5): string[] {
    const popular = this.searchHistoryService.getPopularQueries(organizationId, 50);
    
    // Simple word-based similarity
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const related: Array<{ query: string; overlap: number }> = [];

    for (const pop of popular) {
      if (pop.query.toLowerCase() === query.toLowerCase()) continue;

      const popWords = new Set(pop.query.toLowerCase().split(/\s+/));
      const intersection = new Set([...queryWords].filter(w => popWords.has(w)));
      
      if (intersection.size > 0) {
        related.push({
          query: pop.query,
          overlap: intersection.size,
        });
      }
    }

    return related
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, limit)
      .map(r => r.query);
  }
}
