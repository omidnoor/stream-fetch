/**
 * TTS Repository
 *
 * Data access layer for TTS API (fal.ai IndexTTS-2).
 * Handles all direct API communication.
 */

import {
  TTSAuthError,
  TTSApiError,
  TTSAudioDownloadError,
  TTSRateLimitError,
} from '@/lib/errors/tts.errors';
import {
  FalTTSRequest,
  FalTTSResponse,
  EmotionVector,
} from './tts.types';

/** fal.ai API endpoint for IndexTTS-2 */
const FAL_TTS_ENDPOINT = 'https://fal.run/fal-ai/index-tts-2/text-to-speech';

/** fal.ai queue endpoint for async operations */
const FAL_QUEUE_ENDPOINT = 'https://queue.fal.run/fal-ai/index-tts-2/text-to-speech';

export class TTSRepository {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_API_KEY;

    if (!key) {
      throw new TTSAuthError('FAL_API_KEY is not set in environment variables');
    }

    this.apiKey = key;
  }

  /**
   * Generate speech synchronously via fal.ai API
   *
   * @returns Generated audio response
   * @throws TTSApiError if API call fails
   * @throws TTSRateLimitError if rate limited
   */
  async generateSpeech(params: {
    voiceReferenceUrl: string;
    text: string;
    emotionReferenceUrl?: string;
    emotionAlpha?: number;
    emotionVector?: EmotionVector;
    emotionText?: string;
    useEmotionText?: boolean;
  }): Promise<FalTTSResponse> {
    try {
      console.log('[TTSRepository] Generating speech:', {
        textLength: params.text.length,
        hasEmotionRef: !!params.emotionReferenceUrl,
        hasEmotionVector: !!params.emotionVector,
      });

      const requestBody: FalTTSRequest = {
        audio_url: params.voiceReferenceUrl,
        prompt: params.text,
      };

      // Add emotion reference if provided
      if (params.emotionReferenceUrl) {
        requestBody.emotional_audio_url = params.emotionReferenceUrl;
        requestBody.strength = params.emotionAlpha ?? 1.0;
      }

      // Add emotion vector if provided
      if (params.emotionVector) {
        requestBody.emotional_strengths = {
          happy: params.emotionVector[0],
          angry: params.emotionVector[1],
          sad: params.emotionVector[2],
          afraid: params.emotionVector[3],
          disgusted: params.emotionVector[4],
          melancholic: params.emotionVector[5],
          surprised: params.emotionVector[6],
          calm: params.emotionVector[7],
        };
      }

      // Add text-based emotion if requested
      if (params.useEmotionText && params.emotionText) {
        requestBody.should_use_prompt_for_emotion = true;
        requestBody.emotion_prompt = params.emotionText;
      }

      const response = await fetch(FAL_TTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result = await response.json() as FalTTSResponse;

      console.log('[TTSRepository] Speech generated successfully:', {
        audioUrl: result.audio?.url?.substring(0, 50) + '...',
        fileSize: result.audio?.file_size,
      });

      return result;
    } catch (error) {
      if (error instanceof TTSApiError || error instanceof TTSRateLimitError) {
        throw error;
      }

      console.error('[TTSRepository] Error generating speech:', error);
      throw new TTSApiError(
        `Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Submit speech generation to queue (async)
   *
   * @returns Queue request ID
   */
  async submitToQueue(params: {
    voiceReferenceUrl: string;
    text: string;
    emotionReferenceUrl?: string;
    emotionAlpha?: number;
    emotionVector?: EmotionVector;
    emotionText?: string;
    useEmotionText?: boolean;
  }): Promise<{ requestId: string }> {
    try {
      console.log('[TTSRepository] Submitting to queue');

      const requestBody: FalTTSRequest = {
        audio_url: params.voiceReferenceUrl,
        prompt: params.text,
      };

      if (params.emotionReferenceUrl) {
        requestBody.emotional_audio_url = params.emotionReferenceUrl;
        requestBody.strength = params.emotionAlpha ?? 1.0;
      }

      if (params.emotionVector) {
        requestBody.emotional_strengths = {
          happy: params.emotionVector[0],
          angry: params.emotionVector[1],
          sad: params.emotionVector[2],
          afraid: params.emotionVector[3],
          disgusted: params.emotionVector[4],
          melancholic: params.emotionVector[5],
          surprised: params.emotionVector[6],
          calm: params.emotionVector[7],
        };
      }

      if (params.useEmotionText && params.emotionText) {
        requestBody.should_use_prompt_for_emotion = true;
        requestBody.emotion_prompt = params.emotionText;
      }

      const response = await fetch(FAL_QUEUE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result = await response.json();

      console.log('[TTSRepository] Submitted to queue:', result.request_id);

      return { requestId: result.request_id };
    } catch (error) {
      if (error instanceof TTSApiError || error instanceof TTSRateLimitError) {
        throw error;
      }

      console.error('[TTSRepository] Error submitting to queue:', error);
      throw new TTSApiError(
        `Failed to submit to queue: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check queue status
   *
   * @returns Queue status with optional result
   */
  async getQueueStatus(requestId: string): Promise<{
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    result?: FalTTSResponse;
    error?: string;
    position?: number;
  }> {
    try {
      const response = await fetch(
        `https://queue.fal.run/fal-ai/index-tts-2/requests/${requestId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Key ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result = await response.json();

      return {
        status: result.status,
        result: result.response,
        error: result.error,
        position: result.queue_position,
      };
    } catch (error) {
      if (error instanceof TTSApiError || error instanceof TTSRateLimitError) {
        throw error;
      }

      throw new TTSApiError(
        `Failed to get queue status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Download audio from URL
   *
   * @returns Audio buffer
   */
  async downloadAudio(audioUrl: string, jobId: string): Promise<Buffer> {
    try {
      console.log('[TTSRepository] Downloading audio:', audioUrl.substring(0, 50) + '...');

      const response = await fetch(audioUrl);

      if (!response.ok) {
        throw new TTSAudioDownloadError(jobId, `HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('[TTSRepository] Downloaded audio:', buffer.length, 'bytes');

      return buffer;
    } catch (error) {
      if (error instanceof TTSAudioDownloadError) {
        throw error;
      }

      console.error('[TTSRepository] Error downloading audio:', error);
      throw new TTSAudioDownloadError(
        jobId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}`;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || errorBody.message || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }

    if (status === 401 || status === 403) {
      throw new TTSAuthError(errorMessage);
    }

    if (status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new TTSRateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
    }

    throw new TTSApiError(errorMessage);
  }

  /**
   * Check if API is available (health check)
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://fal.run/fal-ai/index-tts-2/health', {
        method: 'GET',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
