import { InvalidUrlError } from '@/lib/errors/youtube.errors';

/**
 * YouTube URL Validator
 *
 * Handles validation and extraction of YouTube video IDs from URLs.
 *
 * EDUCATIONAL NOTE:
 * Separation of Concerns - Validation logic is isolated here,
 * making it easy to test and reuse across the application.
 */
export class YouTubeValidator {
  private readonly URL_PATTERNS = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    // Direct video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/
  ];

  /**
   * Validate a YouTube URL
   * @throws InvalidUrlError if URL is invalid
   */
  validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new InvalidUrlError('URL is required and must be a string');
    }

    if (url.trim().length === 0) {
      throw new InvalidUrlError('URL cannot be empty');
    }

    if (!this.isValidYouTubeUrl(url)) {
      throw new InvalidUrlError(url);
    }
  }

  /**
   * Check if a URL is a valid YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    return this.URL_PATTERNS.some(pattern => pattern.test(url));
  }

  /**
   * Extract video ID from a YouTube URL
   * @throws InvalidUrlError if video ID cannot be extracted
   */
  extractVideoId(url: string): string {
    for (const pattern of this.URL_PATTERNS) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new InvalidUrlError(url);
  }

  /**
   * Validate an itag (format identifier)
   */
  validateItag(itag: number): void {
    if (!Number.isInteger(itag) || itag <= 0) {
      throw new Error('Invalid itag: must be a positive integer');
    }
  }
}
