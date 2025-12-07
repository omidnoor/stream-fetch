/**
 * Chunk Service
 * Handles video chunking using FFmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import {
  ChunkInfo,
  ChunkManifest,
  ChunkingStrategy,
  ChunkingProgress,
} from './automation.types';
import { FFmpegService } from '@/services/ffmpeg/ffmpeg.service';

export class ChunkService {
  private ffmpegService: FFmpegService;

  constructor(ffmpegService?: FFmpegService) {
    this.ffmpegService = ffmpegService || new FFmpegService();
  }

  /**
   * Split video into chunks
   */
  async splitVideo(
    inputPath: string,
    outputDir: string,
    chunkDuration: number,
    strategy: ChunkingStrategy = 'fixed',
    onProgress?: (progress: ChunkingProgress) => void
  ): Promise<ChunkManifest> {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Get video metadata to determine total chunks
    const metadata = await this.ffmpegService.getVideoMetadata(inputPath);
    const totalChunks = Math.ceil(metadata.duration / chunkDuration);

    // Choose chunking strategy
    let chunks: ChunkInfo[];
    switch (strategy) {
      case 'fixed':
        chunks = await this.splitVideoFixed(
          inputPath,
          outputDir,
          chunkDuration,
          metadata.duration,
          totalChunks,
          onProgress
        );
        break;
      case 'scene':
        // TODO: Implement scene detection chunking
        chunks = await this.splitVideoFixed(
          inputPath,
          outputDir,
          chunkDuration,
          metadata.duration,
          totalChunks,
          onProgress
        );
        break;
      case 'silence':
        // TODO: Implement silence detection chunking
        chunks = await this.splitVideoFixed(
          inputPath,
          outputDir,
          chunkDuration,
          metadata.duration,
          totalChunks,
          onProgress
        );
        break;
      default:
        throw new Error(`Unknown chunking strategy: ${strategy}`);
    }

    // Create manifest
    const manifest: ChunkManifest = {
      jobId: path.basename(path.dirname(outputDir)),
      totalChunks: chunks.length,
      chunkDuration,
      chunks,
    };

    // Save manifest to file
    const manifestPath = path.join(outputDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    return manifest;
  }

  /**
   * Split video at fixed time intervals
   */
  private async splitVideoFixed(
    inputPath: string,
    outputDir: string,
    chunkDuration: number,
    totalDuration: number,
    totalChunks: number,
    onProgress?: (progress: ChunkingProgress) => void
  ): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    const outputPattern = path.join(outputDir, 'chunk_%03d.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c copy',              // Copy codec (fast, no re-encoding)
          '-map 0',               // Map all streams
          `-segment_time ${chunkDuration}`,
          '-f segment',           // Use segment muxer
          '-reset_timestamps 1',  // Reset timestamps for each chunk
        ])
        .output(outputPattern)
        .on('progress', (progress) => {
          if (onProgress && progress.timemark) {
            const currentTime = this.parseTime(progress.timemark);
            const processedChunks = Math.floor(currentTime / chunkDuration);

            onProgress({
              totalChunks,
              processed: Math.min(processedChunks, totalChunks),
              currentChunk: `chunk_${String(processedChunks).padStart(3, '0')}.mp4`,
            });
          }
        })
        .on('end', async () => {
          try {
            // Read generated chunks and create chunk info
            const files = await fs.readdir(outputDir);
            const chunkFiles = files
              .filter((f) => f.startsWith('chunk_') && f.endsWith('.mp4'))
              .sort();

            for (let i = 0; i < chunkFiles.length; i++) {
              const filename = chunkFiles[i];
              const chunkPath = path.join(outputDir, filename);
              const startTime = i * chunkDuration;
              const endTime = Math.min((i + 1) * chunkDuration, totalDuration);
              const duration = endTime - startTime;

              chunks.push({
                index: i,
                filename,
                startTime,
                endTime,
                duration,
                path: chunkPath,
              });
            }

            if (onProgress) {
              onProgress({
                totalChunks: chunks.length,
                processed: chunks.length,
              });
            }

            resolve(chunks);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg chunking failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Split video with re-encoding (for precise cuts)
   * Use this when copy mode doesn't work well
   */
  private async splitVideoWithReencoding(
    inputPath: string,
    outputDir: string,
    chunkDuration: number,
    totalDuration: number,
    totalChunks: number,
    onProgress?: (progress: ChunkingProgress) => void
  ): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    const outputPattern = path.join(outputDir, 'chunk_%03d.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-map 0',
          `-segment_time ${chunkDuration}`,
          '-f segment',
          '-reset_timestamps 1',
        ])
        .output(outputPattern)
        .on('progress', (progress) => {
          if (onProgress && progress.timemark) {
            const currentTime = this.parseTime(progress.timemark);
            const processedChunks = Math.floor(currentTime / chunkDuration);

            onProgress({
              totalChunks,
              processed: Math.min(processedChunks, totalChunks),
              currentChunk: `chunk_${String(processedChunks).padStart(3, '0')}.mp4`,
            });
          }
        })
        .on('end', async () => {
          try {
            const files = await fs.readdir(outputDir);
            const chunkFiles = files
              .filter((f) => f.startsWith('chunk_') && f.endsWith('.mp4'))
              .sort();

            for (let i = 0; i < chunkFiles.length; i++) {
              const filename = chunkFiles[i];
              const chunkPath = path.join(outputDir, filename);
              const startTime = i * chunkDuration;
              const endTime = Math.min((i + 1) * chunkDuration, totalDuration);
              const duration = endTime - startTime;

              chunks.push({
                index: i,
                filename,
                startTime,
                endTime,
                duration,
                path: chunkPath,
              });
            }

            if (onProgress) {
              onProgress({
                totalChunks: chunks.length,
                processed: chunks.length,
              });
            }

            resolve(chunks);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg chunking with re-encoding failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Get chunk information from manifest file
   */
  async getManifest(outputDir: string): Promise<ChunkManifest | null> {
    try {
      const manifestPath = path.join(outputDir, 'manifest.json');
      const data = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate chunk files exist
   */
  async validateChunks(manifest: ChunkManifest): Promise<boolean> {
    try {
      for (const chunk of manifest.chunks) {
        await fs.access(chunk.path);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get total size of all chunks
   */
  async getChunksSize(manifest: ChunkManifest): Promise<number> {
    let totalSize = 0;

    for (const chunk of manifest.chunks) {
      try {
        const stats = await fs.stat(chunk.path);
        totalSize += stats.size;
      } catch {
        // Skip chunks that don't exist
      }
    }

    return totalSize;
  }

  /**
   * Parse time string to seconds (e.g., "00:01:30.00" -> 90)
   */
  private parseTime(timeStr?: string): number {
    if (!timeStr) return 0;

    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    return hours * 3600 + minutes * 60 + seconds;
  }
}

// Export singleton instance
let instance: ChunkService | null = null;

export function getChunkService(): ChunkService {
  if (!instance) {
    instance = new ChunkService();
  }
  return instance;
}

export function resetChunkService(): void {
  instance = null;
}
