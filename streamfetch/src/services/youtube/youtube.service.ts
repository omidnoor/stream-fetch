import { VideoInfoDto, DownloadUrlDto, DownloadFormatDto } from './youtube.types';
import { YouTubeValidator } from './youtube.validator';
import { YouTubeRepository } from './youtube.repository';
import { YouTubeMapper } from './youtube.mapper';
import { CacheService } from '@/lib/cache/cache.interface';
import { FormatNotFoundError } from '@/lib/errors/youtube.errors';

/**
 * YouTube Service
 *
 * Main service for YouTube operations.
 * Orchestrates validation, caching, data fetching, and transformation.
 *
 * EDUCATIONAL NOTE:
 * Service Pattern - Business logic lives here.
 * - Coordinates between validator, repository, and mapper
 * - Implements caching strategy
 * - Provides clean API for consumers
 * - Easy to test with mocked dependencies
 */
export class YouTubeService {
  constructor(
    private readonly validator: YouTubeValidator,
    private readonly repository: YouTubeRepository,
    private readonly mapper: YouTubeMapper,
    private readonly cache?: CacheService
  ) {}

  /**
   * Get video information from YouTube
   *
   * @param url YouTube video URL
   * @returns Video information with available formats
   * @throws InvalidUrlError if URL is invalid
   * @throws AllStrategiesFailedError if video cannot be fetched
   */
  async getVideoInfo(url: string): Promise<VideoInfoDto> {
    // 1. Validate input
    this.validator.validateUrl(url);
    const videoId = this.validator.extractVideoId(url);

    // 2. Check cache
    if (this.cache) {
      const cacheKey = `video:${videoId}`;
      const cached = await this.cache.get<VideoInfoDto>(cacheKey);

      if (cached) {
        console.log(`[YouTubeService] Cache hit for video: ${videoId}`);
        return cached;
      }
    }

    // 3. Fetch from YouTube
    console.log(`[YouTubeService] Fetching video info from YouTube: ${videoId}`);
    const rawInfo = await this.repository.fetchVideoInfo(videoId);

    // 4. Transform data
    const videoInfo = await this.mapper.mapToVideoInfo(rawInfo);

    // 5. Cache result (1 hour TTL)
    if (this.cache) {
      const cacheKey = `video:${videoId}`;
      await this.cache.set(cacheKey, videoInfo, 3600);
      console.log(`[YouTubeService] Cached video info: ${videoId}`);
    }

    return videoInfo;
  }

  /**
   * Get download URL for a specific format
   *
   * @param url YouTube video URL
   * @param itag Format identifier
   * @returns Download URL and metadata
   * @throws InvalidUrlError if URL is invalid
   * @throws FormatNotFoundError if format is not available
   */
  async getDownloadUrl(url: string, itag: number): Promise<DownloadUrlDto> {
    // 1. Validate input
    this.validator.validateUrl(url);
    this.validator.validateItag(itag);

    const videoId = this.validator.extractVideoId(url);

    // 2. Fetch format details
    let formatInfo: any;

    try {
      formatInfo = await this.repository.fetchFormatUrl(videoId, itag);
    } catch (error) {
      throw new FormatNotFoundError(itag);
    }

    if (!formatInfo.url) {
      throw new FormatNotFoundError(itag);
    }

    // 3. Build response
    return {
      url: formatInfo.url,
      mimeType: formatInfo.mime_type || formatInfo.mimeType || 'video/mp4',
      filename: this.sanitizeFilename(formatInfo.title || 'video'),
      contentLength: formatInfo.content_length || formatInfo.contentLength,
    };
  }

  /**
   * Get download format for streaming
   *
   * Gets the format details needed for streaming a video download.
   * If itag is provided, returns that specific format.
   * If not, returns the highest quality format with audio.
   *
   * @param url YouTube video URL
   * @param itag Optional format identifier
   * @returns Format details for streaming
   * @throws InvalidUrlError if URL is invalid
   * @throws FormatNotFoundError if format is not available
   */
  async getDownloadFormat(url: string, itag?: number): Promise<DownloadFormatDto> {
    // 1. Validate input
    this.validator.validateUrl(url);
    if (itag !== undefined) {
      this.validator.validateItag(itag);
    }

    const videoId = this.validator.extractVideoId(url);

    // 2. Fetch video info (this will use cache if available)
    const rawInfo = await this.repository.fetchVideoInfo(videoId);

    // 3. Get streaming data
    const streamingData = rawInfo.streaming_data || rawInfo.streamingData;
    if (!streamingData) {
      throw new Error('No streaming data available');
    }

    // Combine all formats
    const allFormats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptive_formats || streamingData.adaptiveFormats || [])
    ];

    // 4. Find the requested format
    let selectedFormat: any;

    if (itag) {
      // Find specific format by itag
      selectedFormat = allFormats.find((f: any) => f.itag === itag);
      if (!selectedFormat) {
        throw new FormatNotFoundError(itag);
      }
    } else {
      // Choose best format with audio
      const formatsWithAudio = allFormats.filter(
        (f: any) => f.hasAudio || f.has_audio
      );

      if (formatsWithAudio.length === 0) {
        throw new Error('No formats with audio available');
      }

      // Sort by quality and take the first (highest quality)
      selectedFormat = formatsWithAudio[0];
    }

    // 5. Decipher URL if needed
    const downloadUrl = typeof selectedFormat.decipher === 'function'
      ? await selectedFormat.decipher(rawInfo.session?.player)
      : selectedFormat.url;

    if (!downloadUrl) {
      throw new FormatNotFoundError(itag || selectedFormat.itag);
    }

    // 6. Get video title for filename
    const videoDetails = rawInfo.videoDetails || rawInfo.video_details;
    const title = videoDetails?.title || 'video';

    // 7. Build response
    return {
      url: downloadUrl,
      mimeType: selectedFormat.mime_type || selectedFormat.mimeType || 'video/mp4',
      filename: this.sanitizeFilename(title),
      contentLength: selectedFormat.content_length || selectedFormat.contentLength,
      itag: selectedFormat.itag,
      quality: selectedFormat.quality_label || selectedFormat.qualityLabel || 'unknown',
    };
  }

  /**
   * Sanitize filename by removing invalid characters
   * @private
   */
  private sanitizeFilename(title: string): string {
    // Remove characters that are invalid in filenames
    const sanitized = title.replace(/[<>:"/\\|?*]/g, '_');

    // Limit length to prevent filesystem issues
    const maxLength = 200;
    const truncated = sanitized.length > maxLength
      ? sanitized.substring(0, maxLength)
      : sanitized;

    return `${truncated}.mp4`;
  }

  /**
   * Invalidate cache for a specific video
   *
   * Useful when video info needs to be refreshed
   */
  async invalidateVideoCache(url: string): Promise<void> {
    if (!this.cache) return;

    this.validator.validateUrl(url);
    const videoId = this.validator.extractVideoId(url);
    const cacheKey = `video:${videoId}`;

    await this.cache.del(cacheKey);
    console.log(`[YouTubeService] Invalidated cache for video: ${videoId}`);
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
