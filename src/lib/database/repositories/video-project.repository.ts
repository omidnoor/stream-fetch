/**
 * Video Project Repository
 *
 * MongoDB-based persistence for video editor projects.
 * Replaces the in-memory Map storage in EditorRepository.
 */

import { Collection } from 'mongodb';
import { getCollection, Collections } from '../mongodb';
import { VideoProject, ProjectStatus } from '@/services/editor/editor.types';

export class VideoProjectRepository {
  private async getCollection(): Promise<Collection<VideoProject>> {
    return getCollection<VideoProject>(Collections.VIDEO_PROJECTS);
  }

  /**
   * Save a project (create or update)
   */
  async saveProject(project: VideoProject): Promise<VideoProject> {
    const collection = await this.getCollection();

    try {
      // Update timestamp
      project.updatedAt = new Date();

      // Upsert: update if exists, insert if not
      await collection.updateOne(
        { id: project.id } as any,
        { $set: project as any },
        { upsert: true }
      );

      console.log(`[VideoProjectRepository] Saved project: ${project.id}`);
      return project;
    } catch (error) {
      console.error('[VideoProjectRepository] Save failed:', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<VideoProject | null> {
    const collection = await this.getCollection();

    try {
      const project = await collection.findOne({ id: projectId } as any);
      return project as VideoProject | null;
    } catch (error) {
      console.error('[VideoProjectRepository] Get failed:', error);
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all projects (optionally filtered by user)
   */
  async listProjects(userId?: string): Promise<VideoProject[]> {
    const collection = await this.getCollection();

    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const cursor = collection.find(query).sort({ updatedAt: -1 });
      const projects = await cursor.toArray();
      return projects as VideoProject[];
    } catch (error) {
      console.error('[VideoProjectRepository] List failed:', error);
      throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.deleteOne({ id: projectId } as any);

      if (result.deletedCount === 0) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`[VideoProjectRepository] Deleted project: ${projectId}`);
    } catch (error) {
      console.error('[VideoProjectRepository] Delete failed:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    const collection = await this.getCollection();

    try {
      const count = await collection.countDocuments({ id: projectId } as any);
      return count > 0;
    } catch (error) {
      console.error('[VideoProjectRepository] Exists check failed:', error);
      return false;
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
    progress?: number,
    error?: string
  ): Promise<VideoProject> {
    const collection = await this.getCollection();

    try {
      const updates: any = {
        status,
        updatedAt: new Date(),
      };

      if (progress !== undefined) {
        updates.progress = progress;
      }

      if (error !== undefined) {
        updates.error = error;
      }

      const result = await collection.findOneAndUpdate(
        { id: projectId } as any,
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`[VideoProjectRepository] Updated status for project: ${projectId} to ${status}`);
      return result as VideoProject;
    } catch (error) {
      console.error('[VideoProjectRepository] Update status failed:', error);
      throw new Error(`Failed to update project status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project count
   */
  async getProjectCount(userId?: string): Promise<number> {
    const collection = await this.getCollection();

    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      return await collection.countDocuments(query);
    } catch (error) {
      console.error('[VideoProjectRepository] Count failed:', error);
      throw new Error(`Failed to count projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus, userId?: string): Promise<VideoProject[]> {
    const collection = await this.getCollection();

    try {
      const query: any = { status };
      if (userId) {
        query.userId = userId;
      }

      const cursor = collection.find(query).sort({ updatedAt: -1 });
      const projects = await cursor.toArray();
      return projects as VideoProject[];
    } catch (error) {
      console.error('[VideoProjectRepository] Get by status failed:', error);
      throw new Error(`Failed to get projects by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string, userId?: string): Promise<VideoProject[]> {
    const collection = await this.getCollection();

    try {
      const filter: any = {
        name: { $regex: query, $options: 'i' }, // Case-insensitive search
      };

      if (userId) {
        filter.userId = userId;
      }

      const cursor = collection.find(filter).sort({ updatedAt: -1 });
      const projects = await cursor.toArray();
      return projects as VideoProject[];
    } catch (error) {
      console.error('[VideoProjectRepository] Search failed:', error);
      throw new Error(`Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update project (partial update)
   */
  async updateProject(projectId: string, updates: Partial<VideoProject>): Promise<VideoProject> {
    const collection = await this.getCollection();

    try {
      const result = await collection.findOneAndUpdate(
        { id: projectId } as any,
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`[VideoProjectRepository] Updated project: ${projectId}`);
      return result as VideoProject;
    } catch (error) {
      console.error('[VideoProjectRepository] Update failed:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all projects (for testing)
   */
  async clearAll(): Promise<void> {
    const collection = await this.getCollection();

    try {
      await collection.deleteMany({});
      console.log('[VideoProjectRepository] Cleared all projects');
    } catch (error) {
      console.error('[VideoProjectRepository] Clear all failed:', error);
      throw new Error(`Failed to clear projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recently updated projects
   */
  async getRecentProjects(limit: number = 10, userId?: string): Promise<VideoProject[]> {
    const collection = await this.getCollection();

    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const cursor = collection
        .find(query)
        .sort({ updatedAt: -1 })
        .limit(limit);

      const projects = await cursor.toArray();
      return projects as VideoProject[];
    } catch (error) {
      console.error('[VideoProjectRepository] Get recent failed:', error);
      throw new Error(`Failed to get recent projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let instance: VideoProjectRepository | null = null;

export function getVideoProjectRepository(): VideoProjectRepository {
  if (!instance) {
    instance = new VideoProjectRepository();
  }
  return instance;
}

export function resetVideoProjectRepository(): void {
  instance = null;
}
