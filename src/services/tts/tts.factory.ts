/**
 * TTS Service Factory
 *
 * Creates and manages TTSService instances.
 * Implements singleton pattern for efficiency.
 */

import { TTSService } from './tts.service';
import { TTSValidator } from './tts.validator';
import { TTSRepository } from './tts.repository';
import { TTSMapper } from './tts.mapper';
import { getCacheService } from '@/lib/cache/cache.factory';
import { TTSServiceOptions } from './tts.types';

/**
 * Singleton instance of TTSService
 */
let serviceInstance: TTSService | null = null;

/**
 * Get the TTSService instance (with caching)
 *
 * Creates a singleton instance with all dependencies.
 * Uses cache by default for better performance.
 *
 * @param options Optional configuration
 * @returns TTSService instance
 *
 * @example
 * ```typescript
 * const ttsService = getTTSService();
 * const audio = await ttsService.generateSpeech({
 *   text: 'Hello, world!',
 *   voiceReferenceUrl: 'https://example.com/voice.wav'
 * });
 * ```
 */
export function getTTSService(options?: TTSServiceOptions): TTSService {
  if (!serviceInstance) {
    const validator = new TTSValidator();
    const repository = new TTSRepository(options?.falApiKey);
    const mapper = new TTSMapper();

    // Use cache by default (can be disabled via options)
    const cache = options?.enableCaching === false
      ? undefined
      : getCacheService();

    serviceInstance = new TTSService(
      validator,
      repository,
      mapper,
      cache
    );

    console.log('[TTSFactory] Created new TTSService instance');
  }

  return serviceInstance;
}

/**
 * Get TTSService instance without caching
 *
 * Useful for testing or when you don't want caching.
 *
 * @param options Optional configuration
 * @returns TTSService instance without cache
 *
 * @example
 * ```typescript
 * const service = getTTSServiceWithoutCache();
 * // All calls will go directly to API without caching
 * ```
 */
export function getTTSServiceWithoutCache(options?: TTSServiceOptions): TTSService {
  const validator = new TTSValidator();
  const repository = new TTSRepository(options?.falApiKey);
  const mapper = new TTSMapper();

  return new TTSService(
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
 *   resetTTSService();
 * });
 * ```
 */
export function resetTTSService(): void {
  serviceInstance = null;
  console.log('[TTSFactory] Reset TTSService instance');
}

/**
 * Create a custom TTSService with specific dependencies
 *
 * Advanced usage for dependency injection in tests.
 *
 * @param validator Custom validator instance
 * @param repository Custom repository instance
 * @param mapper Custom mapper instance
 * @param cache Optional cache service
 * @returns Custom TTSService instance
 *
 * @example
 * ```typescript
 * // In tests with mocks
 * const mockRepo = new MockTTSRepository();
 * const service = createTTSService(
 *   new TTSValidator(),
 *   mockRepo,
 *   new TTSMapper()
 * );
 * ```
 */
export function createTTSService(
  validator: TTSValidator,
  repository: TTSRepository,
  mapper: TTSMapper,
  cache?: any
): TTSService {
  return new TTSService(validator, repository, mapper, cache);
}
