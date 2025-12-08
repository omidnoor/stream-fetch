/**
 * Editor Repository
 *
 * Data access layer for video editor projects.
 * Handles all data persistence operations.
 *
 * MIGRATED TO MONGODB - Projects now stored in database instead of in-memory Map
 */

import { promises as fs } from "fs";
import path from "path";
import {
  ProjectNotFoundError,
  StorageError,
} from "@/lib/errors/editor.errors";
import type { VideoProject } from "./editor.types";
import { getVideoProjectRepository } from "@/lib/database/repositories/video-project.repository";

export class EditorRepository {
  private tempDir: string;
  private outputDir: string;
  private dbRepository = getVideoProjectRepository();

  constructor(tempDir?: string, outputDir?: string) {
    this.tempDir = tempDir || path.join(process.cwd(), ".cache", "editor", "temp");
    this.outputDir = outputDir || path.join(process.cwd(), ".cache", "editor", "output");
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log("[EditorRepository] Storage directories initialized");
    } catch (error) {
      throw new StorageError(
        "initialization",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Save a project
   */
  async saveProject(project: VideoProject): Promise<VideoProject> {
    try {
      console.log("[EditorRepository] Saving project:", project.id);

      // Save to MongoDB
      const savedProject = await this.dbRepository.saveProject(project);

      console.log("[EditorRepository] Project saved successfully");
      return savedProject;
    } catch (error) {
      throw new StorageError(
        "save",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<VideoProject> {
    console.log("[EditorRepository] Fetching project:", projectId);

    const project = await this.dbRepository.getProject(projectId);

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    console.log("[EditorRepository] Project found:", project.name);
    return project;
  }

  /**
   * Get all projects (optionally filtered by user)
   */
  async listProjects(userId?: string): Promise<VideoProject[]> {
    console.log("[EditorRepository] Listing projects", userId ? `for user ${userId}` : "");

    return await this.dbRepository.listProjects(userId);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    console.log("[EditorRepository] Deleting project:", projectId);

    try {
      await this.dbRepository.deleteProject(projectId);
      console.log("[EditorRepository] Project deleted successfully");
    } catch (error) {
      throw new ProjectNotFoundError(projectId);
    }
  }

  /**
   * Check if a project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    return await this.dbRepository.projectExists(projectId);
  }

  /**
   * Update project status
   */
  async updateProjectStatus(
    projectId: string,
    status: VideoProject["status"],
    progress?: number,
    error?: string
  ): Promise<VideoProject> {
    return await this.dbRepository.updateProjectStatus(projectId, status, progress, error);
  }

  /**
   * Save uploaded file to temp directory
   */
  async saveUploadedFile(
    filename: string,
    buffer: Buffer
  ): Promise<string> {
    try {
      await this.initialize();

      const sanitizedFilename = this.sanitizeFilename(filename);
      const uniqueFilename = `${Date.now()}_${sanitizedFilename}`;
      const filePath = path.join(this.tempDir, uniqueFilename);

      console.log("[EditorRepository] Saving uploaded file:", filePath);

      await fs.writeFile(filePath, buffer);

      console.log("[EditorRepository] File saved successfully");
      return filePath;
    } catch (error) {
      throw new StorageError(
        "upload",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get temp file path
   */
  getTempFilePath(filename: string): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    return path.join(this.tempDir, sanitizedFilename);
  }

  /**
   * Get output file path
   */
  getOutputFilePath(filename: string): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    return path.join(this.outputDir, sanitizedFilename);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      console.log("[EditorRepository] Deleting file:", filePath);
      await fs.unlink(filePath);
      console.log("[EditorRepository] File deleted successfully");
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as any).code !== "ENOENT") {
        throw new StorageError(
          "delete",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  /**
   * Clean up old temp files (older than 24 hours)
   */
  async cleanupOldFiles(): Promise<void> {
    try {
      console.log("[EditorRepository] Cleaning up old temp files");

      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          console.log("[EditorRepository] Deleting old file:", file);
          await fs.unlink(filePath);
        }
      }

      console.log("[EditorRepository] Cleanup completed");
    } catch (error) {
      console.error("[EditorRepository] Cleanup error:", error);
      // Don't throw - cleanup failures shouldn't break the app
    }
  }

  /**
   * Get temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Get output directory path
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove any path components
    const basename = path.basename(filename);

    // Remove any non-alphanumeric characters except dots, dashes, and underscores
    return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  /**
   * Get project count
   */
  async getProjectCount(userId?: string): Promise<number> {
    const projects = await this.listProjects(userId);
    return projects.length;
  }

  /**
   * Clear all projects (for testing)
   */
  async clearAll(): Promise<void> {
    console.log("[EditorRepository] Clearing all projects");
    await this.dbRepository.clearAll();
  }
}
