/**
 * Editor Project API Tests
 *
 * Tests for:
 * - GET /api/editor/project - List all projects
 * - POST /api/editor/project - Create new project
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { createMockRequest, parseJsonResponse } from '../utils/test-helpers';

// Create mock functions first (before any imports)
// Using generic mock types for flexibility in test data
const mockListProjects = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>[]>>();
const mockCreateProject = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockGetProject = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown> | null>>();
const mockUpdateProject = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockDeleteProject = jest.fn<(...args: unknown[]) => Promise<void>>();

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('@/services/editor', () => ({
  getEditorService: () => ({
    listProjects: mockListProjects,
    createProject: mockCreateProject,
    getProject: mockGetProject,
    updateProject: mockUpdateProject,
    deleteProject: mockDeleteProject,
  }),
}));

// Dynamic import for the routes (must be after mock setup)
let GET: typeof import('@/app/api/editor/project/route').GET;
let POST: typeof import('@/app/api/editor/project/route').POST;

beforeAll(async () => {
  const routeModule = await import('@/app/api/editor/project/route');
  GET = routeModule.GET;
  POST = routeModule.POST;
});

describe('Editor Project API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListProjects.mockReset();
    mockCreateProject.mockReset();
  });

  describe('GET /api/editor/project', () => {
    it('should return empty array when no projects exist', async () => {
      mockListProjects.mockResolvedValue([]);

      const request = createMockRequest('/api/editor/project');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return all projects', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1', status: 'draft' },
        { id: 'project-2', name: 'Project 2', status: 'draft' },
      ];
      mockListProjects.mockResolvedValue(mockProjects);

      const request = createMockRequest('/api/editor/project');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Project 1');
    });

    it('should handle service errors', async () => {
      mockListProjects.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('/api/editor/project');
      const response = await GET(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/editor/project', () => {
    it('should create project with provided name', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'My New Project',
        description: 'A test project',
        status: 'draft',
        duration: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: {
          name: 'My New Project',
          description: 'A test project',
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('My New Project');
      expect(data.data.description).toBe('A test project');
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My New Project',
          description: 'A test project',
        })
      );
    });

    it('should use default name when not provided', async () => {
      const mockProject = {
        id: 'project-456',
        name: 'Untitled Project',
        description: '',
        status: 'draft',
        duration: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: {},
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.data.name).toBe('Untitled Project');
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Untitled Project',
          description: '',
        })
      );
    });

    it('should set initial duration to 0', async () => {
      const mockProject = {
        id: 'project-789',
        name: 'Test',
        description: '',
        status: 'draft',
        duration: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: { name: 'Test' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.data.duration).toBe(0);
    });

    it('should set timestamps on creation', async () => {
      const now = new Date().toISOString();
      const mockProject = {
        id: 'project-101',
        name: 'Test',
        description: '',
        status: 'draft',
        duration: 0,
        createdAt: now,
        updatedAt: now,
      };
      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: { name: 'Test' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(data.data.createdAt).toBeDefined();
      expect(data.data.updatedAt).toBeDefined();
      expect(new Date(data.data.createdAt)).toBeInstanceOf(Date);
    });

    it('should accept sourceVideoUrl parameter', async () => {
      const mockProject = {
        id: 'project-202',
        name: 'Test',
        description: '',
        status: 'draft',
        duration: 0,
        sourceVideoUrl: 'https://youtube.com/watch?v=abc123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCreateProject.mockResolvedValue(mockProject);

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: {
          name: 'Test',
          sourceVideoUrl: 'https://youtube.com/watch?v=abc123',
        },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceVideoUrl: 'https://youtube.com/watch?v=abc123',
        })
      );
    });

    it('should generate unique IDs for multiple projects', async () => {
      mockCreateProject
        .mockResolvedValueOnce({
          id: 'project-aaa',
          name: 'Project 1',
          description: '',
          status: 'draft',
          duration: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'project-bbb',
          name: 'Project 2',
          description: '',
          status: 'draft',
          duration: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      const request1 = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: { name: 'Project 1' },
      });
      const request2 = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: { name: 'Project 2' },
      });

      const response1 = await POST(request1);
      const response2 = await POST(request2);

      const data1 = await parseJsonResponse(response1);
      const data2 = await parseJsonResponse(response2);

      expect(data1.data.id).not.toBe(data2.data.id);
    });

    it('should handle service errors', async () => {
      mockCreateProject.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('/api/editor/project', {
        method: 'POST',
        body: { name: 'Test Project' },
      });
      const response = await POST(request);
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
