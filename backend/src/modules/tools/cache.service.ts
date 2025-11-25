import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory cache service for performance optimization
 * In production, consider using Redis for distributed caching
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly defaultTTL = 60000; // 1 minute default

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache HIT: ${key}`);
    return cached.data as T;
  }

  /**
   * Set cached value with TTL
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache DELETE: ${key}`);
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.logger.debug(`Cache DELETE pattern '${pattern}': ${count} keys`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache CLEARED: ${size} keys`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cache CLEANUP: ${cleaned} expired keys`);
    }
  }

  /**
   * Get or compute cached value
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    this.logger.debug(`Cache MISS: ${key}, fetching...`);
    const data = await fetchFn();
    this.set(key, data, ttl);
    
    return data;
  }
}

/**
 * Cache key builders for consistent naming
 */
export class CacheKeys {
  static tool(toolId: string, orgId: string): string {
    return `tool:${orgId}:${toolId}`;
  }

  static toolsList(orgId: string): string {
    return `tools:${orgId}:list`;
  }

  static toolMetrics(toolId: string, orgId: string): string {
    return `metrics:${orgId}:${toolId}`;
  }

  static orgStats(orgId: string, startDate?: string, endDate?: string): string {
    return `stats:${orgId}:${startDate || 'all'}:${endDate || 'now'}`;
  }

  static timeSeries(orgId: string, toolId: string | undefined, days: number): string {
    return `timeseries:${orgId}:${toolId || 'all'}:${days}`;
  }

  static errorBreakdown(orgId: string, toolId: string | undefined, days: number): string {
    return `errors:${orgId}:${toolId || 'all'}:${days}`;
  }

  static testHistory(toolId: string, limit: number): string {
    return `history:${toolId}:${limit}`;
  }

  static environments(toolId: string): string {
    return `env:${toolId}`;
  }

  static versions(toolId: string, limit: number): string {
    return `versions:${toolId}:${limit}`;
  }
}
