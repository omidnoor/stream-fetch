import { YouTubeService } from './youtube.service';
import { YouTubeValidator } from './youtube.validator';
import { YouTubeRepository } from './youtube.repository';
import { YouTubeMapper } from './youtube.mapper';
import { getCacheService } from '@/lib/cache/cache.factory';

/**
 * YouTube Service Factory
 *
 * Creates and manages YouTubeService instances.
 * Implements singleton pattern to reuse service instances.
 */

let youtubeServiceInstance: YouTubeService | null = null;

/**
 * Get the YouTubeService singleton instance
 *
 * Creates a new instance with all dependencies if it doesn't exist.
 * Reuses the existing instance on subsequent calls.
 */
export function getYouTubeService(): YouTubeService {
  if (!youtubeServiceInstance) {
    youtubeServiceInstance = createYouTubeService();
  }

  return youtubeServiceInstance;
}

/**
 * Create a new YouTubeService with all dependencies
 *
 * @private
 */
function createYouTubeService(): YouTubeService {
  const validator = new YouTubeValidator();
  const repository = new YouTubeRepository();
  const mapper = new YouTubeMapper();
  const cache = getCacheService();

  return new YouTubeService(
    validator,
    repository,
    mapper,
    cache
  );
}

/**
 * Reset the service instance
 *
 * Useful for testing or when you need a fresh instance.
 */
export function resetYouTubeService(): void {
  youtubeServiceInstance = null;
}

/**
 * Create a YouTube service without caching
 *
 * Useful for specific scenarios where caching is not desired.
 */
export function getYouTubeServiceWithoutCache(): YouTubeService {
  const validator = new YouTubeValidator();
  const repository = new YouTubeRepository();
  const mapper = new YouTubeMapper();

  return new YouTubeService(
    validator,
    repository,
    mapper
    // No cache service
  );
}
