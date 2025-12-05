/**
 * Dubbing Service Factory
 *
 * Creates and manages DubbingService instances.
 * Implements singleton pattern for efficiency.
 *
 * EDUCATIONAL NOTE:
 * Factory Pattern - Centralizes object creation.
 * - Manages dependencies
 * - Provides singleton instances
 * - Makes testing easier (can reset for tests)
 * - Alternative to dependency injection containers
 */

import { DubbingService } from './dubbing.service';
import { DubbingValidator } from './dubbing.validator';
import { DubbingRepository } from './dubbing.repository';
import { DubbingMapper } from './dubbing.mapper';
import { getCacheService } from '@/lib/cache/cache.factory';
import { DubbingServiceOptions } from './dubbing.types';

/**
 * Singleton instance of DubbingService
 */
let serviceInstance: DubbingService | null = null;

/**
 * Get the DubbingService instance (with caching)
 *
 * Creates a singleton instance with all dependencies.
 * Uses cache by default for better performance.
 *
 * @param options Optional configuration
 * @returns DubbingService instance
 *
 * @example
 * ```typescript
 * const dubbingService = getDubbingService();
 * const job = await dubbingService.createDubbingJob({
 *   sourceUrl: 'https://example.com/video.mp4',
 *   targetLanguage: 'es'
 * });
 * ```
 */
export function getDubbingService(options?: DubbingServiceOptions): DubbingService {
  if (!serviceInstance) {
    const validator = new DubbingValidator();
    const repository = new DubbingRepository(options?.apiKey);
    const mapper = new DubbingMapper();

    // Use cache by default (can be disabled via options)
    const cache = options?.enableCaching === false
      ? undefined
      : getCacheService();

    serviceInstance = new DubbingService(
      validator,
      repository,
      mapper,
      cache
    );

    console.log('[DubbingFactory] Created new DubbingService instance');
  }

  return serviceInstance;
}

/**
 * Get DubbingService instance without caching
 *
 * Useful for testing or when you don't want caching.
 *
 * @param options Optional configuration
 * @returns DubbingService instance without cache
 *
 * @example
 * ```typescript
 * const service = getDubbingServiceWithoutCache();
 * // All calls will go directly to ElevenLabs API
 * ```
 */
export function getDubbingServiceWithoutCache(options?: DubbingServiceOptions): DubbingService {
  const validator = new DubbingValidator();
  const repository = new DubbingRepository(options?.apiKey);
  const mapper = new DubbingMapper();

  return new DubbingService(
    validator,
    repository,
    mapper,
    undefined // No cache
  );
}

/**
 * Reset the singleton instance
 *
 * Useful for testing when you need a fresh instance.
 *
 * @example
 * ```typescript
 * // In test setup
 * beforeEach(() => {
 *   resetDubbingService();
 * });
 * ```
 */
export function resetDubbingService(): void {
  serviceInstance = null;
  console.log('[DubbingFactory] Reset DubbingService instance');
}

/**
 * Create a custom DubbingService with specific dependencies
 *
 * Advanced usage for dependency injection in tests.
 *
 * @param validator Custom validator instance
 * @param repository Custom repository instance
 * @param mapper Custom mapper instance
 * @param cache Optional cache service
 * @returns Custom DubbingService instance
 *
 * @example
 * ```typescript
 * // In tests with mocks
 * const mockRepo = new MockDubbingRepository();
 * const service = createDubbingService(
 *   new DubbingValidator(),
 *   mockRepo,
 *   new DubbingMapper()
 * );
 * ```
 */
export function createDubbingService(
  validator: DubbingValidator,
  repository: DubbingRepository,
  mapper: DubbingMapper,
  cache?: any
): DubbingService {
  return new DubbingService(validator, repository, mapper, cache);
}
