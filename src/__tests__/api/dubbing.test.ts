/**
 * Dubbing API Tests
 *
 * Tests for:
 * - POST /api/dubbing/create
 * - GET /api/dubbing/status
 * - GET /api/dubbing/download
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Create mock functions first (before any imports)
// Using generic mock types for flexibility in test data
const mockCreateDubbingJob = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockGetDubbingStatus = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockDownloadDubbedAudio = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/dubbing', () => ({
  getDubbingService: () => ({
    createDubbingJob: mockCreateDubbingJob,
    getDubbingStatus: mockGetDubbingStatus,
    downloadDubbedAudio: mockDownloadDubbedAudio,
  }),
}));

// Dynamic import for the routes (must be after mock setup)
let createDubbing: typeof import('@/app/api/dubbing/create/route').POST;
let getStatus: typeof import('@/app/api/dubbing/status/route').GET;
let downloadDubbing: typeof import('@/app/api/dubbing/download/route').GET;

beforeAll(async () => {
  // Import sequentially to avoid ESM module caching issues
  const createModule = await import('@/app/api/dubbing/create/route');
  createDubbing = createModule.POST;

  const statusModule = await import('@/app/api/dubbing/status/route');
  getStatus = statusModule.GET;

  const downloadModule = await import('@/app/api/dubbing/download/route');
  downloadDubbing = downloadModule.GET;
});

describe('Dubbing API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDubbingJob.mockReset();
    mockGetDubbingStatus.mockReset();
    mockDownloadDubbedAudio.mockReset();
  });

  describe('POST /api/dubbing/create', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when sourceUrl is missing', async () => {
        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: { targetLanguage: 'es' },
        });
        const response = await createDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_PARAMETER');
        expect(data.error.message).toBe('sourceUrl is required');
      });

      it('should return 400 when targetLanguage is missing', async () => {
        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: { sourceUrl: 'https://youtube.com/watch?v=abc123' },
        });
        const response = await createDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_PARAMETER');
        expect(data.error.message).toBe('targetLanguage is required');
      });
    });

    describe('Successful Job Creation', () => {
      it('should create dubbing job with valid parameters', async () => {
        const mockJob = {
          dubbingId: 'dub-123456',
          status: 'pending',
          targetLanguage: 'es',
          sourceLanguage: 'en',
          progress: 0,
        };

        mockCreateDubbingJob.mockResolvedValue(mockJob);

        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: {
            sourceUrl: 'https://youtube.com/watch?v=abc123',
            targetLanguage: 'es',
            sourceLanguage: 'en',
            numSpeakers: 2,
          },
        });
        const response = await createDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.dubbingId).toBe('dub-123456');
        expect(data.message).toBe('Dubbing job created successfully');
      });

      it('should use default watermark value when not provided', async () => {
        const mockJob = { dubbingId: 'dub-789' };
        mockCreateDubbingJob.mockResolvedValue(mockJob);

        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: {
            sourceUrl: 'https://youtube.com/watch?v=abc123',
            targetLanguage: 'fr',
          },
        });
        await createDubbing(request);

        expect(mockCreateDubbingJob).toHaveBeenCalledWith(
          expect.objectContaining({ watermark: true })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors', async () => {
        mockCreateDubbingJob.mockRejectedValue(new Error('ElevenLabs API error'));

        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: {
            sourceUrl: 'https://youtube.com/watch?v=abc123',
            targetLanguage: 'es',
          },
        });
        const response = await createDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });
  });

  describe('GET /api/dubbing/status', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when dubbingId is missing', async () => {
        const request = createMockRequest('/api/dubbing/status');
        const response = await getStatus(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Successful Status Retrieval', () => {
      it('should return job status for valid dubbingId', async () => {
        const mockStatus = {
          dubbingId: 'dub-123',
          status: 'processing',
          progress: 45,
        };

        mockGetDubbingStatus.mockResolvedValue(mockStatus);

        const request = createMockRequest('/api/dubbing/status?dubbingId=dub-123');
        const response = await getStatus(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.progress).toBe(45);
      });

      it('should return completed status', async () => {
        const mockStatus = {
          dubbingId: 'dub-123',
          status: 'completed',
          progress: 100,
        };

        mockGetDubbingStatus.mockResolvedValue(mockStatus);

        const request = createMockRequest('/api/dubbing/status?dubbingId=dub-123');
        const response = await getStatus(request);
        const data = await parseJsonResponse(response);

        expect(data.data.status).toBe('completed');
        expect(data.data.progress).toBe(100);
      });
    });
  });

  describe('GET /api/dubbing/download', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when dubbingId is missing', async () => {
        const request = createMockRequest('/api/dubbing/download?targetLanguage=es');
        const response = await downloadDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should return 400 when targetLanguage is missing', async () => {
        const request = createMockRequest('/api/dubbing/download?dubbingId=dub-123');
        const response = await downloadDubbing(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Successful Downloads', () => {
      it('should stream audio for completed job', async () => {
        const mockAudioBuffer = Buffer.from([1, 2, 3, 4, 5]);

        mockDownloadDubbedAudio.mockResolvedValue({
          dubbingId: 'dub-123',
          targetLanguage: 'es',
          audioBuffer: mockAudioBuffer,
          filename: 'dubbed-audio-es.mp3',
          mimeType: 'audio/mpeg',
        });

        const request = createMockRequest('/api/dubbing/download?dubbingId=dub-123&targetLanguage=es');
        const response = await downloadDubbing(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
        expect(response.headers.get('Content-Disposition')).toContain('dubbed-audio-es.mp3');
        expect(mockDownloadDubbedAudio).toHaveBeenCalledWith('dub-123', 'es');
      });
    });
  });
});
