import { jest, describe, it, expect, beforeEach } from '@jest/globals';
/**
 * Dubbing API Tests
 *
 * Tests for:
 * - POST /api/dubbing/create
 * - GET /api/dubbing/status
 * - GET /api/dubbing/download
 */

import { POST as createDubbing } from '@/app/api/dubbing/create/route';
import { GET as getStatus } from '@/app/api/dubbing/status/route';
import { GET as downloadDubbing } from '@/app/api/dubbing/download/route';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Mock the Dubbing service
jest.mock('@/services/dubbing', () => ({
  getDubbingService: jest.fn(() => ({
    createDubbingJob: jest.fn(),
    getJobStatus: jest.fn(),
    downloadDubbedAudio: jest.fn(),
  })),
}));

import { getDubbingService } from '@/services/dubbing';

describe('Dubbing API', () => {
  const mockDubbingService = getDubbingService() as jest.Mocked<ReturnType<typeof getDubbingService>>;

  beforeEach(() => {
    jest.clearAllMocks();
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

        mockDubbingService.createDubbingJob.mockResolvedValue(mockJob);

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
        mockDubbingService.createDubbingJob.mockResolvedValue(mockJob);

        const request = createMockRequest('/api/dubbing/create', {
          method: 'POST',
          body: {
            sourceUrl: 'https://youtube.com/watch?v=abc123',
            targetLanguage: 'fr',
          },
        });
        await createDubbing(request);

        expect(mockDubbingService.createDubbingJob).toHaveBeenCalledWith(
          expect.objectContaining({ watermark: true })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors', async () => {
        mockDubbingService.createDubbingJob.mockRejectedValue(new Error('ElevenLabs API error'));

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

        mockDubbingService.getJobStatus.mockResolvedValue(mockStatus);

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

        mockDubbingService.getJobStatus.mockResolvedValue(mockStatus);

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
        const mockStream = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
            controller.close();
          },
        });

        mockDubbingService.downloadDubbedAudio.mockResolvedValue({
          stream: mockStream,
          contentType: 'audio/mpeg',
        });

        const request = createMockRequest('/api/dubbing/download?dubbingId=dub-123&targetLanguage=es');
        const response = await downloadDubbing(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
      });
    });
  });
});
