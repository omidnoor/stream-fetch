import { CacheService } from './cache.interface';
import { MemoryCache } from './memory.cache';

/**
 * Cache Factory
 *
 * Creates and manages cache service instances.
 * Can be extended to support Redis, Memcached, etc.
 */

let cacheInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheInstance) {
    // For now, use memory cache
    // In production, you would check env vars and use Redis if configured
    cacheInstance = new MemoryCache();

    // Set up cleanup interval for memory cache
    if (cacheInstance instanceof MemoryCache) {
      const memCache = cacheInstance as MemoryCache;
      setInterval(() => {
        memCache.cleanup();
      }, 60000); // Clean up every minute
    }
  }

  return cacheInstance;
}

/**
 * Reset cache instance (useful for testing)
 */
export function resetCacheService(): void {
  cacheInstance = null;
}
