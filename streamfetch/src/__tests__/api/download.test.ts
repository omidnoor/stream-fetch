/**
 * Download API Tests
 *
 * Tests for GET /api/download
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '@/app/api/download/route';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Mock the YouTube service
jest.mock('@/services/youtube', () => ({
  getYouTubeService: jest.fn(() => ({
    getStreamUrl: jest.fn(),
    streamVideo: jest.fn(),
  })),
}));

import { getYouTubeService } from '@/services/youtube';

describe('GET /api/download', () => {
  const mockYouTubeService = getYouTubeService() as jest.Mocked<ReturnType<typeof getYouTubeService>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parameter Validation', () => {
    it('should return 400 when URL parameter is missing', async () => {
      const request = createMockRequest('/api/download?itag=18');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PARAMETER');
    });

    it('should return 400 when itag parameter is missing', async () => {
      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_PARAMETER');
    });

    it('should return 400 when both parameters are missing', async () => {
      const request = createMockRequest('/api/download');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Successful Downloads', () => {
    it('should return stream response for valid parameters', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      mockYouTubeService.streamVideo.mockResolvedValue({
        stream: mockStream,
        contentType: 'video/mp4',
        contentLength: 1024,
      });

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('video/mp4');
    });

    it('should handle different itag formats', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockYouTubeService.streamVideo.mockResolvedValue({
        stream: mockStream,
        contentType: 'video/webm',
        contentLength: 2048,
      });

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=243');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockYouTubeService.streamVideo).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle stream errors gracefully', async () => {
      mockYouTubeService.streamVideo.mockRejectedValue(new Error('Stream unavailable'));

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle invalid itag values', async () => {
      mockYouTubeService.streamVideo.mockRejectedValue(new Error('Invalid format'));

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=9999');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
