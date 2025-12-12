/**
 * Gemini Helper Tests
 *
 * Tests for:
 * - getGeminiClient
 * - generateImage
 * - Type exports
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the @google/genai module
const mockGenerateContent = jest.fn();
const mockGoogleGenAI = jest.fn(() => ({
  models: {
    generateContent: mockGenerateContent,
  },
}));

jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAI,
}));

// Dynamic imports after mocking
let getGeminiClient: typeof import('@/lib/gemini-helper').getGeminiClient;
let generateImage: typeof import('@/lib/gemini-helper').generateImage;
let ASPECT_RATIOS: typeof import('@/lib/gemini-helper').ASPECT_RATIOS;
let IMAGE_SIZES: typeof import('@/lib/gemini-helper').IMAGE_SIZES;
let GEMINI_MODELS: typeof import('@/lib/gemini-helper').GEMINI_MODELS;

beforeEach(async () => {
  jest.clearAllMocks();

  // Store original env
  process.env.GEMINI_API_KEY = 'test-api-key';

  const module = await import('@/lib/gemini-helper');
  getGeminiClient = module.getGeminiClient;
  generateImage = module.generateImage;
  ASPECT_RATIOS = module.ASPECT_RATIOS;
  IMAGE_SIZES = module.IMAGE_SIZES;
  GEMINI_MODELS = module.GEMINI_MODELS;
});

describe('Gemini Helper', () => {
  describe('getGeminiClient', () => {
    it('should create a client with API key', () => {
      const client = getGeminiClient();

      expect(mockGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(client).toBeDefined();
    });

    it('should throw error when API key is missing', () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      expect(() => getGeminiClient()).toThrow('GEMINI_API_KEY is not set');

      process.env.GEMINI_API_KEY = originalKey;
    });
  });

  describe('generateImage', () => {
    const mockImageResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64encodedimage',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };

    beforeEach(() => {
      mockGenerateContent.mockReset();
    });

    it('should generate image with basic prompt', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      const result = await generateImage({ prompt: 'A beautiful sunset' });

      expect(result.images).toHaveLength(1);
      expect(result.images[0].base64).toBe('base64encodedimage');
      expect(result.images[0].mimeType).toBe('image/png');
    });

    it('should use default model when not specified', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      await generateImage({ prompt: 'Test prompt' });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash-image',
        })
      );
    });

    it('should use custom model when specified', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      await generateImage({
        prompt: 'Test prompt',
        model: 'gemini-3-pro-image-preview',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-pro-image-preview',
        })
      );
    });

    it('should include aspect ratio in config', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      await generateImage({
        prompt: 'Test prompt',
        aspectRatio: '16:9',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            imageConfig: expect.objectContaining({
              aspectRatio: '16:9',
            }),
          }),
        })
      );
    });

    it('should include image size in config', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      await generateImage({
        prompt: 'Test prompt',
        imageSize: '2K',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            imageConfig: expect.objectContaining({
              imageSize: '2K',
            }),
          }),
        })
      );
    });

    it('should handle text response along with image', async () => {
      const responseWithText = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Here is your generated image' },
                {
                  inlineData: {
                    data: 'base64data',
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(responseWithText);

      const result = await generateImage({ prompt: 'Test' });

      expect(result.text).toBe('Here is your generated image');
      expect(result.images).toHaveLength(1);
    });

    it('should throw error when no images generated', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{ content: { parts: [] } }],
      });

      await expect(generateImage({ prompt: 'Test' })).rejects.toThrow(
        'No images generated'
      );
    });

    it('should throw error for safety-blocked content', async () => {
      mockGenerateContent.mockRejectedValue(new Error('SAFETY: Content blocked'));

      await expect(generateImage({ prompt: 'Bad prompt' })).rejects.toThrow(
        'Content was blocked by safety filters'
      );
    });

    it('should throw error for quota exceeded', async () => {
      mockGenerateContent.mockRejectedValue(new Error('QUOTA exceeded'));

      await expect(generateImage({ prompt: 'Test' })).rejects.toThrow(
        'API quota exceeded'
      );
    });

    it('should handle reference images for editing', async () => {
      mockGenerateContent.mockResolvedValue(mockImageResponse);

      await generateImage({
        prompt: 'Edit this image',
        referenceImages: ['base64refimage1', 'base64refimage2'],
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                { text: 'Edit this image' },
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    data: 'base64refimage1',
                  }),
                }),
              ]),
            }),
          ]),
        })
      );
    });
  });

  describe('Constants', () => {
    it('should export valid aspect ratios', () => {
      expect(ASPECT_RATIOS).toBeInstanceOf(Array);
      expect(ASPECT_RATIOS.length).toBeGreaterThan(0);
      expect(ASPECT_RATIOS[0]).toHaveProperty('value');
      expect(ASPECT_RATIOS[0]).toHaveProperty('label');
    });

    it('should export valid image sizes', () => {
      expect(IMAGE_SIZES).toBeInstanceOf(Array);
      expect(IMAGE_SIZES).toContainEqual({ value: '1K', label: '1K (1024px)' });
      expect(IMAGE_SIZES).toContainEqual({ value: '2K', label: '2K (2048px)' });
      expect(IMAGE_SIZES).toContainEqual({ value: '4K', label: '4K (4096px)' });
    });

    it('should export valid models', () => {
      expect(GEMINI_MODELS).toBeInstanceOf(Array);
      expect(GEMINI_MODELS.length).toBe(2);
      expect(GEMINI_MODELS[0]).toHaveProperty('value');
      expect(GEMINI_MODELS[0]).toHaveProperty('label');
      expect(GEMINI_MODELS[0]).toHaveProperty('description');
    });
  });
});
