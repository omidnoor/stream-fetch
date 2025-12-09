/**
 * Download API Tests
 *
 * Tests for GET /api/download
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';
import type { DownloadFormatDto } from '@/services/youtube/youtube.types';

// Create mock functions first (before any imports)
const mockGetDownloadFormat = jest.fn<(url: string, itag?: number) => Promise<DownloadFormatDto>>();

// Mock global fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/youtube', () => ({
  getYouTubeService: () => ({
    getDownloadFormat: mockGetDownloadFormat,
  }),
}));

// Dynamic import for the route (must be after mock setup)
let GET: typeof import('@/app/api/download/route').GET;

beforeAll(async () => {
  const routeModule = await import('@/app/api/download/route');
  GET = routeModule.GET;
});

describe('GET /api/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDownloadFormat.mockReset();
    mockFetch.mockReset();
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
      mockGetDownloadFormat.mockResolvedValue({
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

      mockFetch.mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', undefined);
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
      mockGetDownloadFormat.mockResolvedValue({
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

      mockFetch.mockResolvedValue({
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
      expect(mockGetDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', 18);
    }, 15000);

    it('should handle different itag formats', async () => {
      // Mock the download format
      mockGetDownloadFormat.mockResolvedValue({
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

      mockFetch.mockResolvedValue({
        ok: true,
        body: mockStream,
        status: 200,
        statusText: 'OK',
      } as Response);

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=243');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('video/webm');
      expect(mockGetDownloadFormat).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123', 243);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle download format errors gracefully', async () => {
      mockGetDownloadFormat.mockRejectedValue(new Error('No streaming data available'));

      const request = createMockRequest('/api/download?url=https://youtube.com/watch?v=abc123&itag=18');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    }, 15000);

    it('should handle fetch errors', async () => {
      // Mock the download format succeeds
      mockGetDownloadFormat.mockResolvedValue({
        itag: 18,
        quality: '360p',
        url: 'https://example.com/video.mp4',
        mimeType: 'video/mp4',
        filename: 'test-video.mp4',
        contentLength: '1024',
      });

      // Mock fetch fails
      mockFetch.mockResolvedValue({
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
