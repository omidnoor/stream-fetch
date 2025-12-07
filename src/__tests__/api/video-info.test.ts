/**
 * Video Info API Tests
 *
 * Tests for GET /api/video-info
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '@/app/api/video-info/route';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Mock the YouTube service
jest.mock('@/services/youtube', () => ({
  getYouTubeService: jest.fn(() => ({
    getVideoInfo: jest.fn(),
  })),
}));

import { getYouTubeService } from '@/services/youtube';

describe('GET /api/video-info', () => {
  const mockYouTubeService = getYouTubeService() as jest.Mocked<ReturnType<typeof getYouTubeService>>;

  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockVideoInfo = {
        video: {
          title: 'Test Video',
          duration: 120,
          thumbnail: 'https://i.ytimg.com/vi/abc123/maxresdefault.jpg',
          channel: 'Test Channel',
        },
        formats: [
          { itag: 18, quality: '360p', mimeType: 'video/mp4' },
          { itag: 22, quality: '720p', mimeType: 'video/mp4' },
        ],
      };

      mockYouTubeService.getVideoInfo.mockResolvedValue(mockVideoInfo);

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
      const mockVideoInfo = {
        video: { title: 'Short URL Video', duration: 60 },
        formats: [],
      };

      mockYouTubeService.getVideoInfo.mockResolvedValue(mockVideoInfo);

      const request = createMockRequest('/api/video-info?url=https://youtu.be/abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockYouTubeService.getVideoInfo).toHaveBeenCalledWith('https://youtu.be/abc123');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockYouTubeService.getVideoInfo.mockRejectedValue(new Error('Video not found'));

      const request = createMockRequest('/api/video-info?url=https://youtube.com/watch?v=invalid');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle network timeouts', async () => {
      mockYouTubeService.getVideoInfo.mockRejectedValue(new Error('Request timeout'));

      const request = createMockRequest('/api/video-info?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
