import { Innertube, UniversalCache } from 'youtubei.js';
import { AllStrategiesFailedError, VideoNotFoundError } from '@/lib/errors/youtube.errors';

/**
 * YouTube Repository
 *
 * Handles all direct communication with YouTube's API.
 * Implements multiple fallback strategies for reliability.
 */
export class YouTubeRepository {
  private readonly FALLBACK_CLIENTS = [
    'ANDROID',
    'IOS',
    'TV_EMBEDDED',
    'WEB'
  ] as const;

  /**
   * Fetch video information using multiple fallback strategies
   *
   * Tries different YouTube client types until one succeeds.
   * This improves reliability as different clients may work at different times.
   *
   * @param videoId YouTube video ID
   * @returns Raw video information from YouTube API
   * @throws AllStrategiesFailedError if all strategies fail
   */
  async fetchVideoInfo(videoId: string): Promise<any> {
    let lastError: Error | null = null;

    for (const clientType of this.FALLBACK_CLIENTS) {
      try {
        console.log(`[YouTubeRepository] Trying ${clientType} client for video: ${videoId}`);

        const info = await this.fetchWithClient(videoId, clientType);

        console.log(`[YouTubeRepository] ✅ Success with ${clientType} client`);

        return info;

      } catch (error) {
        console.warn(`[YouTubeRepository] ❌ ${clientType} client failed:`, error);
        lastError = error as Error;
        // Continue to next strategy
      }
    }

    // All strategies failed
    throw new AllStrategiesFailedError(videoId, lastError || undefined);
  }

  /**
   * Fetch video info using a specific YouTube client type
   *
   * @private
   */
  private async fetchWithClient(
    videoId: string,
    clientType: typeof this.FALLBACK_CLIENTS[number]
  ): Promise<any> {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });

    // Web client uses a different method
    if (clientType === 'WEB') {
      return await yt.getInfo(videoId);
    }

    // Other clients use the player endpoint
    return await yt.actions.execute('/player', {
      videoId,
      client: clientType as any,
      parse: true
    });
  }

  /**
   * Fetch a specific format's download URL
   *
   * @param videoId YouTube video ID
   * @param itag Format identifier
   * @returns Raw format information with deciphered URL
   */
  async fetchFormatUrl(videoId: string, itag: number): Promise<any> {
    const info = await this.fetchVideoInfo(videoId);

    const streamingData = info.streaming_data || info.streamingData;
    if (!streamingData) {
      throw new Error('No streaming data available');
    }

    // Search in both regular and adaptive formats
    const allFormats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptive_formats || streamingData.adaptiveFormats || [])
    ];

    const format = allFormats.find((f: any) => f.itag === itag);
    if (!format) {
      throw new Error(`Format with itag ${itag} not found`);
    }

    // Decipher URL if needed
    const url = typeof format.decipher === 'function'
      ? await format.decipher(info.session?.player)
      : format.url;

    return {
      ...format,
      url,
      title: info.videoDetails?.title || info.video_details?.title,
    };
  }
}
