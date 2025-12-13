/**
 * TTS Mapper
 *
 * Transforms raw API responses to application DTOs.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TTSJobDto,
  TTSStatusDto,
  GeneratedAudioDto,
  TTSCostEstimate,
  TTSJobStatus,
  EmotionMode,
  FalTTSResponse,
  GenerateSpeechDto,
} from './tts.types';

/** fal.ai pricing: $0.002 per audio second */
const FAL_COST_PER_SECOND = 0.002;

/** Average speech rate: ~150 words per minute, ~2.5 chars per word */
const CHARS_PER_SECOND = 15;

export class TTSMapper {
  /**
   * Map generation request to TTSJobDto
   */
  mapToJobDto(
    params: GenerateSpeechDto,
    jobId?: string
  ): TTSJobDto {
    return {
      jobId: jobId || this.generateJobId(),
      text: params.text,
      voiceReferenceUrl: params.voiceReferenceUrl,
      status: 'pending' as TTSJobStatus,
      emotionMode: params.emotionMode || this.inferEmotionMode(params),
      createdAt: new Date(),
      estimatedDuration: this.estimateAudioDuration(params.text),
    };
  }

  /**
   * Map fal.ai response to TTSStatusDto
   */
  mapToStatusDto(
    jobId: string,
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    result?: FalTTSResponse,
    error?: string,
    position?: number
  ): TTSStatusDto {
    const mappedStatus = this.mapFalStatus(status);

    return {
      jobId,
      status: mappedStatus,
      progress: this.calculateProgress(status, position),
      error,
      audioUrl: result?.audio?.url,
      completedAt: mappedStatus === 'completed' ? new Date() : undefined,
    };
  }

  /**
   * Map completed response to TTSStatusDto
   */
  mapCompletedToStatusDto(
    jobId: string,
    response: FalTTSResponse
  ): TTSStatusDto {
    return {
      jobId,
      status: 'completed',
      progress: 100,
      audioUrl: response.audio.url,
      completedAt: new Date(),
    };
  }

  /**
   * Map audio buffer to GeneratedAudioDto
   */
  mapToAudioDto(
    jobId: string,
    audioBuffer: Buffer,
    originalText: string,
    format: 'wav' | 'mp3' = 'wav'
  ): GeneratedAudioDto {
    const filename = this.generateFilename(originalText, format);
    const duration = this.estimateAudioDuration(originalText);

    return {
      jobId,
      audioBuffer,
      filename,
      mimeType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      duration,
      sampleRate: 22050, // IndexTTS2 default
    };
  }

  /**
   * Create cost estimate
   */
  mapToCostEstimate(
    text: string,
    provider: 'fal' | 'local' = 'fal'
  ): TTSCostEstimate {
    const textLength = text.length;
    const estimatedSeconds = Math.ceil(textLength / CHARS_PER_SECOND);

    return {
      textLength,
      estimatedAudioSeconds: estimatedSeconds,
      estimatedCostUsd: provider === 'fal'
        ? parseFloat((estimatedSeconds * FAL_COST_PER_SECOND).toFixed(4))
        : 0,
      provider,
    };
  }

  /**
   * Generate unique job ID
   */
  generateJobId(): string {
    return `tts_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  /**
   * Infer emotion mode from parameters
   */
  private inferEmotionMode(params: GenerateSpeechDto): EmotionMode {
    if (params.emotionMode) {
      return params.emotionMode;
    }

    if (params.emotionText) {
      return 'text';
    }

    if (params.emotionVector) {
      return 'vector';
    }

    if (params.emotionReferenceUrl) {
      return 'audio';
    }

    return 'speaker';
  }

  /**
   * Map fal.ai status to internal status
   */
  private mapFalStatus(
    falStatus: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  ): TTSJobStatus {
    switch (falStatus) {
      case 'IN_QUEUE':
        return 'pending';
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'completed';
      case 'FAILED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
    position?: number
  ): number {
    switch (status) {
      case 'IN_QUEUE':
        // Estimate based on queue position
        if (position !== undefined && position > 0) {
          return Math.max(5, 20 - position * 2);
        }
        return 10;
      case 'IN_PROGRESS':
        return 50;
      case 'COMPLETED':
        return 100;
      case 'FAILED':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Estimate audio duration from text length
   */
  private estimateAudioDuration(text: string): number {
    const charCount = text.length;
    return Math.ceil(charCount / CHARS_PER_SECOND);
  }

  /**
   * Generate filename from text
   */
  private generateFilename(text: string, format: 'wav' | 'mp3'): string {
    // Take first 30 chars, sanitize
    const sanitized = text
      .substring(0, 30)
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
      .replace(/^_|_$/g, '');

    const timestamp = Date.now();

    return `tts_${sanitized || 'audio'}_${timestamp}.${format}`;
  }

  /**
   * Sanitize text for logging (truncate long text)
   */
  sanitizeForLog(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
