/**
 * PDF Project Repository
 *
 * MongoDB-based persistence for PDF editor projects.
 * Replaces the in-memory Map storage in PDFRepository.
 */

import { Collection, Filter, Document } from 'mongodb';
import { getCollection, Collections } from '../mongodb';
import { PDFProject, ProjectStatus } from '@/services/pdf/pdf.types';

export class PDFProjectRepository {
  private async getCollection(): Promise<Collection<PDFProject>> {
    return getCollection<PDFProject>(Collections.PDF_PROJECTS);
  }

  /**
   * Save project to storage
   */
  async saveProject(project: PDFProject): Promise<PDFProject> {
    const collection = await this.getCollection();

    try {
      // Update timestamp
      project.updatedAt = new Date();

      // Upsert: update if exists, insert if not
      await collection.updateOne(
        { id: project.id } as Filter<Document>,
        { $set: project as Filter<Document> },
        { upsert: true }
      );

      console.log(`[PDFProjectRepository] Saved project: ${project.id}`);
      return project;
    } catch (error) {
      console.error('[PDFProjectRepository] Save failed:', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<PDFProject | null> {
    const collection = await this.getCollection();

    try {
      const project = await collection.findOne({ id: projectId } as Filter<Document>);
      return project as PDFProject | null;
    } catch (error) {
      console.error('[PDFProjectRepository] Get failed:', error);
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<PDFProject[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection.find({}).sort({ createdAt: -1 });
      const projects = await cursor.toArray();
      return projects as PDFProject[];
    } catch (error) {
      console.error('[PDFProjectRepository] List failed:', error);
      throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.deleteOne({ id: projectId } as Filter<Document>);

      if (result.deletedCount === 0) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`[PDFProjectRepository] Deleted project: ${projectId}`);
    } catch (error) {
      console.error('[PDFProjectRepository] Delete failed:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<PDFProject> {
    const collection = await this.getCollection();

    try {
      const result = await collection.findOneAndUpdate(
        { id: projectId } as Filter<Document>,
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error(`Project ${projectId} not found`);
      }

      console.log(`[PDFProjectRepository] Updated status for project: ${projectId} to ${status}`);
      return result as PDFProject;
    } catch (error) {
      console.error('[PDFProjectRepository] Update status failed:', error);
      throw new Error(`Failed to update project status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: Partial<PDFProject>
  ): Promise<PDFProject> {
    const collection = await this.getCollection();

    try {
      const result = await collection.findOneAndUpdate(
        { id: projectId } as Filter<Document>,
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

      console.log(`[PDFProjectRepository] Updated project: ${projectId}`);
      return result as PDFProject;
    } catch (error) {
      console.error('[PDFProjectRepository] Update failed:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    const collection = await this.getCollection();

    try {
      const count = await collection.countDocuments({ id: projectId } as Filter<Document>);
      return count > 0;
    } catch (error) {
      console.error('[PDFProjectRepository] Exists check failed:', error);
      return false;
    }
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    const collection = await this.getCollection();

    try {
      return await collection.countDocuments({});
    } catch (error) {
      console.error('[PDFProjectRepository] Count failed:', error);
      throw new Error(`Failed to count projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string): Promise<PDFProject[]> {
    const collection = await this.getCollection();

    try {
      const filter = {
        name: { $regex: query, $options: 'i' }, // Case-insensitive search
      };

      const cursor = collection.find(filter as Filter<Document>).sort({ createdAt: -1 });
      const projects = await cursor.toArray();
      return projects as PDFProject[];
    } catch (error) {
      console.error('[PDFProjectRepository] Search failed:', error);
      throw new Error(`Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<PDFProject[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection.find({ status } as Filter<Document>).sort({ createdAt: -1 });
      const projects = await cursor.toArray();
      return projects as PDFProject[];
    } catch (error) {
      console.error('[PDFProjectRepository] Get by status failed:', error);
      throw new Error(`Failed to get projects by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    projectCount: number;
    annotationCount: number;
    totalFileSize: number;
  }> {
    const collection = await this.getCollection();

    try {
      const projects = await collection.find({}).toArray();

      return {
        projectCount: projects.length,
        annotationCount: projects.reduce((sum, p) => sum + (p.annotations?.length || 0), 0),
        totalFileSize: projects.reduce((sum, p) => sum + (p.metadata?.fileSize || 0), 0),
      };
    } catch (error) {
      console.error('[PDFProjectRepository] Get storage stats failed:', error);
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all data (useful for testing)
   */
  async clearAll(): Promise<void> {
    const collection = await this.getCollection();

    try {
      await collection.deleteMany({});
      console.log('[PDFProjectRepository] Cleared all projects');
    } catch (error) {
      console.error('[PDFProjectRepository] Clear all failed:', error);
      throw new Error(`Failed to clear projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let instance: PDFProjectRepository | null = null;

export function getPDFProjectRepository(): PDFProjectRepository {
  if (!instance) {
    instance = new PDFProjectRepository();
  }
  return instance;
}

export function resetPDFProjectRepository(): void {
  instance = null;
}
