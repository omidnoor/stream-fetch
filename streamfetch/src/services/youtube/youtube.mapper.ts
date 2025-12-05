import { VideoInfoDto, FormatDto } from './youtube.types';

/**
 * YouTube Data Mapper
 *
 * Transforms raw YouTube API responses into our application DTOs.
 *
 * EDUCATIONAL NOTE:
 * - Isolates data transformation logic
 * - Handles different response formats from different YouTube clients
 * - Makes it easy to change internal data structures without affecting external APIs
 */
export class YouTubeMapper {
  /**
   * Map raw YouTube API response to VideoInfoDto
   */
  async mapToVideoInfo(rawInfo: any): Promise<VideoInfoDto> {
    const videoDetails = this.extractVideoDetails(rawInfo);
    const formats = await this.extractFormats(rawInfo);

    return {
      video: {
        title: videoDetails.title || 'Unknown',
        thumbnail: this.extractThumbnail(rawInfo),
        duration: parseInt(videoDetails.lengthSeconds || '0'),
        author: videoDetails.author?.name || videoDetails.author || 'Unknown',
        viewCount: videoDetails.viewCount || '0',
      },
      formats: this.filterAndSortFormats(formats),
    };
  }

  /**
   * Extract video details, handling both snake_case and camelCase
   */
  private extractVideoDetails(rawInfo: any) {
    return rawInfo.videoDetails || rawInfo.video_details || {};
  }

  /**
   * Extract thumbnail URL from various possible locations
   */
  private extractThumbnail(rawInfo: any): string {
    let thumbnails: any[] = [];

    // Try different possible locations (matching youtube-helper.ts logic)
    if (rawInfo.basic_info?.thumbnail) {
      console.log('[YouTubeMapper] Found thumbnails in basic_info.thumbnail');
      thumbnails = rawInfo.basic_info.thumbnail;
    } else if (rawInfo.videoDetails?.thumbnail?.thumbnails) {
      console.log('[YouTubeMapper] Found thumbnails in videoDetails.thumbnail.thumbnails');
      thumbnails = rawInfo.videoDetails.thumbnail.thumbnails;
    } else if (rawInfo.videoDetails?.thumbnail) {
      console.log('[YouTubeMapper] Found thumbnails in videoDetails.thumbnail');
      thumbnails = rawInfo.videoDetails.thumbnail;
    } else if (rawInfo.videoDetails?.thumbnails) {
      console.log('[YouTubeMapper] Found thumbnails in videoDetails.thumbnails');
      thumbnails = rawInfo.videoDetails.thumbnails;
    } else if (rawInfo.video_details?.thumbnail?.thumbnails) {
      console.log('[YouTubeMapper] Found thumbnails in video_details.thumbnail.thumbnails');
      thumbnails = rawInfo.video_details.thumbnail.thumbnails;
    } else if (rawInfo.video_details?.thumbnail) {
      console.log('[YouTubeMapper] Found thumbnails in video_details.thumbnail');
      thumbnails = rawInfo.video_details.thumbnail;
    } else if (rawInfo.video_details?.thumbnails) {
      console.log('[YouTubeMapper] Found thumbnails in video_details.thumbnails');
      thumbnails = rawInfo.video_details.thumbnails;
    } else {
      console.log('[YouTubeMapper] No thumbnails found in any location');
      console.log('[YouTubeMapper] Available keys in rawInfo:', Object.keys(rawInfo));
      if (rawInfo.videoDetails || rawInfo.video_details) {
        const details = rawInfo.videoDetails || rawInfo.video_details;
        console.log('[YouTubeMapper] Available keys in videoDetails:', Object.keys(details));
      }
    }

    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      console.log('[YouTubeMapper] Thumbnails array length:', thumbnails.length);
      console.log('[YouTubeMapper] First thumbnail (highest quality):', thumbnails[0]);
      console.log('[YouTubeMapper] Last thumbnail:', thumbnails[thumbnails.length - 1]);

      // Return highest quality (first) thumbnail
      // YouTube provides thumbnails in descending quality order,
      // so the first one is the highest quality
      return thumbnails[0]?.url || '';
    }

    console.log('[YouTubeMapper] Returning empty thumbnail URL');
    return '';
  }

  /**
   * Extract and decipher all available formats
   *
   * IMPORTANT: format.decipher() returns a Promise and MUST be awaited
   */
  private async extractFormats(rawInfo: any): Promise<FormatDto[]> {
    const streamingData = rawInfo.streaming_data || rawInfo.streamingData;

    if (!streamingData) {
      return [];
    }

    const formats: FormatDto[] = [];

    // Combine regular formats and adaptive formats
    const allFormats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptive_formats || streamingData.adaptiveFormats || [])
    ];

    for (const format of allFormats) {
      // Skip formats without video
      const hasVideo = format.has_video || format.hasVideo;
      if (!hasVideo) continue;

      // Decipher URL if needed (MUST await!)
      const url = typeof format.decipher === 'function'
        ? await format.decipher(rawInfo.session?.player)
        : (format.url || '');

      // Only include formats with valid URLs
      if (!url) continue;

      formats.push({
        itag: format.itag,
        quality: format.quality_label || format.qualityLabel || 'unknown',
        container: this.extractContainer(format.mime_type || format.mimeType),
        hasAudio: format.has_audio || format.hasAudio || false,
        hasVideo: true,
        filesize: this.parseFilesize(format.content_length || format.contentLength),
        fps: format.fps || null,
        codec: format.mime_type || format.mimeType || null,
      });
    }

    return formats;
  }

  /**
   * Extract container format from MIME type
   * e.g., "video/mp4; codecs=..." -> "mp4"
   */
  private extractContainer(mimeType: string): string {
    if (!mimeType) return 'mp4';

    const parts = mimeType.split('/');
    if (parts.length < 2) return 'mp4';

    const containerPart = parts[1].split(';')[0];
    return containerPart || 'mp4';
  }

  /**
   * Parse filesize from string to number
   */
  private parseFilesize(contentLength: string | undefined): number | null {
    if (!contentLength) return null;

    const parsed = parseInt(contentLength);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Filter and sort formats
   * - Only keep formats with audio (for direct playback)
   * - Remove duplicates (same quality)
   * - Sort by quality (highest first)
   */
  private filterAndSortFormats(formats: FormatDto[]): FormatDto[] {
    // Only formats with audio for direct playback
    const withAudio = formats.filter(f => f.hasAudio);

    // Quality priority mapping
    const qualityOrder: Record<string, number> = {
      '2160p': 5,
      '1440p': 4,
      '1080p': 3,
      '720p': 2,
      '480p': 1,
      '360p': 0,
    };

    return withAudio
      // Sort by quality (highest first)
      .sort((a, b) => {
        const orderA = qualityOrder[a.quality] ?? -1;
        const orderB = qualityOrder[b.quality] ?? -1;
        return orderB - orderA;
      })
      // Remove duplicates (keep first of each quality)
      .filter((format, index, self) =>
        index === self.findIndex(f => f.quality === format.quality)
      );
  }
}
