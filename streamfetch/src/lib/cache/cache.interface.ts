/**
 * Cache Service Interface
 *
 * Defines the contract for caching implementations.
 * Can be backed by Redis, Memory, or other stores.
 */
export interface CacheService {
  /**
   * Get a value from cache
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  set<T>(key: string, value: T, ttl: number): Promise<void>;

  /**
   * Delete a value from cache
   */
  del(key: string): Promise<void>;

  /**
   * Check if a key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cache entries matching a pattern
   * @param pattern Pattern to match (e.g., "video:*")
   */
  invalidatePattern?(pattern: string): Promise<void>;
}
