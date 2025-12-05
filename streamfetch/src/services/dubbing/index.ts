/**
 * Dubbing Service Module
 *
 * Entry point for ElevenLabs dubbing services.
 * Exports the main service and related types.
 *
 * USAGE:
 * ```typescript
 * import { getDubbingService } from '@/services/dubbing';
 *
 * const dubbingService = getDubbingService();
 * const job = await dubbingService.createDubbingJob({
 *   sourceUrl: 'https://example.com/video.mp4',
 *   targetLanguage: 'es',
 *   watermark: true
 * });
 * ```
 */

// Service classes
export { DubbingService } from './dubbing.service';
export { DubbingValidator } from './dubbing.validator';
export { DubbingRepository } from './dubbing.repository';
export { DubbingMapper } from './dubbing.mapper';

// Factory functions
export {
  getDubbingService,
  getDubbingServiceWithoutCache,
  resetDubbingService,
  createDubbingService
} from './dubbing.factory';

// Types and interfaces
export type {
  CreateDubbingDto,
  DubbingJobDto,
  DubbingStatusDto,
  DubbedAudioDto,
  DubbingCostEstimate,
  DubbingServiceOptions,
  SupportedLanguage,
  DubbingJobStatus
} from './dubbing.types';

// Constants
export { SUPPORTED_LANGUAGES } from './dubbing.types';
