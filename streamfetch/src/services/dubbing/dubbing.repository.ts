/**
 * Dubbing Repository
 *
 * Data access layer for ElevenLabs API.
 * Handles all direct API communication.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
  ElevenLabsAuthError,
  ElevenLabsApiError,
  DubbingJobNotFoundError,
  AudioDownloadError
} from '@/lib/errors/dubbing.errors';

export class DubbingRepository {
  private client: ElevenLabsClient;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ELEVENLABS_API_KEY;

    if (!key) {
      throw new ElevenLabsAuthError('ELEVENLABS_API_KEY is not set in environment variables');
    }

    this.client = new ElevenLabsClient({ apiKey: key });
  }

  /**
   * Create a dubbing job via ElevenLabs API
   *
   * @returns Raw response from ElevenLabs with dubbing_id
   * @throws ElevenLabsApiError if API call fails
   */
  async createDubbingJob(params: {
    sourceUrl: string;
    targetLanguage: string;
    sourceLanguage?: string;
    numSpeakers?: number;
    watermark?: boolean;
  }): Promise<any> {
    try {
      console.log('[DubbingRepository] Creating dubbing job:', {
        targetLanguage: params.targetLanguage,
        watermark: params.watermark
      });

      // Type assertion to handle SDK API changes
      const response = await (this.client.dubbing as any).dubAVideoOrAnAudioFile({
        source_url: params.sourceUrl,
        target_lang: params.targetLanguage,
        source_lang: params.sourceLanguage,
        num_speakers: params.numSpeakers,
        watermark: params.watermark ?? true,
      });

      console.log('[DubbingRepository] Dubbing job created:', response.dubbing_id);

      return response;
    } catch (error) {
      console.error('[DubbingRepository] Error creating dubbing job:', error);
      throw new ElevenLabsApiError(
        `Failed to create dubbing job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get dubbing job status from ElevenLabs API
   *
   * @returns Raw status response from ElevenLabs
   * @throws DubbingJobNotFoundError if job not found
   * @throws ElevenLabsApiError if API call fails
   */
  async getDubbingStatus(dubbingId: string): Promise<any> {
    try {
      console.log('[DubbingRepository] Fetching status for:', dubbingId);

      // Type assertion to handle SDK API changes
      const response = await (this.client.dubbing as any).getDubbingProjectMetadata(dubbingId);

      console.log('[DubbingRepository] Status:', response.status);

      return response;
    } catch (error) {
      console.error('[DubbingRepository] Error fetching status:', error);

      // Check if it's a 404 error
      if (error instanceof Error && error.message.includes('404')) {
        throw new DubbingJobNotFoundError(dubbingId);
      }

      throw new ElevenLabsApiError(
        `Failed to get dubbing status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Download dubbed audio from ElevenLabs API
   *
   * @returns Audio buffer
   * @throws AudioDownloadError if download fails
   * @throws ElevenLabsApiError if API call fails
   */
  async downloadDubbedAudio(dubbingId: string, targetLanguage: string): Promise<Buffer> {
    try {
      console.log('[DubbingRepository] Downloading audio:', {
        dubbingId,
        targetLanguage
      });

      // Type assertion to handle SDK API changes
      const response = await (this.client.dubbing as any).getTranscriptForDub(
        dubbingId,
        targetLanguage
      );

      // Convert response to Buffer
      if (Buffer.isBuffer(response)) {
        console.log('[DubbingRepository] Downloaded audio buffer:', response.length, 'bytes');
        return response;
      }

      // If it's a readable stream, convert to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response as any) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      console.log('[DubbingRepository] Downloaded audio buffer:', buffer.length, 'bytes');

      return buffer;
    } catch (error) {
      console.error('[DubbingRepository] Error downloading audio:', error);
      throw new AudioDownloadError(dubbingId, targetLanguage);
    }
  }

  /**
   * Delete a dubbing job (if API supports it)
   *
   * @returns Success status
   */
  async deleteDubbingJob(dubbingId: string): Promise<boolean> {
    try {
      console.log('[DubbingRepository] Deleting job:', dubbingId);

      // Check if the SDK supports deletion
      if (typeof (this.client.dubbing as any).deleteDubbingProject === 'function') {
        await (this.client.dubbing as any).deleteDubbingProject(dubbingId);
        console.log('[DubbingRepository] Job deleted successfully');
        return true;
      }

      console.log('[DubbingRepository] Deletion not supported by SDK');
      return false;
    } catch (error) {
      console.error('[DubbingRepository] Error deleting job:', error);
      return false;
    }
  }
}
