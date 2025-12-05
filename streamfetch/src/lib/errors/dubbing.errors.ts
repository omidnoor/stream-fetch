/**
 * Dubbing-specific Error Classes
 *
 * These errors represent various failure scenarios in the dubbing workflow.
 * Each error maps to an appropriate HTTP status code.
 */

import { AppError } from './base.error';

/**
 * Error thrown when ElevenLabs API key is missing or invalid
 */
export class ElevenLabsAuthError extends AppError {
  constructor(message: string = 'ElevenLabs API key is missing or invalid') {
    super(message, 401, 'ELEVENLABS_AUTH_ERROR');
  }
}

/**
 * Error thrown when an invalid or unsupported language code is provided
 */
export class InvalidLanguageError extends AppError {
  constructor(languageCode: string) {
    super(
      `Invalid language code: ${languageCode}`,
      400,
      'INVALID_LANGUAGE'
    );
  }
}

/**
 * Error thrown when dubbing source URL is invalid or inaccessible
 */
export class InvalidSourceUrlError extends AppError {
  constructor(url: string) {
    super(
      `Invalid or inaccessible source URL: ${url}`,
      400,
      'INVALID_SOURCE_URL'
    );
  }
}

/**
 * Error thrown when a dubbing job is not found
 */
export class DubbingJobNotFoundError extends AppError {
  constructor(dubbingId: string) {
    super(
      `Dubbing job not found: ${dubbingId}`,
      404,
      'DUBBING_JOB_NOT_FOUND'
    );
  }
}

/**
 * Error thrown when a dubbing job has failed
 */
export class DubbingJobFailedError extends AppError {
  constructor(dubbingId: string, reason?: string) {
    super(
      `Dubbing job failed: ${dubbingId}${reason ? ` - ${reason}` : ''}`,
      500,
      'DUBBING_JOB_FAILED'
    );
  }
}

/**
 * Error thrown when trying to download audio from a dubbing job that's not complete
 */
export class DubbingNotCompleteError extends AppError {
  constructor(dubbingId: string, currentStatus: string) {
    super(
      `Dubbing job is not complete yet. Current status: ${currentStatus}`,
      409,
      'DUBBING_NOT_COMPLETE'
    );
  }
}

/**
 * Error thrown when ElevenLabs API call fails
 */
export class ElevenLabsApiError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `ElevenLabs API error: ${message}`,
      500,
      'ELEVENLABS_API_ERROR'
    );

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when audio download fails
 */
export class AudioDownloadError extends AppError {
  constructor(dubbingId: string, language: string) {
    super(
      `Failed to download dubbed audio for job ${dubbingId}, language: ${language}`,
      500,
      'AUDIO_DOWNLOAD_ERROR'
    );
  }
}
