/**
 * TTS Service
 *
 * Main service for IndexTTS2 text-to-speech operations.
 * Orchestrates validation, API calls, and data transformation.
 */

import {
  GenerateSpeechDto,
  TTSJobDto,
  TTSStatusDto,
  GeneratedAudioDto,
  TTSCostEstimate,
  EmotionVector,
  EmotionPreset,
  EMOTION_PRESETS,
} from './tts.types';
import { TTSValidator } from './tts.validator';
import { TTSRepository } from './tts.repository';
import { TTSMapper } from './tts.mapper';
import { CacheService } from '@/lib/cache/cache.interface';
import {
  TTSJobNotFoundError,
  TTSJobFailedError,
  TTSTimeoutError,
} from '@/lib/errors/tts.errors';

/** Default timeout for synchronous generation (60 seconds) */
const DEFAULT_TIMEOUT_MS = 60000;

/** Polling interval for async jobs */
const POLL_INTERVAL_MS = 1000;

/**
 * Main TTS Service
 *
 * Provides high-level API for text-to-speech operations:
 * - Generate speech from text
 * - Check job status
 * - Download generated audio
 * - Estimate costs
 */
export class TTSService {
  constructor(
    private readonly validator: TTSValidator,
    private readonly repository: TTSRepository,
    private readonly mapper: TTSMapper,
    private readonly cache?: CacheService
  ) {}

  /**
   * Generate speech from text (synchronous)
   *
   * @param params Generation parameters
   * @returns Generated audio data
   * @throws InvalidTextInputError if text is invalid
   * @throws InvalidVoiceReferenceError if voice reference is invalid
   * @throws TTSApiError if API call fails
   */
  async generateSpeech(params: GenerateSpeechDto): Promise<GeneratedAudioDto> {
    // 1. Validate inputs
    this.validator.validateText(params.text);
    this.validator.validateVoiceReference(params.voiceReferenceUrl);

    if (params.emotionVector) {
      this.validator.validateEmotionVector(params.emotionVector);
    }

    if (params.emotionAlpha !== undefined) {
      this.validator.validateEmotionAlpha(params.emotionAlpha);
    }

    if (params.emotionMode) {
      this.validator.validateEmotionMode(params.emotionMode);
    }

    this.validator.validateGenerationParams({
      temperature: params.temperature,
      topP: params.topP,
      topK: params.topK,
    });

    // 2. Create job DTO
    const jobDto = this.mapper.mapToJobDto(params);

    console.log('[TTSService] Generating speech:', {
      jobId: jobDto.jobId,
      textLength: params.text.length,
      emotionMode: jobDto.emotionMode,
    });

    // 3. Call repository to generate speech
    const response = await this.repository.generateSpeech({
      voiceReferenceUrl: params.voiceReferenceUrl,
      text: params.text,
      emotionReferenceUrl: params.emotionReferenceUrl,
      emotionAlpha: params.emotionAlpha,
      emotionVector: params.emotionVector,
      emotionText: params.emotionText,
      useEmotionText: params.emotionMode === 'text',
    });

    // 4. Download audio
    const audioBuffer = await this.repository.downloadAudio(
      response.audio.url,
      jobDto.jobId
    );

    // 5. Transform to DTO
    const audioDto = this.mapper.mapToAudioDto(
      jobDto.jobId,
      audioBuffer,
      params.text,
      params.outputFormat || 'wav'
    );

    // 6. Cache the result (optional)
    if (this.cache) {
      const cacheKey = `tts:audio:${jobDto.jobId}`;
      await this.cache.set(cacheKey, {
        audioUrl: response.audio.url,
        status: 'completed',
      }, 3600); // 1 hour TTL
      console.log(`[TTSService] Cached result for: ${jobDto.jobId}`);
    }

    console.log('[TTSService] Speech generated successfully:', {
      jobId: jobDto.jobId,
      audioSize: audioBuffer.length,
      duration: audioDto.duration,
    });

    return audioDto;
  }

  /**
   * Generate speech asynchronously (queue-based)
   *
   * @param params Generation parameters
   * @returns Job information with ID for status polling
   */
  async generateSpeechAsync(params: GenerateSpeechDto): Promise<TTSJobDto> {
    // 1. Validate inputs
    this.validator.validateText(params.text);
    this.validator.validateVoiceReference(params.voiceReferenceUrl);

    if (params.emotionVector) {
      this.validator.validateEmotionVector(params.emotionVector);
    }

    if (params.emotionAlpha !== undefined) {
      this.validator.validateEmotionAlpha(params.emotionAlpha);
    }

    // 2. Submit to queue
    const { requestId } = await this.repository.submitToQueue({
      voiceReferenceUrl: params.voiceReferenceUrl,
      text: params.text,
      emotionReferenceUrl: params.emotionReferenceUrl,
      emotionAlpha: params.emotionAlpha,
      emotionVector: params.emotionVector,
      emotionText: params.emotionText,
      useEmotionText: params.emotionMode === 'text',
    });

    // 3. Create job DTO
    const jobDto = this.mapper.mapToJobDto(params, requestId);

    // 4. Cache job info
    if (this.cache) {
      const cacheKey = `tts:job:${requestId}`;
      await this.cache.set(cacheKey, {
        ...jobDto,
        text: params.text,
        voiceReferenceUrl: params.voiceReferenceUrl,
      }, 3600);
    }

    console.log('[TTSService] Async job submitted:', requestId);

    return jobDto;
  }

  /**
   * Get status of an async TTS job
   *
   * @param jobId The job/request ID
   * @returns Current status
   */
  async getJobStatus(jobId: string): Promise<TTSStatusDto> {
    // 1. Validate input
    this.validator.validateJobId(jobId);

    // 2. Check cache for completed jobs
    if (this.cache) {
      const cacheKey = `tts:audio:${jobId}`;
      const cached = await this.cache.get<{ audioUrl: string; status: string }>(cacheKey);

      if (cached && cached.status === 'completed') {
        console.log(`[TTSService] Cache hit for status: ${jobId}`);
        return {
          jobId,
          status: 'completed',
          progress: 100,
          audioUrl: cached.audioUrl,
          completedAt: new Date(),
        };
      }
    }

    // 3. Fetch from API
    console.log(`[TTSService] Fetching status from API: ${jobId}`);
    const queueStatus = await this.repository.getQueueStatus(jobId);

    // 4. Transform to DTO
    const statusDto = this.mapper.mapToStatusDto(
      jobId,
      queueStatus.status,
      queueStatus.result,
      queueStatus.error,
      queueStatus.position
    );

    // 5. Cache if completed
    if (statusDto.status === 'completed' && statusDto.audioUrl && this.cache) {
      const cacheKey = `tts:audio:${jobId}`;
      await this.cache.set(cacheKey, {
        audioUrl: statusDto.audioUrl,
        status: 'completed',
      }, 3600);
    }

    return statusDto;
  }

  /**
   * Wait for job completion with timeout
   *
   * @param jobId The job ID
   * @param timeoutMs Timeout in milliseconds
   * @returns Completed status with audio URL
   */
  async waitForCompletion(
    jobId: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<TTSStatusDto> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new TTSJobFailedError(jobId, status.error);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new TTSTimeoutError(jobId, timeoutMs);
  }

  /**
   * Download audio for a completed job
   *
   * @param jobId The job ID
   * @returns Audio data
   */
  async downloadAudio(jobId: string): Promise<GeneratedAudioDto> {
    // 1. Get job status
    const status = await this.getJobStatus(jobId);

    if (status.status === 'failed') {
      throw new TTSJobFailedError(jobId, status.error);
    }

    if (status.status !== 'completed' || !status.audioUrl) {
      throw new TTSJobNotFoundError(jobId);
    }

    // 2. Get original text from cache
    let originalText = 'Generated audio';
    if (this.cache) {
      const jobCacheKey = `tts:job:${jobId}`;
      const jobInfo = await this.cache.get<{ text: string }>(jobCacheKey);
      if (jobInfo?.text) {
        originalText = jobInfo.text;
      }
    }

    // 3. Download audio
    const audioBuffer = await this.repository.downloadAudio(status.audioUrl, jobId);

    // 4. Transform to DTO
    return this.mapper.mapToAudioDto(jobId, audioBuffer, originalText);
  }

  /**
   * Generate speech with emotion preset
   *
   * @param text Text to synthesize
   * @param voiceReferenceUrl Voice reference audio URL
   * @param emotionPreset Preset name (e.g., 'happy', 'sad')
   * @param emotionAlpha Emotion intensity (0-1)
   * @returns Generated audio
   */
  async generateWithPreset(
    text: string,
    voiceReferenceUrl: string,
    emotionPreset: EmotionPreset,
    emotionAlpha: number = 0.7
  ): Promise<GeneratedAudioDto> {
    const emotionVector = this.validator.getEmotionPreset(emotionPreset);

    if (!emotionVector) {
      throw new Error(`Unknown emotion preset: ${emotionPreset}`);
    }

    return this.generateSpeech({
      text,
      voiceReferenceUrl,
      emotionVector,
      emotionAlpha,
      emotionMode: 'vector',
    });
  }

  /**
   * Estimate cost for text
   *
   * @param text Text to estimate
   * @param provider Provider to use
   * @returns Cost estimate
   */
  estimateCost(text: string, provider: 'fal' | 'local' = 'fal'): TTSCostEstimate {
    this.validator.validateText(text);
    return this.mapper.mapToCostEstimate(text, provider);
  }

  /**
   * Get available emotion presets
   */
  getEmotionPresets(): Record<string, EmotionVector> {
    const presets: Record<string, EmotionVector> = {};

    for (const [name, vector] of Object.entries(EMOTION_PRESETS)) {
      presets[name] = [...vector] as EmotionVector;
    }

    return presets;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Record<string, string> {
    return this.validator.getSupportedLanguages();
  }

  /**
   * Get maximum text length
   */
  getMaxTextLength(): number {
    return this.validator.getMaxTextLength();
  }

  /**
   * Invalidate cached job data
   */
  async invalidateCache(jobId: string): Promise<void> {
    if (!this.cache) return;

    this.validator.validateJobId(jobId);

    await this.cache.del(`tts:job:${jobId}`);
    await this.cache.del(`tts:audio:${jobId}`);

    console.log(`[TTSService] Invalidated cache for: ${jobId}`);
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    return this.repository.healthCheck();
  }
}
