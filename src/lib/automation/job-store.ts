/**
 * Job Persistence Store
 * File-based storage for automation jobs (can be upgraded to DB later)
 */

import fs from 'fs/promises';
import path from 'path';
import { AutomationJob, JobStatus, PipelineProgress, LogEntry } from '@/services/automation/automation.types';

export class JobStore {
  private basePath: string;
  private jobsPath: string;

  constructor(basePath: string = path.join(process.cwd(), 'temp', 'automation')) {
    this.basePath = basePath;
    this.jobsPath = path.join(basePath, 'jobs');
  }

  /**
   * Initialize the job store (create directories if needed)
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.jobsPath, { recursive: true });
  }

  /**
   * Create a new job record
   */
  async create(job: AutomationJob): Promise<void> {
    await this.ensureInitialized();
    const filePath = this.getJobFilePath(job.id);
    await this.writeJobFile(filePath, job);
  }

  /**
   * Get a job by ID
   */
  async get(jobId: string): Promise<AutomationJob | null> {
    try {
      const filePath = this.getJobFilePath(jobId);
      const data = await fs.readFile(filePath, 'utf-8');
      return this.deserializeJob(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a job with partial data
   */
  async update(jobId: string, updates: Partial<AutomationJob>): Promise<void> {
    const job = await this.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob: AutomationJob = {
      ...job,
      ...updates,
      updatedAt: new Date(),
    };

    const filePath = this.getJobFilePath(jobId);
    await this.writeJobFile(filePath, updatedJob);
  }

  /**
   * Delete a job
   */
  async delete(jobId: string): Promise<void> {
    try {
      const filePath = this.getJobFilePath(jobId);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List all jobs with optional filter
   */
  async list(filter?: { status?: JobStatus; limit?: number; offset?: number }): Promise<AutomationJob[]> {
    await this.ensureInitialized();

    const files = await fs.readdir(this.jobsPath);
    const jobFiles = files.filter(f => f.endsWith('.json'));

    const jobs: AutomationJob[] = [];
    for (const file of jobFiles) {
      try {
        const filePath = path.join(this.jobsPath, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const job = this.deserializeJob(data);

        if (filter?.status && job.status !== filter.status) {
          continue;
        }

        jobs.push(job);
      } catch (error) {
        console.error(`Error reading job file ${file}:`, error);
      }
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? jobs.length;
    return jobs.slice(offset, offset + limit);
  }

  /**
   * Count jobs with optional filter
   */
  async count(filter?: { status?: JobStatus }): Promise<number> {
    const jobs = await this.list(filter);
    return jobs.length;
  }

  /**
   * Update job progress (optimized for frequent updates)
   */
  async updateProgress(jobId: string, progress: PipelineProgress): Promise<void> {
    await this.update(jobId, { progress });
  }

  /**
   * Add a log entry to a job
   */
  async addLog(jobId: string, log: LogEntry): Promise<void> {
    const job = await this.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedLogs = [...job.progress.logs, log];

    // Keep only last 1000 logs to prevent file bloat
    const trimmedLogs = updatedLogs.slice(-1000);

    await this.update(jobId, {
      progress: {
        ...job.progress,
        logs: trimmedLogs,
      },
    });
  }

  /**
   * Check if a job exists
   */
  async exists(jobId: string): Promise<boolean> {
    try {
      const filePath = this.getJobFilePath(jobId);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    try {
      await fs.access(this.jobsPath);
    } catch {
      await this.initialize();
    }
  }

  private getJobFilePath(jobId: string): string {
    return path.join(this.jobsPath, `${jobId}.json`);
  }

  private async writeJobFile(filePath: string, job: AutomationJob): Promise<void> {
    const serialized = this.serializeJob(job);
    await fs.writeFile(filePath, serialized, 'utf-8');
  }

  private serializeJob(job: AutomationJob): string {
    return JSON.stringify(job, null, 2);
  }

  private deserializeJob(data: string): AutomationJob {
    const parsed = JSON.parse(data);

    // Convert date strings back to Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      progress: {
        ...parsed.progress,
        startedAt: new Date(parsed.progress.startedAt),
        estimatedCompletion: parsed.progress.estimatedCompletion
          ? new Date(parsed.progress.estimatedCompletion)
          : undefined,
        logs: parsed.progress.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })),
      },
    };
  }
}

// Export singleton instance
let instance: JobStore | null = null;

export function getJobStore(): JobStore {
  if (!instance) {
    instance = new JobStore();
  }
  return instance;
}

export function resetJobStore(): void {
  instance = null;
}
