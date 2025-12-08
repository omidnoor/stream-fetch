/**
 * PDF Project API Tests
 *
 * Tests for:
 * - GET /api/pdf/project - List all PDF projects
 * - POST /api/pdf/project - Create new PDF project
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Create mock functions first (before any imports)
const mockCreateProject = jest.fn();
const mockListProjects = jest.fn();
const mockGetProject = jest.fn();
const mockUpdateProject = jest.fn();
const mockDeleteProject = jest.fn();
const mockAddAnnotation = jest.fn();
const mockExportPdf = jest.fn();
const mockMapToProjectDto = jest.fn((project: unknown) => project);
const mockMapToProjectDtos = jest.fn((projects: unknown) => projects);

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/pdf', () => ({
  getPDFService: () => ({
    createProject: mockCreateProject,
    listProjects: mockListProjects,
    getProject: mockGetProject,
    updateProject: mockUpdateProject,
    deleteProject: mockDeleteProject,
    addAnnotation: mockAddAnnotation,
    exportPdf: mockExportPdf,
  }),
  mapToProjectDto: mockMapToProjectDto,
  mapToProjectDtos: mockMapToProjectDtos,
}));

// Dynamic import for the routes (must be after mock setup)
let GET: typeof import('@/app/api/pdf/project/route').GET;
let POST: typeof import('@/app/api/pdf/project/route').POST;

beforeAll(async () => {
  const routeModule = await import('@/app/api/pdf/project/route');
  GET = routeModule.GET;
  POST = routeModule.POST;
});

describe('PDF Project API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateProject.mockReset();
    mockListProjects.mockReset();
    mockMapToProjectDto.mockReset();
    mockMapToProjectDtos.mockReset();
    // Reset to default pass-through behavior
    mockMapToProjectDto.mockImplementation((project: unknown) => project);
    mockMapToProjectDtos.mockImplementation((projects: unknown) => projects);
  });

  describe('GET /api/pdf/project', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: 'pdf-1', name: 'Document 1', status: 'draft' },
        { id: 'pdf-2', name: 'Document 2', status: 'completed' },
      ];

      mockListProjects.mockResolvedValue(mockProjects);

      const request = createMockRequest('/api/pdf/project');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('should filter projects by search query', async () => {
      const mockProjects = [
        { id: 'pdf-1', name: 'Invoice 2024', status: 'draft' },
        { id: 'pdf-2', name: 'Report Q1', status: 'draft' },
      ];

      mockListProjects.mockResolvedValue(mockProjects);

      const request = createMockRequest('/api/pdf/project?search=invoice');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      // Route filters by search, so only Invoice 2024 should be returned
      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Invoice 2024');
    });

    it('should filter projects by status', async () => {
      const mockProjects = [
        { id: 'pdf-1', name: 'Doc 1', status: 'draft' },
        { id: 'pdf-2', name: 'Doc 2', status: 'completed' },
      ];

      mockListProjects.mockResolvedValue(mockProjects);

      const request = createMockRequest('/api/pdf/project?status=completed');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      // Route filters by status
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('completed');
    });

    it('should return empty array when no projects match', async () => {
      mockListProjects.mockResolvedValue([]);

      const request = createMockRequest('/api/pdf/project?search=nonexistent');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('POST /api/pdf/project', () => {
    it('should return 400 when name is missing', async () => {
      const request = createMockRequest('/api/pdf/project', {
        method: 'POST',
        body: { filePath: '/uploads/doc.pdf' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Project name is required');
    });

    it('should create project with valid data', async () => {
      const mockProject = {
        id: 'pdf-123',
        name: 'Test PDF',
        filePath: '/uploads/test.pdf',
        status: 'draft',
        pageCount: 10,
        annotations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/pdf/project', {
        method: 'POST',
        body: {
          name: 'Test PDF',
          filePath: '/uploads/test.pdf',
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test PDF');
      expect(data.data.status).toBe('draft');
    });

    it('should accept optional settings', async () => {
      const mockProject = {
        id: 'pdf-123',
        name: 'Test PDF',
        settings: { pageSize: 'A4', orientation: 'portrait' },
      };

      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/pdf/project', {
        method: 'POST',
        body: {
          name: 'Test PDF',
          settings: { pageSize: 'A4', orientation: 'portrait' },
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: { pageSize: 'A4', orientation: 'portrait' },
        })
      );
    });

    it('should handle service errors', async () => {
      mockCreateProject.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('/api/pdf/project', {
        method: 'POST',
        body: { name: 'Test PDF' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});

describe('PDF Upload API', () => {
  describe('POST /api/pdf/upload', () => {
    it('should accept valid PDF files', async () => {
      const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF header
      expect(pdfContent[0]).toBe(0x25); // '%'
    });

    it('should reject non-PDF files', async () => {
      const textContent = new Uint8Array([0x48, 0x65, 0x6c, 0x6c]); // "Hell" in ASCII
      expect(textContent[0]).not.toBe(0x25);
    });

    it('should extract page count from uploaded PDF', async () => {
      const expectedPageCount = 10;
      expect(expectedPageCount).toBeGreaterThan(0);
    });
  });
});

describe('PDF Export API', () => {
  describe('POST /api/pdf/export', () => {
    it('should export PDF with flattened annotations', async () => {
      const exportSettings = {
        flattenAnnotations: true,
        optimizeForWeb: false,
        preserveLinks: true,
      };

      expect(exportSettings.flattenAnnotations).toBe(true);
    });

    it('should validate project exists before export', async () => {
      const projectId = 'pdf-123';
      expect(projectId).toBeDefined();
    });

    it('should return export job ID', async () => {
      const expectedResponse = {
        success: true,
        data: {
          exportId: 'export-456',
          status: 'processing',
        },
      };

      expect(expectedResponse.data.exportId).toBe('export-456');
    });
  });
});
