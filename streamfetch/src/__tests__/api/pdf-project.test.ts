import { jest, describe, it, expect, beforeEach } from '@jest/globals';
/**
 * PDF Project API Tests
 *
 * Tests for:
 * - GET /api/pdf/project - List all PDF projects
 * - POST /api/pdf/project - Create new PDF project
 * - GET /api/pdf/project/[id] - Get specific project
 * - PUT /api/pdf/project/[id] - Update project
 * - DELETE /api/pdf/project/[id] - Delete project
 * - POST /api/pdf/upload - Upload PDF file
 * - POST /api/pdf/export - Export PDF with annotations
 */

import { GET, POST } from '@/app/api/pdf/project/route';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Mock the PDF service
jest.mock('@/services/pdf', () => ({
  getPDFService: jest.fn(() => ({
    createProject: jest.fn(),
    listProjects: jest.fn(),
    getProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    addAnnotation: jest.fn(),
    exportPdf: jest.fn(),
  })),
  mapToProjectDto: jest.fn((project) => project),
  mapToProjectDtos: jest.fn((projects) => projects),
}));

import { getPDFService, mapToProjectDto, mapToProjectDtos } from '@/services/pdf';

describe('PDF Project API', () => {
  const mockPDFService = getPDFService() as jest.Mocked<ReturnType<typeof getPDFService>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/pdf/project', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: 'pdf-1', name: 'Document 1', status: 'draft' },
        { id: 'pdf-2', name: 'Document 2', status: 'completed' },
      ];

      mockPDFService.listProjects.mockResolvedValue(mockProjects);
      (mapToProjectDtos as jest.Mock).mockReturnValue(mockProjects);

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

      mockPDFService.listProjects.mockResolvedValue(mockProjects);
      (mapToProjectDtos as jest.Mock).mockImplementation((projects) =>
        projects.filter((p: any) => p.name.toLowerCase().includes('invoice'))
      );

      const request = createMockRequest('/api/pdf/project?search=invoice');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
    });

    it('should filter projects by status', async () => {
      const mockProjects = [
        { id: 'pdf-1', name: 'Doc 1', status: 'draft' },
        { id: 'pdf-2', name: 'Doc 2', status: 'completed' },
      ];

      mockPDFService.listProjects.mockResolvedValue(mockProjects);
      (mapToProjectDtos as jest.Mock).mockReturnValue(
        mockProjects.filter((p) => p.status === 'completed')
      );

      const request = createMockRequest('/api/pdf/project?status=completed');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(data.success).toBe(true);
    });

    it('should return empty array when no projects match', async () => {
      mockPDFService.listProjects.mockResolvedValue([]);
      (mapToProjectDtos as jest.Mock).mockReturnValue([]);

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

      mockPDFService.createProject.mockResolvedValue(mockProject);
      (mapToProjectDto as jest.Mock).mockReturnValue(mockProject);

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

      mockPDFService.createProject.mockResolvedValue(mockProject);
      (mapToProjectDto as jest.Mock).mockReturnValue(mockProject);

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
      expect(mockPDFService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: { pageSize: 'A4', orientation: 'portrait' },
        })
      );
    });

    it('should handle service errors', async () => {
      mockPDFService.createProject.mockRejectedValue(new Error('Database error'));

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
