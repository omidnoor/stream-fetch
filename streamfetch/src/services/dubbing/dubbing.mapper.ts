/**
 * Dubbing Mapper
 *
 * Transforms raw ElevenLabs API responses to application DTOs.
 *
 * EDUCATIONAL NOTE:
 * Mapper Pattern - Converts external API shapes to our internal DTOs.
 * - Isolates API response format changes
 * - Provides consistent data structure
 * - Makes DTO changes easier
 */

import {
  DubbingJobDto,
  DubbingStatusDto,
  DubbedAudioDto,
  DubbingCostEstimate,
  DubbingJobStatus
} from './dubbing.types';

export class DubbingMapper {
  /**
   * Map ElevenLabs create dubbing response to DubbingJobDto
   */
  mapToJobDto(
    rawResponse: any,
    sourceUrl: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): DubbingJobDto {
    return {
      dubbingId: rawResponse.dubbing_id || rawResponse.dubbingId,
      sourceUrl,
      targetLanguage,
      sourceLanguage,
      status: 'dubbing' as DubbingJobStatus, // New jobs start in "dubbing" status
      createdAt: new Date(),
    };
  }

  /**
   * Map ElevenLabs status response to DubbingStatusDto
   */
  mapToStatusDto(rawStatus: any): DubbingStatusDto {
    // Handle both snake_case and camelCase
    const status = rawStatus.status as DubbingJobStatus;
    const targetLanguage = rawStatus.target_language || rawStatus.targetLanguage || 'unknown';
    const expectedDuration = rawStatus.expected_duration_sec || rawStatus.expectedDurationSec;
    const errorMessage = rawStatus.error_message || rawStatus.errorMessage;

    // Calculate progress percentage if available
    let progressPercent: number | undefined;
    if (rawStatus.progress !== undefined) {
      progressPercent = rawStatus.progress;
    } else if (status === 'dubbed') {
      progressPercent = 100;
    } else if (status === 'dubbing') {
      progressPercent = 50; // Rough estimate
    } else if (status === 'failed') {
      progressPercent = 0;
    }

    return {
      dubbingId: rawStatus.dubbing_id || rawStatus.dubbingId,
      status,
      targetLanguage,
      expectedDuration,
      error: errorMessage,
      progressPercent,
    };
  }

  /**
   * Map audio buffer to DubbedAudioDto
   */
  mapToAudioDto(
    dubbingId: string,
    targetLanguage: string,
    audioBuffer: Buffer,
    sourceTitle?: string
  ): DubbedAudioDto {
    // Generate filename based on dubbing ID and target language
    const sanitizedTitle = sourceTitle
      ? this.sanitizeFilename(sourceTitle)
      : `dubbing_${dubbingId}`;

    const filename = `${sanitizedTitle}_${targetLanguage}.mp3`;

    return {
      dubbingId,
      targetLanguage,
      audioBuffer,
      filename,
      mimeType: 'audio/mpeg',
    };
  }

  /**
   * Create cost estimate object
   */
  mapToCostEstimate(
    durationSeconds: number,
    withWatermark: boolean
  ): DubbingCostEstimate {
    // ElevenLabs charges based on duration
    // With watermark: ~2000 chars/min
    // Without watermark: ~3000 chars/min
    const charsPerMinute = withWatermark ? 2000 : 3000;
    const minutes = durationSeconds / 60;
    const characters = Math.ceil(minutes * charsPerMinute);

    // Rough cost estimate (varies by plan)
    // Average: $0.24 - $0.60 per minute
    const costPerMinute = 0.42; // Mid-range estimate
    const estimatedDollars = parseFloat((minutes * costPerMinute).toFixed(2));

    return {
      characters,
      estimatedDollars,
      durationMinutes: parseFloat(minutes.toFixed(2)),
      withWatermark,
    };
  }

  /**
   * Sanitize filename by removing invalid characters
   * @private
   */
  private sanitizeFilename(title: string): string {
    // Remove characters that are invalid in filenames
    const sanitized = title.replace(/[<>:"/\\|?*]/g, '_');

    // Remove leading/trailing spaces and dots
    const trimmed = sanitized.trim().replace(/^\.+/, '');

    // Limit length to prevent filesystem issues
    const maxLength = 100;
    return trimmed.length > maxLength
      ? trimmed.substring(0, maxLength)
      : trimmed;
  }
}
