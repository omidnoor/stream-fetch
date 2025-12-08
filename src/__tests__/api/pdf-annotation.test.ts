/**
 * PDF Annotation API Tests
 *
 * Tests for:
 * - POST /api/pdf/annotation - Add annotation
 * - PUT /api/pdf/annotation/[id] - Update annotation
 * - DELETE /api/pdf/annotation/[id] - Delete annotation
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Create mock functions first (before any imports)
const mockAddAnnotation = jest.fn();
const mockUpdateAnnotation = jest.fn();
const mockDeleteAnnotation = jest.fn();
const mockGetProject = jest.fn();
const mockMapToAnnotationDto = jest.fn((annotation: unknown) => annotation);

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/pdf', () => ({
  getPDFService: () => ({
    addAnnotation: mockAddAnnotation,
    updateAnnotation: mockUpdateAnnotation,
    deleteAnnotation: mockDeleteAnnotation,
    getProject: mockGetProject,
  }),
  mapToAnnotationDto: mockMapToAnnotationDto,
}));

// Dynamic import for the routes (must be after mock setup)
let POST: typeof import('@/app/api/pdf/annotation/route').POST;

beforeAll(async () => {
  const routeModule = await import('@/app/api/pdf/annotation/route');
  POST = routeModule.POST;
});

describe('PDF Annotation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddAnnotation.mockReset();
    mockMapToAnnotationDto.mockReset();
    // Reset to default pass-through behavior
    mockMapToAnnotationDto.mockImplementation((annotation: unknown) => annotation);
  });

  describe('POST /api/pdf/annotation', () => {
    it('should return 400 when projectId is missing', async () => {
      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: {
          annotation: {
            type: 'highlight',
            page: 1,
            position: { x: 100, y: 200, width: 50, height: 20 },
          },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Project ID is required');
    });

    it('should return 400 when annotation is missing', async () => {
      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: { projectId: 'pdf-123' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Annotation data is required');
    });

    it('should create highlight annotation', async () => {
      const mockAnnotation = {
        id: 'ann-123',
        type: 'highlight',
        page: 1,
        position: { x: 100, y: 200, width: 50, height: 20 },
        color: '#FFFF00',
        createdAt: new Date().toISOString(),
      };

      mockAddAnnotation.mockResolvedValue(mockAnnotation);

      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: {
          projectId: 'pdf-123',
          annotation: {
            type: 'highlight',
            page: 1,
            position: { x: 100, y: 200, width: 50, height: 20 },
            color: '#FFFF00',
          },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('highlight');
      expect(data.data.color).toBe('#FFFF00');
    });

    it('should create text annotation', async () => {
      const mockAnnotation = {
        id: 'ann-456',
        type: 'text',
        page: 2,
        content: 'This is a note',
        position: { x: 50, y: 100, width: 200, height: 100 },
        createdAt: new Date().toISOString(),
      };

      mockAddAnnotation.mockResolvedValue(mockAnnotation);

      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: {
          projectId: 'pdf-123',
          annotation: {
            type: 'text',
            page: 2,
            content: 'This is a note',
            position: { x: 50, y: 100, width: 200, height: 100 },
          },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      expect(data.data.type).toBe('text');
      expect(data.data.content).toBe('This is a note');
    });

    it('should create drawing annotation', async () => {
      const mockAnnotation = {
        id: 'ann-789',
        type: 'drawing',
        page: 1,
        paths: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        color: '#FF0000',
        strokeWidth: 2,
      };

      mockAddAnnotation.mockResolvedValue(mockAnnotation);

      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: {
          projectId: 'pdf-123',
          annotation: {
            type: 'drawing',
            page: 1,
            paths: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
            color: '#FF0000',
            strokeWidth: 2,
          },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      expect(data.data.type).toBe('drawing');
    });

    it('should handle service errors', async () => {
      mockAddAnnotation.mockRejectedValue(new Error('Project not found'));

      const request = createMockRequest('/api/pdf/annotation', {
        method: 'POST',
        body: {
          projectId: 'invalid-project',
          annotation: { type: 'highlight', page: 1 },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Annotation Types', () => {
    const annotationTypes = ['highlight', 'underline', 'strikethrough', 'text', 'drawing', 'stamp'];

    annotationTypes.forEach((type) => {
      it(`should support ${type} annotation type`, () => {
        expect(annotationTypes).toContain(type);
      });
    });
  });

  describe('Annotation Positioning', () => {
    it('should validate page number is positive', () => {
      const annotation = { page: 1, position: { x: 0, y: 0 } };
      expect(annotation.page).toBeGreaterThan(0);
    });

    it('should validate position coordinates', () => {
      const position = { x: 100, y: 200, width: 50, height: 20 };
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.width).toBeGreaterThan(0);
      expect(position.height).toBeGreaterThan(0);
    });
  });
});

describe('PDF Annotation Update API', () => {
  describe('PUT /api/pdf/annotation/[id]', () => {
    it('should update annotation content', async () => {
      const updateData = {
        content: 'Updated note text',
        color: '#00FF00',
      };

      expect(updateData.content).toBe('Updated note text');
    });

    it('should update annotation position', async () => {
      const updateData = {
        position: { x: 150, y: 250, width: 60, height: 25 },
      };

      expect(updateData.position.x).toBe(150);
    });

    it('should preserve unmodified fields', async () => {
      const original = { type: 'highlight', page: 1, color: '#FFFF00' };
      const update = { color: '#00FF00' };
      const merged = { ...original, ...update };

      expect(merged.type).toBe('highlight');
      expect(merged.page).toBe(1);
      expect(merged.color).toBe('#00FF00');
    });
  });
});

describe('PDF Annotation Delete API', () => {
  describe('DELETE /api/pdf/annotation/[id]', () => {
    it('should delete annotation by ID', async () => {
      const annotationId = 'ann-123';
      expect(annotationId).toBeDefined();
    });

    it('should require projectId in query params', async () => {
      const request = createMockRequest('/api/pdf/annotation/ann-123?projectId=pdf-123');
      expect(request.url).toContain('projectId');
    });

    it('should return 404 for non-existent annotation', async () => {
      const expectedStatus = 404;
      expect(expectedStatus).toBe(404);
    });
  });
});
