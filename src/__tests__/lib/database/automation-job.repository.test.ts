/**
 * Automation Job Repository Tests
 *
 * Tests CRUD operations for automation jobs in MongoDB
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  getAutomationJobRepository,
  resetAutomationJobRepository,
} from '@/lib/database/repositories/automation-job.repository';
import { AutomationJob, JobStatus } from '@/services/automation/automation.types';
import { closeConnection } from '@/lib/database/mongodb';

describe('AutomationJobRepository', () => {
  let repository: ReturnType<typeof getAutomationJobRepository>;
  const testJobIds: string[] = [];

  beforeAll(() => {
    repository = getAutomationJobRepository();
  });

  afterAll(async () => {
    // Clean up test data
    for (const jobId of testJobIds) {
      try {
        await repository.delete(jobId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    await closeConnection();
  });

  beforeEach(() => {
    // Reset repository singleton between tests
    resetAutomationJobRepository();
    repository = getAutomationJobRepository();
  });

  const createTestJob = (status: JobStatus = 'pending'): AutomationJob => {
    const jobId = uuidv4();
    testJobIds.push(jobId);

    return {
      id: jobId,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      youtubeUrl: 'https://youtube.com/watch?v=test123',
      videoInfo: {
        title: 'Test Video',
        duration: 120,
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1080p',
        codec: 'h264',
      },
      config: {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      },
      progress: {
        stage: 'download',
        overallPercent: 0,
        startedAt: new Date(),
        logs: [],
      },
      paths: {
        root: '/temp/automation/test',
        source: '/temp/automation/test/source',
        chunks: '/temp/automation/test/chunks',
        dubbed: '/temp/automation/test/dubbed',
        output: '/temp/automation/test/output',
      },
    };
  };

  describe('create', () => {
    it('should create a new job', async () => {
      const job = createTestJob();
      await repository.create(job);

      const retrieved = await repository.get(job.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
      expect(retrieved?.status).toBe('pending');
      expect(retrieved?.youtubeUrl).toBe(job.youtubeUrl);
    });

    it('should throw error when creating duplicate job', async () => {
      const job = createTestJob();
      await repository.create(job);

      await expect(repository.create(job)).rejects.toThrow();
    });
  });

  describe('get', () => {
    it('should retrieve a job by ID', async () => {
      const job = createTestJob('downloading');
      await repository.create(job);

      const retrieved = await repository.get(job.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
      expect(retrieved?.status).toBe('downloading');
    });

    it('should return null for non-existent job', async () => {
      const result = await repository.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update job status', async () => {
      const job = createTestJob('pending');
      await repository.create(job);

      await repository.update(job.id, { status: 'downloading' });

      const updated = await repository.get(job.id);
      expect(updated?.status).toBe('downloading');
    });

    it('should update multiple fields', async () => {
      const job = createTestJob();
      await repository.create(job);

      await repository.update(job.id, {
        status: 'complete',
        outputFile: '/path/to/output.mp4',
      });

      const updated = await repository.get(job.id);
      expect(updated?.status).toBe('complete');
      expect(updated?.outputFile).toBe('/path/to/output.mp4');
    });

    it('should throw error when updating non-existent job', async () => {
      await expect(
        repository.update('non-existent-id', { status: 'complete' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a job', async () => {
      const job = createTestJob();
      await repository.create(job);

      await repository.delete(job.id);

      const retrieved = await repository.get(job.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent job', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should list all jobs', async () => {
      const job1 = createTestJob('pending');
      const job2 = createTestJob('downloading');
      await repository.create(job1);
      await repository.create(job2);

      const jobs = await repository.list();
      expect(jobs.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter jobs by status', async () => {
      const job1 = createTestJob('pending');
      const job2 = createTestJob('complete');
      await repository.create(job1);
      await repository.create(job2);

      const pendingJobs = await repository.list({ status: 'pending' });
      expect(pendingJobs.every((j) => j.status === 'pending')).toBe(true);
    });

    it('should apply pagination', async () => {
      const job1 = createTestJob();
      const job2 = createTestJob();
      const job3 = createTestJob();
      await repository.create(job1);
      await repository.create(job2);
      await repository.create(job3);

      const page1 = await repository.list({ limit: 2, offset: 0 });
      const page2 = await repository.list({ limit: 2, offset: 2 });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('count', () => {
    it('should count all jobs', async () => {
      const initialCount = await repository.count();

      const job = createTestJob();
      await repository.create(job);

      const newCount = await repository.count();
      expect(newCount).toBe(initialCount + 1);
    });

    it('should count jobs by status', async () => {
      const job1 = createTestJob('pending');
      const job2 = createTestJob('pending');
      await repository.create(job1);
      await repository.create(job2);

      const count = await repository.count({ status: 'pending' });
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateProgress', () => {
    it('should update job progress', async () => {
      const job = createTestJob();
      await repository.create(job);

      const newProgress = {
        ...job.progress,
        overallPercent: 50,
        stage: 'dubbing' as const,
      };

      await repository.updateProgress(job.id, newProgress);

      const updated = await repository.get(job.id);
      expect(updated?.progress.overallPercent).toBe(50);
      expect(updated?.progress.stage).toBe('dubbing');
    });
  });

  describe('addLog', () => {
    it('should add log entry to job', async () => {
      const job = createTestJob();
      await repository.create(job);

      const logEntry = {
        timestamp: new Date(),
        level: 'info' as const,
        stage: 'download' as const,
        message: 'Download started',
      };

      await repository.addLog(job.id, logEntry);

      const updated = await repository.get(job.id);
      expect(updated?.progress.logs.length).toBeGreaterThan(0);
      expect(updated?.progress.logs[0].message).toBe('Download started');
    });

    it('should limit logs to 1000 entries', async () => {
      const job = createTestJob();
      await repository.create(job);

      // Add 1100 log entries
      for (let i = 0; i < 1100; i++) {
        await repository.addLog(job.id, {
          timestamp: new Date(),
          level: 'info',
          stage: 'download',
          message: `Log ${i}`,
        });
      }

      const updated = await repository.get(job.id);
      expect(updated?.progress.logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('exists', () => {
    it('should return true for existing job', async () => {
      const job = createTestJob();
      await repository.create(job);

      const exists = await repository.exists(job.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent job', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('getByStatus', () => {
    it('should get jobs by status', async () => {
      const job = createTestJob('complete');
      await repository.create(job);

      const completedJobs = await repository.getByStatus('complete');
      expect(completedJobs.length).toBeGreaterThanOrEqual(1);
      expect(completedJobs.every((j) => j.status === 'complete')).toBe(true);
    });
  });

  describe('getRecentlyUpdated', () => {
    it('should get recently updated jobs', async () => {
      const job1 = createTestJob();
      const job2 = createTestJob();
      await repository.create(job1);
      await repository.create(job2);

      const recentJobs = await repository.getRecentlyUpdated(5);
      expect(recentJobs.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by updatedAt descending
      for (let i = 1; i < recentJobs.length; i++) {
        expect(recentJobs[i - 1].updatedAt.getTime()).toBeGreaterThanOrEqual(
          recentJobs[i].updatedAt.getTime()
        );
      }
    });
  });
});
