/**
 * Automation Service
 * Main orchestrator for the automated dubbing pipeline
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import {
  AutomationJob,
  PipelineConfig,
  JobStatus,
  PipelineProgress,
  LogEntry,
  JobError,
  VideoInfo,
  ChunkStatus,
} from './automation.types';
import { getJobStore } from '@/lib/automation/job-store';
import { getTempManager } from '@/lib/automation/temp-manager';
import { getProgressEmitter, createLogEntry } from '@/lib/automation/progress-emitter';
import { getCostCalculator } from '@/lib/automation/cost-calculator';
import { getChunkService } from './chunk.service';
import { YouTubeService } from '@/services/youtube/youtube.service';

export class AutomationService {
  private jobStore = getJobStore();
  private tempManager = getTempManager();
  private progressEmitter = getProgressEmitter();
  private costCalculator = getCostCalculator();
  private chunkService = getChunkService();

  constructor(
    private youtubeService: YouTubeService
  ) {}

  /**
   * Start a new automation pipeline
   */
  async startPipeline(youtubeUrl: string, config: PipelineConfig): Promise<string> {
    // Get video info
    const videoInfoDto = await this.youtubeService.getVideoInfo(youtubeUrl);

    const videoInfo: VideoInfo = {
      title: videoInfoDto.title,
      duration: videoInfoDto.duration,
      thumbnail: videoInfoDto.thumbnail,
      resolution: `${videoInfoDto.formats[0]?.width || 0}x${videoInfoDto.formats[0]?.height || 0}`,
      codec: videoInfoDto.formats[0]?.mimeType?.split(';')[0] || 'video/mp4',
      fileSize: videoInfoDto.formats[0]?.contentLength,
    };

    // Create job
    const jobId = uuidv4();
    const paths = await this.tempManager.createJobDirectories(jobId);

    const job: AutomationJob = {
      id: jobId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      youtubeUrl,
      videoInfo,
      config,
      progress: {
        stage: 'download',
        overallPercent: 0,
        startedAt: new Date(),
        logs: [],
      },
      paths,
    };

    // Save job
    await this.jobStore.create(job);

    // Log start
    await this.addLog(jobId, 'download', 'info', 'Pipeline started');

    // Start pipeline execution (async)
    this.executePipeline(jobId).catch((error) => {
      console.error(`Pipeline execution failed for job ${jobId}:`, error);
    });

    return jobId;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<AutomationJob | null> {
    return this.jobStore.get(jobId);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.jobStore.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'complete' || job.status === 'cancelled' || job.status === 'failed') {
      throw new Error('Cannot cancel a completed, cancelled, or failed job');
    }

    await this.updateStatus(jobId, 'cancelled');
    await this.addLog(jobId, job.progress.stage, 'info', 'Job cancelled by user');

    this.progressEmitter.emitError(jobId, {
      code: 'CANCELLED',
      message: 'Job was cancelled by user',
      stage: job.progress.stage,
      recoverable: false,
    });
  }

  /**
   * Retry failed chunks (stub for now)
   */
  async retryFailedChunks(jobId: string): Promise<void> {
    // TODO: Implement in Phase 2
    throw new Error('Not implemented yet');
  }

  // ============================================================================
  // Pipeline Execution
  // ============================================================================

  private async executePipeline(jobId: string): Promise<void> {
    try {
      const job = await this.jobStore.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Stage 1: Download
      await this.downloadVideo(job);

      // Stage 2: Chunk
      await this.chunkVideo(job);

      // Stage 3: Dub (stub)
      await this.dubChunks(job);

      // Stage 4: Merge (stub)
      await this.mergeChunks(job);

      // Stage 5: Finalize
      await this.finalize(job);

      // Complete
      await this.updateStatus(jobId, 'complete');
      await this.addLog(jobId, 'finalize', 'info', 'Pipeline completed successfully');

      this.progressEmitter.emitComplete(jobId, job.outputFile!, Date.now() - job.progress.startedAt.getTime());
    } catch (error) {
      await this.handlePipelineError(jobId, error as Error);
    }
  }

  // ============================================================================
  // Stage 1: Download Video
  // ============================================================================

  private async downloadVideo(job: AutomationJob): Promise<void> {
    await this.updateStatus(job.id, 'downloading');
    await this.updateProgress(job.id, { stage: 'download', overallPercent: 5 });
    await this.addLog(job.id, 'download', 'info', 'Starting video download');

    try {
      // Get best video+audio format
      const videoInfo = await this.youtubeService.getVideoInfo(job.youtubeUrl);

      // Find best mp4 format with video and audio
      const bestFormat = videoInfo.formats.find(
        (f) => f.mimeType?.includes('video/mp4') && f.hasAudio && f.hasVideo
      );

      if (!bestFormat) {
        throw new Error('No suitable format found');
      }

      // Get download URL
      const downloadUrl = await this.youtubeService.getDownloadUrl(job.youtubeUrl, bestFormat.itag);

      // Download file
      const outputPath = path.join(job.paths.source, 'video.mp4');
      await this.downloadFile(downloadUrl.url, outputPath, (percent) => {
        this.updateProgress(job.id, {
          stage: 'download',
          overallPercent: 5 + Math.floor(percent * 0.15),
          download: {
            percent,
            bytesDownloaded: 0,
            totalBytes: downloadUrl.contentLength || 0,
            speed: '0 MB/s',
            eta: 0,
          },
        });
      });

      await this.addLog(job.id, 'download', 'info', `Downloaded video to ${outputPath}`);
      await this.updateProgress(job.id, { stage: 'download', overallPercent: 20 });
    } catch (error) {
      throw new Error(`Download failed: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // Stage 2: Chunk Video
  // ============================================================================

  private async chunkVideo(job: AutomationJob): Promise<void> {
    await this.updateStatus(job.id, 'chunking');
    await this.updateProgress(job.id, { stage: 'chunk', overallPercent: 20 });
    await this.addLog(job.id, 'chunk', 'info', 'Starting video chunking');

    try {
      const sourcePath = path.join(job.paths.source, 'video.mp4');

      const manifest = await this.chunkService.splitVideo(
        sourcePath,
        job.paths.chunks,
        job.config.chunkDuration,
        job.config.chunkingStrategy,
        (progress) => {
          this.updateProgress(job.id, {
            stage: 'chunk',
            overallPercent: 20 + Math.floor((progress.processed / progress.totalChunks) * 5),
            chunking: progress,
          });
        }
      );

      await this.addLog(
        job.id,
        'chunk',
        'info',
        `Created ${manifest.totalChunks} chunks of ${job.config.chunkDuration}s each`
      );

      await this.updateProgress(job.id, { stage: 'chunk', overallPercent: 25 });
    } catch (error) {
      throw new Error(`Chunking failed: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // Stage 3: Dub Chunks (Stub)
  // ============================================================================

  private async dubChunks(job: AutomationJob): Promise<void> {
    await this.updateStatus(job.id, 'dubbing');
    await this.updateProgress(job.id, { stage: 'dub', overallPercent: 25 });
    await this.addLog(job.id, 'dub', 'info', 'Starting parallel dubbing (stub)');

    // TODO: Implement in Phase 2
    // For now, just simulate progress
    for (let i = 0; i <= 70; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.updateProgress(job.id, { stage: 'dub', overallPercent: 25 + i });
    }

    await this.addLog(job.id, 'dub', 'info', 'Dubbing completed (stub)');
  }

  // ============================================================================
  // Stage 4: Merge Chunks (Stub)
  // ============================================================================

  private async mergeChunks(job: AutomationJob): Promise<void> {
    await this.updateStatus(job.id, 'merging');
    await this.updateProgress(job.id, { stage: 'merge', overallPercent: 95 });
    await this.addLog(job.id, 'merge', 'info', 'Starting chunk merging (stub)');

    // TODO: Implement in Phase 3
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await this.updateProgress(job.id, { stage: 'merge', overallPercent: 98 });
    await this.addLog(job.id, 'merge', 'info', 'Merging completed (stub)');
  }

  // ============================================================================
  // Stage 5: Finalize
  // ============================================================================

  private async finalize(job: AutomationJob): Promise<void> {
    await this.updateStatus(job.id, 'finalizing');
    await this.updateProgress(job.id, { stage: 'finalize', overallPercent: 98 });
    await this.addLog(job.id, 'finalize', 'info', 'Finalizing output');

    // Set output file path
    const outputPath = path.join(job.paths.output, 'final_dubbed_video.mp4');
    await this.jobStore.update(job.id, { outputFile: outputPath });

    // Schedule cleanup
    this.tempManager.scheduleOutputCleanup(job.paths, 24 * 60 * 60 * 1000);

    await this.updateProgress(job.id, { stage: 'finalize', overallPercent: 100 });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async downloadFile(url: string, outputPath: string, onProgress?: (percent: number) => void): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
    let downloadedBytes = 0;

    const fileHandle = await fs.open(outputPath, 'w');
    const writer = fileHandle.createWriteStream();

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        writer.write(value);
        downloadedBytes += value.length;

        if (onProgress && totalBytes > 0) {
          const percent = Math.floor((downloadedBytes / totalBytes) * 100);
          onProgress(percent);
        }
      }

      writer.end();
      await fileHandle.close();
    } catch (error) {
      await fileHandle.close();
      throw error;
    }
  }

  private async updateStatus(jobId: string, status: JobStatus): Promise<void> {
    await this.jobStore.update(jobId, { status });
  }

  private async updateProgress(jobId: string, updates: Partial<PipelineProgress>): Promise<void> {
    const job = await this.jobStore.get(jobId);
    if (!job) return;

    const updatedProgress: PipelineProgress = {
      ...job.progress,
      ...updates,
    };

    await this.jobStore.updateProgress(jobId, updatedProgress);
    this.progressEmitter.emitProgress(jobId, updatedProgress);
  }

  private async addLog(
    jobId: string,
    stage: LogEntry['stage'],
    level: LogEntry['level'],
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log = createLogEntry(stage, level, message, metadata);
    await this.jobStore.addLog(jobId, log);
    this.progressEmitter.emitLog(jobId, log);
  }

  private async handlePipelineError(jobId: string, error: Error): Promise<void> {
    const job = await this.jobStore.get(jobId);
    if (!job) return;

    const jobError: JobError = {
      code: 'PIPELINE_FAILED',
      message: error.message,
      stage: job.progress.stage,
      recoverable: false,
      details: { error: error.stack },
    };

    await this.jobStore.update(jobId, { status: 'failed', error: jobError });
    await this.addLog(jobId, job.progress.stage, 'error', `Pipeline failed: ${error.message}`);

    this.progressEmitter.emitError(jobId, jobError);
  }
}
