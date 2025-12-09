/**
 * YouTube Mapper Tests
 *
 * Tests for YouTube API response transformation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { YouTubeMapper } from '@/services/youtube/youtube.mapper';

describe('YouTubeMapper', () => {
  let mapper: YouTubeMapper;

  beforeEach(() => {
    mapper = new YouTubeMapper();
  });

  describe('mapToVideoInfo', () => {
    it('should map basic video info correctly', async () => {
      const rawInfo = {
        videoDetails: {
          title: 'Test Video',
          lengthSeconds: '120',
          author: { name: 'Test Channel' },
          viewCount: '1000',
        },
        streaming_data: {
          formats: [],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.video.title).toBe('Test Video');
      expect(result.video.duration).toBe(120);
      expect(result.video.author).toBe('Test Channel');
      expect(result.video.viewCount).toBe('1000');
    });

    it('should handle snake_case video_details', async () => {
      const rawInfo = {
        video_details: {
          title: 'Snake Case Video',
          lengthSeconds: '240',
          author: 'Snake Channel',
          viewCount: '5000',
        },
        streaming_data: {
          formats: [],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.video.title).toBe('Snake Case Video');
      expect(result.video.duration).toBe(240);
      expect(result.video.author).toBe('Snake Channel');
    });

    it('should provide defaults for missing data', async () => {
      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.video.title).toBe('Unknown');
      expect(result.video.duration).toBe(0);
      expect(result.video.author).toBe('Unknown');
      expect(result.video.viewCount).toBe('0');
    });

    it('should handle author as string or object', async () => {
      const rawInfo1 = {
        videoDetails: {
          author: { name: 'Channel Name' },
        },
        streaming_data: { formats: [] },
      };

      const result1 = await mapper.mapToVideoInfo(rawInfo1);
      expect(result1.video.author).toBe('Channel Name');

      const rawInfo2 = {
        videoDetails: {
          author: 'Direct String',
        },
        streaming_data: { formats: [] },
      };

      const result2 = await mapper.mapToVideoInfo(rawInfo2);
      expect(result2.video.author).toBe('Direct String');
    });
  });

  describe('extractThumbnail', () => {
    it('should extract thumbnail from basic_info.thumbnail', async () => {
      const rawInfo = {
        basic_info: {
          thumbnail: [
            { url: 'https://i.ytimg.com/vi/abc/maxresdefault.jpg' },
            { url: 'https://i.ytimg.com/vi/abc/sddefault.jpg' },
          ],
        },
        videoDetails: {},
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('https://i.ytimg.com/vi/abc/maxresdefault.jpg');
    });

    it('should extract thumbnail from videoDetails.thumbnail.thumbnails', async () => {
      const rawInfo = {
        videoDetails: {
          thumbnail: {
            thumbnails: [
              { url: 'https://i.ytimg.com/vi/def/maxresdefault.jpg' },
              { url: 'https://i.ytimg.com/vi/def/sddefault.jpg' },
            ],
          },
        },
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('https://i.ytimg.com/vi/def/maxresdefault.jpg');
    });

    it('should extract thumbnail from videoDetails.thumbnail (array)', async () => {
      const rawInfo = {
        videoDetails: {
          thumbnail: [
            { url: 'https://i.ytimg.com/vi/ghi/maxresdefault.jpg' },
            { url: 'https://i.ytimg.com/vi/ghi/sddefault.jpg' },
          ],
        },
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('https://i.ytimg.com/vi/ghi/maxresdefault.jpg');
    });

    it('should extract thumbnail from video_details (snake_case)', async () => {
      const rawInfo = {
        video_details: {
          thumbnail: [
            { url: 'https://i.ytimg.com/vi/jkl/maxresdefault.jpg' },
          ],
        },
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('https://i.ytimg.com/vi/jkl/maxresdefault.jpg');
    });

    it('should return empty string when no thumbnails found', async () => {
      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('');
    });

    it('should return highest quality (first) thumbnail', async () => {
      const rawInfo = {
        basic_info: {
          thumbnail: [
            { url: 'https://i.ytimg.com/vi/xyz/maxresdefault.jpg', width: 1280 },
            { url: 'https://i.ytimg.com/vi/xyz/hqdefault.jpg', width: 480 },
            { url: 'https://i.ytimg.com/vi/xyz/default.jpg', width: 120 },
          ],
        },
        videoDetails: {},
        streaming_data: { formats: [] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);
      expect(result.video.thumbnail).toBe('https://i.ytimg.com/vi/xyz/maxresdefault.jpg');
    });
  });

  describe('extractFormats', () => {
    it('should extract formats from streaming_data', async () => {
      const mockFormat = {
        itag: 18,
        quality_label: '360p',
        mime_type: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
        has_video: true,
        has_audio: true,
        content_length: '10000000',
        fps: 30,
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [mockFormat],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(1);
      expect(result.formats[0].itag).toBe(18);
      expect(result.formats[0].quality).toBe('360p');
      expect(result.formats[0].container).toBe('mp4');
      expect(result.formats[0].hasAudio).toBe(true);
      expect(result.formats[0].hasVideo).toBe(true);
      expect(result.formats[0].filesize).toBe(10000000);
      expect(result.formats[0].fps).toBe(30);
    });

    it('should handle camelCase streamingData and adaptiveFormats', async () => {
      const mockFormat = {
        itag: 22,
        qualityLabel: '720p',
        mimeType: 'video/mp4',
        hasVideo: true,
        hasAudio: true,
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streamingData: {
          adaptiveFormats: [mockFormat],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(1);
      expect(result.formats[0].itag).toBe(22);
      expect(result.formats[0].quality).toBe('720p');
    });

    it('should skip formats without video', async () => {
      const audioOnlyFormat = {
        itag: 140,
        quality_label: 'audio',
        has_video: false,
        has_audio: true,
        url: 'https://example.com/audio.m4a',
      };

      const videoFormat = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [audioOnlyFormat, videoFormat],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(1);
      expect(result.formats[0].itag).toBe(18);
    });

    it('should skip formats without URL', async () => {
      const formatWithoutUrl = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        // No URL
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [formatWithoutUrl],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(0);
    });

    it('should combine regular and adaptive formats', async () => {
      const regularFormat = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video1.mp4',
      };

      const adaptiveFormat = {
        itag: 22,
        quality_label: '720p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video2.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [regularFormat],
          adaptive_formats: [adaptiveFormat],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(2);
    });
  });

  describe('filterAndSortFormats', () => {
    it('should filter out formats without audio', async () => {
      const withAudio = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video1.mp4',
      };

      const withoutAudio = {
        itag: 137,
        quality_label: '1080p',
        has_video: true,
        has_audio: false,
        url: 'https://example.com/video2.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [withAudio, withoutAudio],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(1);
      expect(result.formats[0].itag).toBe(18);
      expect(result.formats[0].hasAudio).toBe(true);
    });

    it('should sort formats by quality (highest first)', async () => {
      const format360p = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/360p.mp4',
      };

      const format1080p = {
        itag: 22,
        quality_label: '1080p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/1080p.mp4',
      };

      const format720p = {
        itag: 59,
        quality_label: '720p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/720p.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [format360p, format1080p, format720p],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(3);
      expect(result.formats[0].quality).toBe('1080p');
      expect(result.formats[1].quality).toBe('720p');
      expect(result.formats[2].quality).toBe('360p');
    });

    it('should remove duplicate qualities (keep first)', async () => {
      const format720p_1 = {
        itag: 22,
        quality_label: '720p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/720p_first.mp4',
      };

      const format720p_2 = {
        itag: 59,
        quality_label: '720p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/720p_second.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: {
          formats: [format720p_1, format720p_2],
        },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toHaveLength(1);
      expect(result.formats[0].itag).toBe(22); // First one kept
    });
  });

  describe('extractContainer', () => {
    it('should extract container from MIME type', async () => {
      const formats = [
        {
          itag: 18,
          quality_label: '360p',
          mime_type: 'video/mp4; codecs="avc1.42001E"',
          has_video: true,
          has_audio: true,
          url: 'https://example.com/video.mp4',
        },
        {
          itag: 43,
          quality_label: '480p',
          mime_type: 'video/webm; codecs="vp8.0"',
          has_video: true,
          has_audio: true,
          url: 'https://example.com/video.webm',
        },
      ];

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      // Results are sorted by quality (480p, then 360p)
      expect(result.formats.length).toBe(2);
      expect(result.formats[0].container).toBe('webm'); // 480p comes first
      expect(result.formats[1].container).toBe('mp4');  // 360p comes second
    });

    it('should default to mp4 for missing MIME type', async () => {
      const format = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [format] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats[0].container).toBe('mp4');
    });
  });

  describe('parseFilesize', () => {
    it('should parse valid filesize strings', async () => {
      const format = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        content_length: '15000000',
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [format] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats[0].filesize).toBe(15000000);
    });

    it('should return null for missing filesize', async () => {
      const format = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [format] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats[0].filesize).toBeNull();
    });

    it('should return null for invalid filesize', async () => {
      const format = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        content_length: 'invalid',
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [format] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats[0].filesize).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty streaming_data', async () => {
      const rawInfo = {
        videoDetails: { title: 'Test' },
        streaming_data: {},
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toEqual([]);
    });

    it('should handle missing streaming_data', async () => {
      const rawInfo = {
        videoDetails: { title: 'Test' },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats).toEqual([]);
    });

    it('should handle unknown quality labels', async () => {
      const format = {
        itag: 999,
        quality_label: 'custom_quality',
        has_video: true,
        has_audio: true,
        url: 'https://example.com/video.mp4',
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [format] },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(result.formats[0].quality).toBe('custom_quality');
    });

    it('should handle formats with decipher function', async () => {
      const formatWithDecipher = {
        itag: 18,
        quality_label: '360p',
        has_video: true,
        has_audio: true,
        decipher: jest.fn(async (_player: unknown) => 'https://deciphered.example.com/video.mp4'),
      };

      const rawInfo = {
        videoDetails: {},
        streaming_data: { formats: [formatWithDecipher] },
        session: { player: {} },
      };

      const result = await mapper.mapToVideoInfo(rawInfo);

      expect(formatWithDecipher.decipher).toHaveBeenCalledWith({});
      expect(result.formats).toHaveLength(1);
    });
  });
});
