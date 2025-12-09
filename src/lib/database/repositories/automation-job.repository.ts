/**
 * Automation Job Repository
 *
 * MongoDB-based persistence for automation pipeline jobs.
 * Replaces the file-based JobStore implementation.
 */

import { Collection, Filter, Document } from 'mongodb';
import { getCollection, Collections } from '../mongodb';
import {
  AutomationJob,
  JobStatus,
  PipelineProgress,
  LogEntry,
} from '@/services/automation/automation.types';

export class AutomationJobRepository {
  private async getCollection(): Promise<Collection<AutomationJob>> {
    return getCollection<AutomationJob>(Collections.AUTOMATION_JOBS);
  }

  /**
   * Create a new job record
   */
  async create(job: AutomationJob): Promise<void> {
    const collection = await this.getCollection();

    try {
      await collection.insertOne(job);
      console.log(`[AutomationJobRepository] Created job: ${job.id}`);
    } catch (error) {
      console.error('[AutomationJobRepository] Create failed:', error);
      throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a job by ID
   */
  async get(jobId: string): Promise<AutomationJob | null> {
    const collection = await this.getCollection();

    try {
      const job = await collection.findOne({ id: jobId } as Filter<Document>);
      return job as AutomationJob | null;
    } catch (error) {
      console.error('[AutomationJobRepository] Get failed:', error);
      throw new Error(`Failed to get job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a job with partial data
   */
  async update(jobId: string, updates: Partial<AutomationJob>): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.updateOne(
        { id: jobId } as Filter<Document>,
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      console.log(`[AutomationJobRepository] Updated job: ${jobId}`);
    } catch (error) {
      console.error('[AutomationJobRepository] Update failed:', error);
      throw new Error(`Failed to update job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a job
   */
  async delete(jobId: string): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.deleteOne({ id: jobId } as Filter<Document>);

      if (result.deletedCount === 0) {
        console.warn(`[AutomationJobRepository] Job ${jobId} not found for deletion`);
      } else {
        console.log(`[AutomationJobRepository] Deleted job: ${jobId}`);
      }
    } catch (error) {
      console.error('[AutomationJobRepository] Delete failed:', error);
      throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all jobs with optional filter
   */
  async list(filter?: {
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<AutomationJob[]> {
    const collection = await this.getCollection();

    try {
      const query: Filter<Document> = {};
      if (filter?.status) {
        query.status = filter.status;
      }

      const cursor = collection
        .find(query as Filter<Document>)
        .sort({ createdAt: -1 })
        .skip(filter?.offset || 0)
        .limit(filter?.limit || 10);

      const jobs = await cursor.toArray();
      return jobs as AutomationJob[];
    } catch (error) {
      console.error('[AutomationJobRepository] List failed:', error);
      throw new Error(`Failed to list jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count jobs with optional filter
   */
  async count(filter?: { status?: JobStatus }): Promise<number> {
    const collection = await this.getCollection();

    try {
      const query: Filter<Document> = {};
      if (filter?.status) {
        query.status = filter.status;
      }

      return await collection.countDocuments(query as Filter<Document>);
    } catch (error) {
      console.error('[AutomationJobRepository] Count failed:', error);
      throw new Error(`Failed to count jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update job progress (optimized for frequent updates)
   */
  async updateProgress(jobId: string, progress: PipelineProgress): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.updateOne(
        { id: jobId } as Filter<Document>,
        {
          $set: {
            progress,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Job ${jobId} not found`);
      }
    } catch (error) {
      console.error('[AutomationJobRepository] Update progress failed:', error);
      throw new Error(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a log entry to a job
   *
   * Uses MongoDB $push operator to append to logs array
   * and $slice to keep only the last 1000 logs
   */
  async addLog(jobId: string, log: LogEntry): Promise<void> {
    const collection = await this.getCollection();

    try {
      const result = await collection.updateOne(
        { id: jobId } as Filter<Document>,
        {
          $push: {
            'progress.logs': {
              $each: [log],
              $slice: -1000, // Keep only last 1000 logs
            },
          } as Filter<Document>,
          $set: {
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Job ${jobId} not found`);
      }
    } catch (error) {
      console.error('[AutomationJobRepository] Add log failed:', error);
      throw new Error(`Failed to add log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a job exists
   */
  async exists(jobId: string): Promise<boolean> {
    const collection = await this.getCollection();

    try {
      const count = await collection.countDocuments({ id: jobId } as Filter<Document>);
      return count > 0;
    } catch (error) {
      console.error('[AutomationJobRepository] Exists check failed:', error);
      return false;
    }
  }

  /**
   * Get jobs by status (helper method)
   */
  async getByStatus(status: JobStatus, limit: number = 10): Promise<AutomationJob[]> {
    return this.list({ status, limit });
  }

  /**
   * Get recently updated jobs
   */
  async getRecentlyUpdated(limit: number = 10): Promise<AutomationJob[]> {
    const collection = await this.getCollection();

    try {
      const cursor = collection
        .find({})
        .sort({ updatedAt: -1 })
        .limit(limit);

      const jobs = await cursor.toArray();
      return jobs as AutomationJob[];
    } catch (error) {
      console.error('[AutomationJobRepository] Get recently updated failed:', error);
      throw new Error(`Failed to get recently updated jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up old completed jobs
   * Useful for maintenance
   */
  async deleteOldCompletedJobs(daysOld: number = 30): Promise<number> {
    const collection = await this.getCollection();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        status: { $in: ['complete', 'failed', 'cancelled'] },
        updatedAt: { $lt: cutoffDate },
      } as Filter<Document>);

      console.log(`[AutomationJobRepository] Deleted ${result.deletedCount} old jobs`);
      return result.deletedCount;
    } catch (error) {
      console.error('[AutomationJobRepository] Cleanup failed:', error);
      throw new Error(`Failed to cleanup old jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
let instance: AutomationJobRepository | null = null;

export function getAutomationJobRepository(): AutomationJobRepository {
  if (!instance) {
    instance = new AutomationJobRepository();
  }
  return instance;
}

export function resetAutomationJobRepository(): void {
  instance = null;
}
