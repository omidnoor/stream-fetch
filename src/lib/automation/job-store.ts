/**
 * Job Persistence Store
 * MongoDB-based storage for automation jobs
 *
 * MIGRATED FROM FILE-BASED TO MONGODB
 */

import { AutomationJob, JobStatus, PipelineProgress, LogEntry } from '@/services/automation/automation.types';
import { getAutomationJobRepository } from '@/lib/database/repositories/automation-job.repository';

export class JobStore {
  private repository = getAutomationJobRepository();

  /**
   * Initialize the job store
   * No-op for MongoDB (kept for backward compatibility)
   */
  async initialize(): Promise<void> {
    // MongoDB connection is handled automatically
    console.log('[JobStore] Using MongoDB storage');
  }

  /**
   * Create a new job record
   */
  async create(job: AutomationJob): Promise<void> {
    await this.repository.create(job);
  }

  /**
   * Get a job by ID
   */
  async get(jobId: string): Promise<AutomationJob | null> {
    return await this.repository.get(jobId);
  }

  /**
   * Update a job with partial data
   */
  async update(jobId: string, updates: Partial<AutomationJob>): Promise<void> {
    await this.repository.update(jobId, updates);
  }

  /**
   * Delete a job
   */
  async delete(jobId: string): Promise<void> {
    await this.repository.delete(jobId);
  }

  /**
   * List all jobs with optional filter
   */
  async list(filter?: { status?: JobStatus; limit?: number; offset?: number }): Promise<AutomationJob[]> {
    return await this.repository.list(filter);
  }

  /**
   * Count jobs with optional filter
   */
  async count(filter?: { status?: JobStatus }): Promise<number> {
    return await this.repository.count(filter);
  }

  /**
   * Update job progress (optimized for frequent updates)
   */
  async updateProgress(jobId: string, progress: PipelineProgress): Promise<void> {
    await this.repository.updateProgress(jobId, progress);
  }

  /**
   * Add a log entry to a job
   */
  async addLog(jobId: string, log: LogEntry): Promise<void> {
    await this.repository.addLog(jobId, log);
  }

  /**
   * Check if a job exists
   */
  async exists(jobId: string): Promise<boolean> {
    return await this.repository.exists(jobId);
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
