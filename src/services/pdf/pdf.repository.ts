/**
 * PDF Repository
 *
 * Handles storage and retrieval of PDF projects and annotations.
 * Following the existing repository pattern used in dubbing and editor services.
 *
 * MIGRATED TO MONGODB - Projects and annotations now stored in database
 */

import type { PDFProject, Annotation, ProjectStatus } from './pdf.types';
import {
  PDFProjectNotFoundError,
  AnnotationNotFoundError,
  PDFStorageError,
} from '@/lib/errors/pdf.errors';
import { getPDFProjectRepository } from '@/lib/database/repositories/pdf-project.repository';
import { getAnnotationRepository } from '@/lib/database/repositories/annotation.repository';

/**
 * PDF Repository Class
 */
export class PDFRepository {
  // MongoDB repositories
  private projectsRepo = getPDFProjectRepository();
  private annotationsRepo = getAnnotationRepository();

  /**
   * Save project to storage
   */
  async saveProject(project: PDFProject): Promise<PDFProject> {
    try {
      return await this.projectsRepo.saveProject(project);
    } catch (error) {
      throw new PDFStorageError('Failed to save project', {
        projectId: project.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<PDFProject> {
    const project = await this.projectsRepo.getProject(projectId);

    if (!project) {
      throw new PDFProjectNotFoundError(projectId);
    }

    return project;
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<PDFProject[]> {
    return await this.projectsRepo.listProjects();
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    // Delete all annotations associated with this project
    await this.annotationsRepo.deleteProjectAnnotations(projectId);

    // Delete project
    await this.projectsRepo.deleteProject(projectId);
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<PDFProject> {
    return await this.projectsRepo.updateProjectStatus(projectId, status);
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: Partial<PDFProject>
  ): Promise<PDFProject> {
    return await this.projectsRepo.updateProject(projectId, updates);
  }

  /**
   * Save annotation
   */
  async saveAnnotation(annotation: Annotation): Promise<Annotation> {
    try {
      return await this.annotationsRepo.saveAnnotation(annotation);
    } catch (error) {
      throw new PDFStorageError('Failed to save annotation', {
        annotationId: annotation.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get annotation by ID
   */
  async getAnnotation(annotationId: string): Promise<Annotation> {
    const annotation = await this.annotationsRepo.getAnnotation(annotationId);

    if (!annotation) {
      throw new AnnotationNotFoundError(annotationId);
    }

    return annotation;
  }

  /**
   * Get all annotations for a project
   */
  async getProjectAnnotations(projectId: string): Promise<Annotation[]> {
    return await this.annotationsRepo.getProjectAnnotations(projectId);
  }

  /**
   * Get annotations for a specific page
   */
  async getPageAnnotations(projectId: string, pageNumber: number): Promise<Annotation[]> {
    return await this.annotationsRepo.getPageAnnotations(projectId, pageNumber);
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(projectId: string, annotationId: string): Promise<void> {
    await this.annotationsRepo.deleteAnnotation(annotationId);

    // Update project's annotations array
    const project = await this.getProject(projectId);
    project.annotations = project.annotations.filter((a) => a.id !== annotationId);
    project.updatedAt = new Date();
    await this.saveProject(project);
  }

  /**
   * Update annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: Partial<Annotation>
  ): Promise<Annotation> {
    return await this.annotationsRepo.updateAnnotation(annotationId, updates);
  }

  /**
   * Check if project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    return await this.projectsRepo.projectExists(projectId);
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    return await this.projectsRepo.getProjectCount();
  }

  /**
   * Get total annotations count
   */
  async getTotalAnnotationsCount(): Promise<number> {
    // Get count from all projects
    const projects = await this.listProjects();
    let total = 0;
    for (const project of projects) {
      total += await this.annotationsRepo.getProjectAnnotationCount(project.id);
    }
    return total;
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string): Promise<PDFProject[]> {
    return await this.projectsRepo.searchProjects(query);
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<PDFProject[]> {
    return await this.projectsRepo.getProjectsByStatus(status);
  }

  /**
   * Clear all data (useful for testing)
   */
  async clearAll(): Promise<void> {
    await this.projectsRepo.clearAll();
    await this.annotationsRepo.clearAll();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    projectCount: number;
    annotationCount: number;
    totalFileSize: number;
  }> {
    return await this.projectsRepo.getStorageStats();
  }
}

/**
 * Global storage that persists across Next.js API calls
 * Using globalThis to maintain state in serverless environment
 */
declare global {
  // eslint-disable-next-line no-var
  var __pdfRepository: PDFRepository | undefined;
}

/**
 * Get repository instance (singleton with global persistence)
 */
export function getPDFRepository(): PDFRepository {
  if (!globalThis.__pdfRepository) {
    globalThis.__pdfRepository = new PDFRepository();
  }
  return globalThis.__pdfRepository;
}
