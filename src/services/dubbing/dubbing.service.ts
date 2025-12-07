/**
 * Dubbing Service
 *
 * Main service for ElevenLabs dubbing operations.
 * Orchestrates validation, API calls, and data transformation.
 */

import {
  CreateDubbingDto,
  DubbingJobDto,
  DubbingStatusDto,
  DubbedAudioDto,
  DubbingCostEstimate
} from './dubbing.types';
import { DubbingValidator } from './dubbing.validator';
import { DubbingRepository } from './dubbing.repository';
import { DubbingMapper } from './dubbing.mapper';
import { CacheService } from '@/lib/cache/cache.interface';
import {
  DubbingJobFailedError,
  DubbingNotCompleteError
} from '@/lib/errors/dubbing.errors';

/**
 * Main Dubbing Service
 *
 * Provides high-level API for dubbing operations:
 * - Create dubbing jobs
 * - Check job status
 * - Download dubbed audio
 * - Estimate costs
 */
export class DubbingService {
  constructor(
    private readonly validator: DubbingValidator,
    private readonly repository: DubbingRepository,
    private readonly mapper: DubbingMapper,
    private readonly cache?: CacheService
  ) {}

  /**
   * Create a new dubbing job
   *
   * @param params Dubbing parameters
   * @returns Dubbing job information with ID
   * @throws InvalidSourceUrlError if source URL is invalid
   * @throws InvalidLanguageError if language is not supported
   * @throws ValidationError if num speakers is invalid
   * @throws ElevenLabsApiError if API call fails
   */
  async createDubbingJob(params: CreateDubbingDto): Promise<DubbingJobDto> {
    // 1. Validate inputs
    this.validator.validateSourceUrl(params.sourceUrl);
    this.validator.validateLanguage(params.targetLanguage);

    if (params.sourceLanguage) {
      this.validator.validateLanguage(params.sourceLanguage);
    }

    if (params.numSpeakers !== undefined) {
      this.validator.validateNumSpeakers(params.numSpeakers);
    }

    // 2. Call repository to create job
    console.log('[DubbingService] Creating dubbing job');
    const rawResponse = await this.repository.createDubbingJob({
      sourceUrl: params.sourceUrl,
      targetLanguage: params.targetLanguage,
      sourceLanguage: params.sourceLanguage,
      numSpeakers: params.numSpeakers,
      watermark: params.watermark ?? true,
    });

    // 3. Transform response to DTO
    const jobDto = this.mapper.mapToJobDto(
      rawResponse,
      params.sourceUrl,
      params.targetLanguage,
      params.sourceLanguage
    );

    // 4. Cache the initial status (optional)
    if (this.cache) {
      const cacheKey = `dubbing:status:${jobDto.dubbingId}`;
      await this.cache.set(cacheKey, jobDto, 300); // 5 minutes TTL
      console.log(`[DubbingService] Cached initial status for: ${jobDto.dubbingId}`);
    }

    return jobDto;
  }

  /**
   * Get the status of a dubbing job
   *
   * @param dubbingId The dubbing job ID
   * @returns Current status of the job
   * @throws ValidationError if dubbing ID is invalid
   * @throws DubbingJobNotFoundError if job not found
   * @throws ElevenLabsApiError if API call fails
   */
  async getDubbingStatus(dubbingId: string): Promise<DubbingStatusDto> {
    // 1. Validate input
    this.validator.validateDubbingId(dubbingId);

    // 2. Check cache first
    if (this.cache) {
      const cacheKey = `dubbing:status:${dubbingId}`;
      const cached = await this.cache.get<DubbingStatusDto>(cacheKey);

      if (cached) {
        console.log(`[DubbingService] Cache hit for status: ${dubbingId}`);
        // Only return cached if it's not complete (complete jobs might have been updated)
        if (cached.status === 'dubbing') {
          return cached;
        }
      }
    }

    // 3. Fetch from API
    console.log(`[DubbingService] Fetching status from API: ${dubbingId}`);
    const rawStatus = await this.repository.getDubbingStatus(dubbingId);

    // 4. Transform to DTO
    const statusDto = this.mapper.mapToStatusDto(rawStatus);

    // 5. Cache the result
    if (this.cache) {
      const cacheKey = `dubbing:status:${dubbingId}`;
      // Cache for shorter time if still in progress (1 min), longer if complete (10 min)
      const ttl = statusDto.status === 'dubbing' ? 60 : 600;
      await this.cache.set(cacheKey, statusDto, ttl);
      console.log(`[DubbingService] Cached status for: ${dubbingId}`);
    }

    return statusDto;
  }

  /**
   * Download dubbed audio for a completed job
   *
   * @param dubbingId The dubbing job ID
   * @param targetLanguage Target language code
   * @param sourceTitle Optional source title for filename
   * @returns Dubbed audio data
   * @throws ValidationError if inputs are invalid
   * @throws DubbingNotCompleteError if job is not complete
   * @throws DubbingJobFailedError if job failed
   * @throws AudioDownloadError if download fails
   */
  async downloadDubbedAudio(
    dubbingId: string,
    targetLanguage: string,
    sourceTitle?: string
  ): Promise<DubbedAudioDto> {
    // 1. Validate inputs
    this.validator.validateDubbingId(dubbingId);
    this.validator.validateLanguage(targetLanguage);

    // 2. Check if job is complete
    const status = await this.getDubbingStatus(dubbingId);

    if (status.status === 'failed') {
      throw new DubbingJobFailedError(dubbingId, status.error);
    }

    if (status.status !== 'dubbed') {
      throw new DubbingNotCompleteError(dubbingId, status.status);
    }

    // 3. Download audio
    console.log(`[DubbingService] Downloading audio for: ${dubbingId}`);
    const audioBuffer = await this.repository.downloadDubbedAudio(
      dubbingId,
      targetLanguage
    );

    // 4. Transform to DTO
    const audioDto = this.mapper.mapToAudioDto(
      dubbingId,
      targetLanguage,
      audioBuffer,
      sourceTitle
    );

    return audioDto;
  }

  /**
   * Estimate the cost of dubbing a video
   *
   * @param durationSeconds Duration of the video in seconds
   * @param withWatermark Whether to include watermark (cheaper)
   * @returns Cost estimate
   */
  estimateDubbingCost(
    durationSeconds: number,
    withWatermark: boolean = true
  ): DubbingCostEstimate {
    if (durationSeconds < 0) {
      throw new Error('Duration cannot be negative');
    }

    return this.mapper.mapToCostEstimate(durationSeconds, withWatermark);
  }

  /**
   * Get list of supported languages
   *
   * @returns Object mapping language codes to names
   */
  getSupportedLanguages(): Record<string, string> {
    return this.validator.getSupportedLanguages();
  }

  /**
   * Check if a language is supported
   *
   * @param languageCode Language code to check
   * @returns True if supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.validator.isLanguageSupported(languageCode);
  }

  /**
   * Invalidate cached status for a dubbing job
   *
   * Useful when you want to force a fresh status check
   */
  async invalidateStatusCache(dubbingId: string): Promise<void> {
    if (!this.cache) return;

    this.validator.validateDubbingId(dubbingId);
    const cacheKey = `dubbing:status:${dubbingId}`;

    await this.cache.del(cacheKey);
    console.log(`[DubbingService] Invalidated cache for: ${dubbingId}`);
  }

  /**
   * Delete a dubbing job (if supported by API)
   *
   * @param dubbingId The dubbing job ID
   * @returns True if deletion was successful
   */
  async deleteDubbingJob(dubbingId: string): Promise<boolean> {
    this.validator.validateDubbingId(dubbingId);

    const deleted = await this.repository.deleteDubbingJob(dubbingId);

    // Invalidate cache if deletion was successful
    if (deleted && this.cache) {
      await this.invalidateStatusCache(dubbingId);
    }

    return deleted;
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats() {
    if (this.cache && 'getStats' in this.cache) {
      return (this.cache as any).getStats();
    }
    return null;
  }
}
