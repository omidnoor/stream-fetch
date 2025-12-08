/**
 * Video Info API Tests
 *
 * Tests for GET /api/video-info
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';
import type { VideoInfoDto } from '@/services/youtube';

// Create mock functions first (before any imports)
const mockGetVideoInfo = jest.fn<(url: string) => Promise<VideoInfoDto>>();

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/youtube', () => ({
  getYouTubeService: () => ({
    getVideoInfo: mockGetVideoInfo,
  }),
}));

// Dynamic import for the route (must be after mock setup)
let GET: typeof import('@/app/api/video-info/route').GET;

beforeAll(async () => {
  const routeModule = await import('@/app/api/video-info/route');
  GET = routeModule.GET;
});

describe('GET /api/video-info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVideoInfo.mockReset();
  });

  describe('Parameter Validation', () => {
    it('should return 400 when URL parameter is missing', async () => {
      const request = createMockRequest('/api/video-info');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PARAMETER');
      expect(data.error.message).toBe('URL parameter is required');
    });

    it('should return 400 when URL parameter is empty', async () => {
      const request = createMockRequest('/api/video-info?url=');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Successful Requests', () => {
    it('should return video info for valid YouTube URL', async () => {
      const mockVideoInfo: VideoInfoDto = {
        video: {
          title: 'Test Video',
          duration: 120,
          thumbnail: 'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
          author: 'Test Channel',
          viewCount: '1000',
        },
        formats: [
          { itag: 18, quality: '360p', container: 'mp4', hasAudio: true, hasVideo: true, filesize: 1024000, fps: 30, codec: 'avc1' },
          { itag: 22, quality: '720p', container: 'mp4', hasAudio: true, hasVideo: true, filesize: 2048000, fps: 30, codec: 'avc1' },
        ],
      };

      mockGetVideoInfo.mockResolvedValue(mockVideoInfo);

      const request = createMockRequest('/api/video-info?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockVideoInfo);
      expect(data.data.video.title).toBe('Test Video');
      expect(data.data.formats).toHaveLength(2);
    });

    it('should handle short YouTube URLs', async () => {
      const mockVideoInfo: VideoInfoDto = {
        video: {
          title: 'Short URL Video',
          duration: 60,
          thumbnail: 'https://i.ytimg.com/vi/abc123/default.jpg',
          author: 'Test Channel',
          viewCount: '500',
        },
        formats: [],
      };

      mockGetVideoInfo.mockResolvedValue(mockVideoInfo);

      const request = createMockRequest('/api/video-info?url=https://youtu.be/abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetVideoInfo).toHaveBeenCalledWith('https://youtu.be/abc123');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockGetVideoInfo.mockRejectedValue(new Error('Video not found'));

      const request = createMockRequest('/api/video-info?url=https://youtube.com/watch?v=invalid');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle network timeouts', async () => {
      mockGetVideoInfo.mockRejectedValue(new Error('Request timeout'));

      const request = createMockRequest('/api/video-info?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
