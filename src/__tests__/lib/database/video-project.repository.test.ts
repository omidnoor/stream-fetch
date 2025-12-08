/**
 * Video Project Repository Tests
 *
 * Tests CRUD operations for video projects in MongoDB
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  getVideoProjectRepository,
  resetVideoProjectRepository,
} from '@/lib/database/repositories/video-project.repository';
import { VideoProject, ProjectStatus } from '@/services/editor/editor.types';
import { closeConnection } from '@/lib/database/mongodb';

describe('VideoProjectRepository', () => {
  let repository: ReturnType<typeof getVideoProjectRepository>;
  const testProjectIds: string[] = [];

  beforeAll(() => {
    repository = getVideoProjectRepository();
  });

  afterAll(async () => {
    // Clean up test data
    for (const projectId of testProjectIds) {
      try {
        await repository.deleteProject(projectId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    await closeConnection();
  });

  beforeEach(() => {
    resetVideoProjectRepository();
    repository = getVideoProjectRepository();
  });

  const createTestProject = (status: ProjectStatus = 'draft'): VideoProject => {
    const projectId = uuidv4();
    testProjectIds.push(projectId);

    return {
      id: projectId,
      name: `Test Project ${projectId.substring(0, 8)}`,
      description: 'Test video editing project',
      userId: 'test-user-123',
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: {
        clips: [],
        audioTracks: [],
        textOverlays: [],
        transitions: [],
        duration: 0,
      },
      settings: {
        resolution: {
          width: 1920,
          height: 1080,
        },
        frameRate: 30,
      },
    };
  };

  describe('saveProject', () => {
    it('should save a new project', async () => {
      const project = createTestProject();
      const saved = await repository.saveProject(project);

      expect(saved).toBeDefined();
      expect(saved.id).toBe(project.id);
      expect(saved.name).toBe(project.name);
    });

    it('should update existing project', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      project.name = 'Updated Name';
      const updated = await repository.saveProject(project);

      expect(updated.name).toBe('Updated Name');
    });
  });

  describe('getProject', () => {
    it('should retrieve a project by ID', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      const retrieved = await repository.getProject(project.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(project.id);
    });

    it('should return null for non-existent project', async () => {
      const result = await repository.getProject('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should list all projects', async () => {
      const project1 = createTestProject();
      const project2 = createTestProject();
      await repository.saveProject(project1);
      await repository.saveProject(project2);

      const projects = await repository.listProjects();
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter projects by userId', async () => {
      const project1 = createTestProject();
      project1.userId = 'user-1';
      const project2 = createTestProject();
      project2.userId = 'user-2';

      await repository.saveProject(project1);
      await repository.saveProject(project2);

      const user1Projects = await repository.listProjects('user-1');
      expect(user1Projects.every((p) => p.userId === 'user-1')).toBe(true);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      await repository.deleteProject(project.id);

      const retrieved = await repository.getProject(project.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error when deleting non-existent project', async () => {
      await expect(repository.deleteProject('non-existent-id')).rejects.toThrow();
    });
  });

  describe('projectExists', () => {
    it('should return true for existing project', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      const exists = await repository.projectExists(project.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      const exists = await repository.projectExists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('updateProjectStatus', () => {
    it('should update project status', async () => {
      const project = createTestProject('draft');
      await repository.saveProject(project);

      const updated = await repository.updateProjectStatus(project.id, 'processing');
      expect(updated.status).toBe('processing');
    });

    it('should update progress when provided', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      const updated = await repository.updateProjectStatus(project.id, 'processing', 50);
      expect(updated.status).toBe('processing');
      expect(updated.progress).toBe(50);
    });

    it('should update error message when provided', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      const updated = await repository.updateProjectStatus(
        project.id,
        'failed',
        undefined,
        'Test error'
      );
      expect(updated.status).toBe('failed');
      expect(updated.error).toBe('Test error');
    });
  });

  describe('getProjectCount', () => {
    it('should count all projects', async () => {
      const initialCount = await repository.getProjectCount();

      const project = createTestProject();
      await repository.saveProject(project);

      const newCount = await repository.getProjectCount();
      expect(newCount).toBe(initialCount + 1);
    });

    it('should count projects by user', async () => {
      const project1 = createTestProject();
      project1.userId = 'count-user-1';
      const project2 = createTestProject();
      project2.userId = 'count-user-1';

      await repository.saveProject(project1);
      await repository.saveProject(project2);

      const count = await repository.getProjectCount('count-user-1');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getProjectsByStatus', () => {
    it('should get projects by status', async () => {
      const project = createTestProject('completed');
      await repository.saveProject(project);

      const completedProjects = await repository.getProjectsByStatus('completed');
      expect(completedProjects.length).toBeGreaterThanOrEqual(1);
      expect(completedProjects.every((p) => p.status === 'completed')).toBe(true);
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name', async () => {
      const project = createTestProject();
      project.name = 'Unique Search Test Name';
      await repository.saveProject(project);

      const results = await repository.searchProjects('Unique Search');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.name.includes('Unique Search'))).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const project = createTestProject();
      project.name = 'CaseSensitive Test';
      await repository.saveProject(project);

      const results = await repository.searchProjects('casesensitive');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      const updated = await repository.updateProject(project.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });
  });

  describe('getRecentProjects', () => {
    it('should get recently updated projects', async () => {
      const project1 = createTestProject();
      const project2 = createTestProject();
      await repository.saveProject(project1);
      await repository.saveProject(project2);

      const recentProjects = await repository.getRecentProjects(5);
      expect(recentProjects.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit results', async () => {
      const recentProjects = await repository.getRecentProjects(3);
      expect(recentProjects.length).toBeLessThanOrEqual(3);
    });
  });

  describe('clearAll', () => {
    it('should clear all projects', async () => {
      const project = createTestProject();
      await repository.saveProject(project);

      await repository.clearAll();

      const projects = await repository.listProjects();
      expect(projects.length).toBe(0);
    });
  });
});
