/**
 * Parallel Dubbing Service
 * Manages concurrent dubbing jobs with retry logic and progress tracking
 */

import path from 'path';
import fs from 'fs/promises';
import {
  ChunkInfo,
  ChunkStatus,
  ChunkState,
  DubbingResult,
  DubbingProgress,
} from './automation.types';
import { DubbingService } from '@/services/dubbing/dubbing.service';
import { getDubbingService } from '@/services/dubbing/dubbing.factory';

interface DubbingQueueItem {
  chunk: ChunkInfo;
  status: ChunkStatus;
  attempts: number;
  lastError?: string;
}

export class ParallelDubbingService {
  private queue: DubbingQueueItem[] = [];
  private active: Map<number, Promise<void>> = new Map();
  private activeItems: Map<number, DubbingQueueItem> = new Map(); // Track active item status
  private completed: Map<number, DubbingResult> = new Map();
  private failed: Set<number> = new Set();
  private dubbingService: DubbingService;

  constructor(
    private maxConcurrent: number = 3,
    private maxRetries: number = 3,
    private initialRetryDelay: number = 5000,
    private backoffMultiplier: number = 2,
    dubbingService?: DubbingService
  ) {
    this.dubbingService = dubbingService || getDubbingService();
  }

  /**
   * Process all chunks in parallel
   */
  async processChunks(
    chunks: ChunkInfo[],
    outputDir: string,
    targetLanguage: string,
    onProgress?: (progress: DubbingProgress) => void
  ): Promise<DubbingResult[]> {
    // Initialize queue
    this.queue = chunks.map((chunk) => ({
      chunk,
      status: {
        index: chunk.index,
        filename: chunk.filename,
        status: 'pending' as ChunkState,
        retryCount: 0,
      },
      attempts: 0,
    }));

    // Start processing
    await this.processQueue(outputDir, targetLanguage, onProgress);

    // Wait for all active jobs to complete
    await Promise.all(Array.from(this.active.values()));

    // Return results
    const results: DubbingResult[] = [];
    for (const chunk of chunks) {
      const result = this.completed.get(chunk.index);
      if (result) {
        results.push(result);
      } else {
        results.push({
          chunkIndex: chunk.index,
          outputPath: '',
          dubbingJobId: '',
          success: false,
          error: `Chunk ${chunk.index} failed after ${this.maxRetries} attempts`,
        });
      }
    }

    return results;
  }

  /**
   * Process the queue of chunks
   */
  private async processQueue(
    outputDir: string,
    targetLanguage: string,
    onProgress?: (progress: DubbingProgress) => void
  ): Promise<void> {
    while (this.queue.length > 0 || this.active.size > 0) {
      // Fill up active slots
      while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
        const item = this.queue.shift()!;
        const promise = this.processChunk(item, outputDir, targetLanguage, onProgress);
        this.active.set(item.chunk.index, promise);
        this.activeItems.set(item.chunk.index, item); // Track active item

        promise.finally(() => {
          this.active.delete(item.chunk.index);
          this.activeItems.delete(item.chunk.index); // Remove from active items
        });
      }

      // Wait a bit before checking again
      if (this.active.size > 0) {
        await Promise.race(Array.from(this.active.values()));
      }
    }
  }

  /**
   * Process a single chunk with retry logic
   */
  private async processChunk(
    item: DubbingQueueItem,
    outputDir: string,
    targetLanguage: string,
    onProgress?: (progress: DubbingProgress) => void
  ): Promise<void> {
    const { chunk } = item;

    while (item.attempts < this.maxRetries) {
      try {
        item.attempts++;
        item.status.retryCount = item.attempts - 1;

        // Update status to uploading
        item.status.status = 'uploading';
        item.status.startedAt = new Date();
        this.emitProgress(onProgress);

        // Create dubbing job
        const jobResult = await this.dubbingService.createDubbingJob({
          sourceUrl: `file://${chunk.path}`,
          targetLanguage: targetLanguage as any,
          watermark: true,
        });

        item.status.dubbingJobId = jobResult.dubbingId;
        item.status.status = 'processing';
        this.emitProgress(onProgress);

        // Poll for completion
        const audioBuffer = await this.pollDubbingJob(jobResult.dubbingId, targetLanguage, onProgress);

        // Save dubbed audio
        const outputPath = path.join(outputDir, `chunk_${String(chunk.index).padStart(3, '0')}_dubbed.mp3`);
        await fs.writeFile(outputPath, audioBuffer);

        // Mark as complete
        item.status.status = 'complete';
        item.status.completedAt = new Date();
        this.emitProgress(onProgress);

        this.completed.set(chunk.index, {
          chunkIndex: chunk.index,
          outputPath,
          dubbingJobId: jobResult.dubbingId,
          success: true,
        });

        return; // Success!
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        item.lastError = errorMessage;
        item.status.error = errorMessage;

        console.error(`Error dubbing chunk ${chunk.index} (attempt ${item.attempts}):`, errorMessage);

        if (item.attempts < this.maxRetries) {
          // Retry with exponential backoff
          const delay = this.initialRetryDelay * Math.pow(this.backoffMultiplier, item.attempts - 1);
          item.status.status = 'retrying';
          this.emitProgress(onProgress);

          console.log(`Retrying chunk ${chunk.index} in ${delay}ms...`);
          await this.delay(delay);
        } else {
          // Max retries exhausted
          item.status.status = 'failed';
          this.failed.add(chunk.index);
          this.emitProgress(onProgress);

          console.error(`Chunk ${chunk.index} failed after ${this.maxRetries} attempts`);
        }
      }
    }
  }

  /**
   * Poll for dubbing job completion
   */
  private async pollDubbingJob(
    dubbingId: string,
    targetLanguage: string,
    onProgress?: (progress: DubbingProgress) => void,
    maxWaitTime: number = 600000, // 10 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<Buffer> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.dubbingService.getDubbingStatus(dubbingId);

      if (status.status === 'dubbed') {
        // Download the dubbed audio
        const audio = await this.dubbingService.downloadDubbedAudio(dubbingId, targetLanguage);
        return audio.audioBuffer;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Dubbing job failed');
      }

      // Still processing, wait and poll again
      await this.delay(pollInterval);
      this.emitProgress(onProgress); // Keep UI updated
    }

    throw new Error('Dubbing job timed out');
  }

  /**
   * Emit progress update
   */
  private emitProgress(onProgress?: (progress: DubbingProgress) => void): void {
    if (!onProgress) return;

    const allChunks = [
      ...this.queue.map((item) => item.status),
      ...Array.from(this.activeItems.values()).map((item) => item.status), // Use activeItems map
      ...Array.from(this.completed.values()).map((result) => ({
        index: result.chunkIndex,
        filename: path.basename(result.outputPath),
        status: 'complete' as ChunkState,
        dubbingJobId: result.dubbingJobId,
        retryCount: 0,
      })),
      ...Array.from(this.failed).map((index) => ({
        index,
        filename: `chunk_${String(index).padStart(3, '0')}.mp4`,
        status: 'failed' as ChunkState,
        retryCount: this.maxRetries,
      })),
    ];

    const progress: DubbingProgress = {
      chunks: allChunks,
      activeJobs: this.active.size,
      completed: this.completed.size,
      failed: this.failed.size,
      pending: this.queue.length,
    };

    onProgress(progress);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel all active jobs
   */
  async cancelAll(): Promise<void> {
    // Clear queue
    this.queue = [];

    // Wait for active jobs to complete (we can't really cancel them mid-flight with ElevenLabs API)
    await Promise.all(Array.from(this.active.values()));
  }

  /**
   * Retry failed chunks only
   */
  async retryFailedChunks(
    failedIndices: number[],
    allChunks: ChunkInfo[],
    outputDir: string,
    targetLanguage: string,
    onProgress?: (progress: DubbingProgress) => void
  ): Promise<DubbingResult[]> {
    const chunksToRetry = allChunks.filter((c) => failedIndices.includes(c.index));

    // Reset failed set for these chunks
    failedIndices.forEach((index) => this.failed.delete(index));

    return this.processChunks(chunksToRetry, outputDir, targetLanguage, onProgress);
  }

  /**
   * Get current progress
   */
  getProgress(): DubbingProgress {
    const allChunks = [...this.queue.map((item) => item.status)];

    return {
      chunks: allChunks,
      activeJobs: this.active.size,
      completed: this.completed.size,
      failed: this.failed.size,
      pending: this.queue.length,
    };
  }
}

// Export singleton factory
let instance: ParallelDubbingService | null = null;

export function getParallelDubbingService(maxConcurrent?: number): ParallelDubbingService {
  if (!instance) {
    instance = new ParallelDubbingService(maxConcurrent);
  }
  return instance;
}

export function resetParallelDubbingService(): void {
  instance = null;
}
