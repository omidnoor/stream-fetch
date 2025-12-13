/**
 * TTS-specific Error Classes
 *
 * These errors represent various failure scenarios in the TTS workflow.
 * Each error maps to an appropriate HTTP status code.
 */

import { AppError } from './base.error';

/**
 * Error thrown when fal.ai API key is missing or invalid
 */
export class TTSAuthError extends AppError {
  constructor(message: string = 'TTS API key is missing or invalid') {
    super(message, 401, 'TTS_AUTH_ERROR');
  }
}

/**
 * Error thrown when voice reference audio is invalid
 */
export class InvalidVoiceReferenceError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid voice reference: ${reason}`,
      400,
      'INVALID_VOICE_REFERENCE'
    );
  }
}

/**
 * Error thrown when text input is invalid
 */
export class InvalidTextInputError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid text input: ${reason}`,
      400,
      'INVALID_TEXT_INPUT'
    );
  }
}

/**
 * Error thrown when emotion vector is invalid
 */
export class InvalidEmotionVectorError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid emotion vector: ${reason}`,
      400,
      'INVALID_EMOTION_VECTOR'
    );
  }
}

/**
 * Error thrown when a TTS job is not found
 */
export class TTSJobNotFoundError extends AppError {
  constructor(jobId: string) {
    super(
      `TTS job not found: ${jobId}`,
      404,
      'TTS_JOB_NOT_FOUND'
    );
  }
}

/**
 * Error thrown when a TTS job has failed
 */
export class TTSJobFailedError extends AppError {
  constructor(jobId: string, reason?: string) {
    super(
      `TTS job failed: ${jobId}${reason ? ` - ${reason}` : ''}`,
      500,
      'TTS_JOB_FAILED'
    );
  }
}

/**
 * Error thrown when TTS generation times out
 */
export class TTSTimeoutError extends AppError {
  constructor(jobId: string, timeoutMs: number) {
    super(
      `TTS generation timed out after ${timeoutMs}ms: ${jobId}`,
      408,
      'TTS_TIMEOUT'
    );
  }
}

/**
 * Error thrown when TTS API call fails
 */
export class TTSApiError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `TTS API error: ${message}`,
      500,
      'TTS_API_ERROR'
    );

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when audio download fails
 */
export class TTSAudioDownloadError extends AppError {
  constructor(jobId: string, reason?: string) {
    super(
      `Failed to download generated audio for job ${jobId}${reason ? `: ${reason}` : ''}`,
      500,
      'TTS_AUDIO_DOWNLOAD_ERROR'
    );
  }
}

/**
 * Error thrown when voice reference audio exceeds limits
 */
export class VoiceReferenceTooLongError extends AppError {
  constructor(duration: number, maxDuration: number) {
    super(
      `Voice reference audio is too long: ${duration}s (max: ${maxDuration}s)`,
      400,
      'VOICE_REFERENCE_TOO_LONG'
    );
  }
}

/**
 * Error thrown when text exceeds maximum length
 */
export class TextTooLongError extends AppError {
  constructor(length: number, maxLength: number) {
    super(
      `Text is too long: ${length} characters (max: ${maxLength})`,
      400,
      'TEXT_TOO_LONG'
    );
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class TTSRateLimitError extends AppError {
  constructor(retryAfterSeconds?: number) {
    super(
      `TTS rate limit exceeded${retryAfterSeconds ? `. Retry after ${retryAfterSeconds}s` : ''}`,
      429,
      'TTS_RATE_LIMIT'
    );
  }
}
