/**
 * Image Generation API Tests
 *
 * Tests for:
 * - POST /api/image-gen
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Create mock functions
const mockGenerateImage = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();

// Mock the gemini-helper module
jest.unstable_mockModule('@/lib/gemini-helper', () => ({
  generateImage: mockGenerateImage,
  // Re-export types for the route
  ASPECT_RATIOS: [{ value: '1:1', label: 'Square' }],
  IMAGE_SIZES: [{ value: '1K', label: '1K' }],
  GEMINI_MODELS: [{ value: 'gemini-2.5-flash-image', label: 'Flash' }],
}));

// Dynamic import for the route (must be after mock setup)
let imageGenRoute: typeof import('@/app/api/image-gen/route').POST;

beforeAll(async () => {
  const module = await import('@/app/api/image-gen/route');
  imageGenRoute = module.POST;
});

describe('Image Generation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateImage.mockReset();
  });

  describe('POST /api/image-gen', () => {
    describe('Parameter Validation', () => {
      it('should return 400 when prompt is missing', async () => {
        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: {},
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.error).toBe('Prompt is required');
      });

      it('should return 400 when prompt is empty', async () => {
        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: '   ' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.error).toBe('Prompt is required');
      });

      it('should return 400 when prompt is too long', async () => {
        const longPrompt = 'a'.repeat(10001);
        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: longPrompt },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.error).toBe('Prompt is too long (max 10000 characters)');
      });
    });

    describe('Successful Image Generation', () => {
      const mockImageResult = {
        images: [
          {
            base64: 'mockBase64ImageData',
            mimeType: 'image/png',
          },
        ],
        text: 'Generated successfully',
      };

      it('should generate image with valid prompt', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: 'A beautiful mountain landscape' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.images).toHaveLength(1);
        expect(data.images[0].base64).toBe('mockBase64ImageData');
      });

      it('should pass model option to generateImage', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: {
            prompt: 'Test prompt',
            model: 'gemini-3-pro-image-preview',
          },
        });
        await imageGenRoute(request);

        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'gemini-3-pro-image-preview',
          })
        );
      });

      it('should pass aspectRatio option to generateImage', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: {
            prompt: 'Test prompt',
            aspectRatio: '16:9',
          },
        });
        await imageGenRoute(request);

        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({
            aspectRatio: '16:9',
          })
        );
      });

      it('should pass imageSize option to generateImage', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: {
            prompt: 'Test prompt',
            imageSize: '2K',
          },
        });
        await imageGenRoute(request);

        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({
            imageSize: '2K',
          })
        );
      });

      it('should include text in response when available', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: 'Test' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(data.text).toBe('Generated successfully');
      });

      it('should trim prompt whitespace', async () => {
        mockGenerateImage.mockResolvedValue(mockImageResult);

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: '  Test prompt with spaces  ' },
        });
        await imageGenRoute(request);

        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: 'Test prompt with spaces',
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle safety filter errors with 400 status', async () => {
        mockGenerateImage.mockRejectedValue(
          new Error('Content was blocked by safety filters')
        );

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: 'Inappropriate content' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('safety');
      });

      it('should handle API errors with 500 status', async () => {
        mockGenerateImage.mockRejectedValue(new Error('API connection failed'));

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: 'Valid prompt' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('API connection failed');
      });

      it('should handle unknown errors gracefully', async () => {
        mockGenerateImage.mockRejectedValue('Unknown error type');

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: { prompt: 'Valid prompt' },
        });
        const response = await imageGenRoute(request);
        const data = await parseJsonResponse(response);

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('Reference Images', () => {
      it('should pass reference images for editing', async () => {
        mockGenerateImage.mockResolvedValue({
          images: [{ base64: 'edited', mimeType: 'image/png' }],
        });

        const request = createMockRequest('/api/image-gen', {
          method: 'POST',
          body: {
            prompt: 'Make this image brighter',
            referenceImages: ['base64image1', 'base64image2'],
          },
        });
        await imageGenRoute(request);

        expect(mockGenerateImage).toHaveBeenCalledWith(
          expect.objectContaining({
            referenceImages: ['base64image1', 'base64image2'],
          })
        );
      });
    });
  });
});
