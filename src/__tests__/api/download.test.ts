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
    getDownloadFormat: jest.fn(),
  })),
}));

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

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

    it('should work when itag parameter is missing (uses default format)', async () => {
      // Mock the download format
      mockYouTubeService.getDownloadFormat.mockResolvedValue({
        itag: 18,
        quality: '360p',
        url: 'https://example.com/video.mp4',
        mimeType: 'video/mp4',
        filename: 'test-video.mp4',
        contentLength: '1024',
      });

      // Mock fetch response
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockYouTubeService.getDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', undefined);
    }, 15000);

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
      // Mock the download format
      mockYouTubeService.getDownloadFormat.mockResolvedValue({
        itag: 18,
        quality: '360p',
        url: 'https://example.com/video.mp4',
        mimeType: 'video/mp4; codecs="avc1.42001E"',
        filename: 'test-video.mp4',
        contentLength: '1024',
      });

      // Mock fetch response
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('video/mp4');
      expect(response.headers.get('Content-Disposition')).toContain('test-video.mp4');
      expect(mockYouTubeService.getDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', 18);
    }, 15000);

    it('should handle different itag formats', async () => {
      // Mock the download format
      mockYouTubeService.getDownloadFormat.mockResolvedValue({
        itag: 243,
        quality: '480p',
        url: 'https://example.com/video.webm',
        mimeType: 'video/webm; codecs="vp9"',
        filename: 'test-video.webm',
        contentLength: '2048',
      });

      // Mock fetch response
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=243');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('video/webm');
      expect(mockYouTubeService.getDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', 243);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle download format errors gracefully', async () => {
      mockYouTubeService.getDownloadFormat.mockRejectedValue(new Error('No streaming data available'));

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    }, 15000);

    it('should handle fetch errors', async () => {
      // Mock the download format succeeds
      mockYouTubeService.getDownloadFormat.mockResolvedValue({
        itag: 18,
        quality: '360p',
        url: 'https://example.com/video.mp4',
        mimeType: 'video/mp4',
        filename: 'test-video.mp4',
        contentLength: '1024',
      });

      // Mock fetch fails
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    }, 15000);
  });
});
