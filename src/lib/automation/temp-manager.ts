/**
 * Temporary File Manager
 * Manages creation and cleanup of temporary directories for automation jobs
 */

import fs from 'fs/promises';
import path from 'path';
import { JobPaths } from '@/services/automation/automation.types';

export class TempManager {
  private basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'temp', 'automation')) {
    this.basePath = basePath;
  }

  /**
   * Create directory structure for a job
   */
  async createJobDirectories(jobId: string): Promise<JobPaths> {
    const root = path.join(this.basePath, jobId);
    const source = path.join(root, 'source');
    const chunks = path.join(root, 'chunks');
    const dubbed = path.join(root, 'dubbed');
    const output = path.join(root, 'output');

    const paths: JobPaths = {
      root,
      source,
      chunks,
      dubbed,
      output,
    };

    // Create all directories
    await Promise.all([
      fs.mkdir(source, { recursive: true }),
      fs.mkdir(chunks, { recursive: true }),
      fs.mkdir(dubbed, { recursive: true }),
      fs.mkdir(output, { recursive: true }),
    ]);

    return paths;
  }

  /**
   * Clean up intermediate files (source, chunks, dubbed)
   */
  async cleanupIntermediateFiles(paths: JobPaths): Promise<void> {
    try {
      await Promise.all([
        this.removeDirectory(paths.source),
        this.removeDirectory(paths.chunks),
        this.removeDirectory(paths.dubbed),
      ]);
    } catch (error) {
      console.error('Error cleaning up intermediate files:', error);
      // Don't throw - cleanup is not critical
    }
  }

  /**
   * Clean up all files for a job
   */
  async cleanupJobFiles(jobId: string): Promise<void> {
    const root = path.join(this.basePath, jobId);
    try {
      await this.removeDirectory(root);
    } catch (error) {
      console.error(`Error cleaning up job ${jobId}:`, error);
    }
  }

  /**
   * Schedule cleanup of output files after a delay
   */
  scheduleOutputCleanup(paths: JobPaths, delayMs: number = 24 * 60 * 60 * 1000): void {
    setTimeout(async () => {
      try {
        await this.removeDirectory(paths.output);
      } catch (error) {
        console.error('Error during scheduled cleanup:', error);
      }
    }, delayMs);
  }

  /**
   * Clean up old jobs based on age
   */
  async cleanupOldJobs(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      const now = Date.now();
      let cleanedCount = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // Skip the 'jobs' directory (contains job metadata)
        if (entry.name === 'jobs') continue;

        const jobPath = path.join(this.basePath, entry.name);
        const stats = await fs.stat(jobPath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          await this.removeDirectory(jobPath);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      return 0;
    }
  }

  /**
   * Get disk space usage for a job
   */
  async getJobDiskUsage(jobId: string): Promise<number> {
    const root = path.join(this.basePath, jobId);
    return this.getDirectorySize(root);
  }

  /**
   * Get total disk space usage for all jobs
   */
  async getTotalDiskUsage(): Promise<number> {
    return this.getDirectorySize(this.basePath);
  }

  /**
   * Check if a job directory exists
   */
  async jobExists(jobId: string): Promise<boolean> {
    const root = path.join(this.basePath, jobId);
    try {
      await fs.access(root);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get path for a specific job file
   */
  getJobFilePath(jobId: string, filename: string, subdir: keyof Omit<JobPaths, 'root'>): string {
    return path.join(this.basePath, jobId, subdir, filename);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async removeDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Error getting directory size for ${dirPath}:`, error);
      }
    }

    return totalSize;
  }
}

// Export singleton instance
let instance: TempManager | null = null;

export function getTempManager(): TempManager {
  if (!instance) {
    instance = new TempManager();
  }
  return instance;
}

export function resetTempManager(): void {
  instance = null;
}

/**
 * Utility function to format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
