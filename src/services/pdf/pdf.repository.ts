/**
 * PDF Repository
 *
 * Handles storage and retrieval of PDF projects and annotations.
 * Following the existing repository pattern used in dubbing and editor services.
 *
 * Phase 1: In-memory storage
 * Phase 2+: Database integration (planned)
 */

import type { PDFProject, Annotation, ProjectStatus } from './pdf.types';
import {
  PDFProjectNotFoundError,
  AnnotationNotFoundError,
  PDFStorageError,
} from '@/lib/errors/pdf.errors';

/**
 * PDF Repository Class
 */
export class PDFRepository {
  // In-memory storage (Phase 1)
  private projects: Map<string, PDFProject> = new Map();
  private annotations: Map<string, Annotation> = new Map();

  /**
   * Save project to storage
   */
  async saveProject(project: PDFProject): Promise<PDFProject> {
    try {
      this.projects.set(project.id, { ...project });
      return project;
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
    const project = this.projects.get(projectId);

    if (!project) {
      throw new PDFProjectNotFoundError(projectId);
    }

    return { ...project };
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<PDFProject[]> {
    return Array.from(this.projects.values()).map((project) => ({ ...project }));
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);

    // Delete all annotations associated with this project
    for (const annotationId of project.annotations.map((a) => a.id)) {
      this.annotations.delete(annotationId);
    }

    // Delete project
    if (!this.projects.delete(projectId)) {
      throw new PDFStorageError('Failed to delete project', { projectId });
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<PDFProject> {
    const project = await this.getProject(projectId);
    project.status = status;
    project.updatedAt = new Date();
    return this.saveProject(project);
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updates: Partial<PDFProject>
  ): Promise<PDFProject> {
    const project = await this.getProject(projectId);

    const updatedProject: PDFProject = {
      ...project,
      ...updates,
      id: project.id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    return this.saveProject(updatedProject);
  }

  /**
   * Save annotation
   */
  async saveAnnotation(annotation: Annotation): Promise<Annotation> {
    try {
      this.annotations.set(annotation.id, { ...annotation });
      return annotation;
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
    const annotation = this.annotations.get(annotationId);

    if (!annotation) {
      throw new AnnotationNotFoundError(annotationId);
    }

    return { ...annotation };
  }

  /**
   * Get all annotations for a project
   */
  async getProjectAnnotations(projectId: string): Promise<Annotation[]> {
    const project = await this.getProject(projectId);
    return project.annotations.map((a) => ({ ...a }));
  }

  /**
   * Get annotations for a specific page
   */
  async getPageAnnotations(projectId: string, pageNumber: number): Promise<Annotation[]> {
    const annotations = await this.getProjectAnnotations(projectId);
    return annotations.filter((a) => a.pageNumber === pageNumber);
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(projectId: string, annotationId: string): Promise<void> {
    // Remove from annotations map
    if (!this.annotations.delete(annotationId)) {
      throw new AnnotationNotFoundError(annotationId);
    }

    // Remove from project's annotations array
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
    const annotation = await this.getAnnotation(annotationId);

    const updatedAnnotation: Annotation = {
      ...annotation,
      ...updates,
      id: annotation.id, // Ensure ID doesn't change
      type: annotation.type, // Ensure type doesn't change
      updatedAt: new Date(),
    } as Annotation;

    return this.saveAnnotation(updatedAnnotation);
  }

  /**
   * Check if project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    return this.projects.has(projectId);
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    return this.projects.size;
  }

  /**
   * Get total annotations count
   */
  async getTotalAnnotationsCount(): Promise<number> {
    return this.annotations.size;
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string): Promise<PDFProject[]> {
    const allProjects = await this.listProjects();
    const lowerQuery = query.toLowerCase();

    return allProjects.filter((project) =>
      project.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(status: ProjectStatus): Promise<PDFProject[]> {
    const allProjects = await this.listProjects();
    return allProjects.filter((project) => project.status === status);
  }

  /**
   * Clear all data (useful for testing)
   */
  async clearAll(): Promise<void> {
    this.projects.clear();
    this.annotations.clear();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    projectCount: number;
    annotationCount: number;
    totalFileSize: number;
  }> {
    const projects = await this.listProjects();

    return {
      projectCount: projects.length,
      annotationCount: this.annotations.size,
      totalFileSize: projects.reduce((sum, p) => sum + p.metadata.fileSize, 0),
    };
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
