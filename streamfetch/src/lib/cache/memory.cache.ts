import { CacheService } from './cache.interface';

/**
 * In-Memory Cache Implementation
 *
 * Simple cache for development/testing.
 * For production, use Redis or similar distributed cache.
 *
 * EDUCATIONAL NOTE:
 * - Data is stored in a Map (fast lookups)
 * - Each entry has an expiration timestamp
 * - Expired entries are cleaned up on access
 * - Not shared across instances (single-server only)
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
}

export class MemoryCache implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (Date.now() > entry.expires) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}
