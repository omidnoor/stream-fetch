import { AppError } from './base.error';

/**
 * Thrown when a YouTube URL is invalid or malformed
 */
export class InvalidUrlError extends AppError {
  constructor(url: string) {
    super(
      `Invalid YouTube URL: ${url}`,
      400,
      'INVALID_URL'
    );
  }
}

/**
 * Thrown when a video cannot be found
 */
export class VideoNotFoundError extends AppError {
  constructor(videoId: string) {
    super(
      `Video not found: ${videoId}`,
      404,
      'VIDEO_NOT_FOUND'
    );
  }
}

/**
 * Thrown when a video is unavailable (private, deleted, restricted)
 */
export class VideoUnavailableError extends AppError {
  constructor(reason: string) {
    super(
      `Video unavailable: ${reason}`,
      403,
      'VIDEO_UNAVAILABLE'
    );
  }
}

/**
 * Thrown when a requested format is not available
 */
export class FormatNotFoundError extends AppError {
  constructor(itag: number) {
    super(
      `Format with itag ${itag} not found`,
      404,
      'FORMAT_NOT_FOUND'
    );
  }
}

/**
 * Thrown when all fallback strategies fail
 */
export class AllStrategiesFailedError extends AppError {
  constructor(videoId: string, lastError?: Error) {
    super(
      `All fetching strategies failed for video ${videoId}${lastError ? `: ${lastError.message}` : ''}`,
      500,
      'ALL_STRATEGIES_FAILED'
    );
  }
}
