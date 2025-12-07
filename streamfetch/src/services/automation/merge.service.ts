/**
 * Merge Service
 * Handles audio replacement and video concatenation for dubbed chunks
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import {
  ChunkInfo,
  MergingProgress,
  MergeStep,
} from './automation.types';

export class MergeService {
  /**
   * Replace audio in a video chunk
   */
  async replaceAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v copy',       // Copy video stream (no re-encoding)
          '-c:a aac',        // Encode audio to AAC
          '-map 0:v:0',      // Map video from first input
          '-map 1:a:0',      // Map audio from second input
          '-shortest',       // Finish when shortest stream ends
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`Audio replacement failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Concatenate multiple video files
   */
  async concatenateVideos(
    videoPaths: string[],
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (videoPaths.length === 0) {
      throw new Error('No videos to concatenate');
    }

    if (videoPaths.length === 1) {
      // Just copy the single file
      await fs.copyFile(videoPaths[0], outputPath);
      return;
    }

    // Create concat list file
    const concatListPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    const concatList = videoPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    await fs.writeFile(concatListPath, concatList);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy']) // Copy streams (no re-encoding)
        .output(outputPath)
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 100));
          }
        })
        .on('end', async () => {
          // Clean up concat list file
          try {
            await fs.unlink(concatListPath);
          } catch (err) {
            // Ignore cleanup errors
          }
          resolve();
        })
        .on('error', async (err) => {
          // Clean up concat list file
          try {
            await fs.unlink(concatListPath);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
          reject(new Error(`Video concatenation failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Process all chunks: replace audio and concatenate
   */
  async mergeChunks(
    chunks: ChunkInfo[],
    dubbedAudioDir: string,
    outputDir: string,
    finalOutputPath: string,
    onProgress?: (progress: MergingProgress) => void
  ): Promise<string> {
    const tempDir = path.join(outputDir, 'temp_merged');
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Step 1: Replace audio in all chunks
      const mergedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const audioPath = path.join(dubbedAudioDir, `chunk_${String(chunk.index).padStart(3, '0')}_dubbed.mp3`);
        const outputPath = path.join(tempDir, `chunk_${String(chunk.index).padStart(3, '0')}_merged.mp4`);

        if (onProgress) {
          onProgress({
            percent: Math.floor((i / chunks.length) * 50),
            currentStep: 'replacing_audio',
            chunksProcessed: i,
            totalChunks: chunks.length,
          });
        }

        await this.replaceAudio(chunk.path, audioPath, outputPath);
        mergedChunks.push(outputPath);
      }

      if (onProgress) {
        onProgress({
          percent: 50,
          currentStep: 'replacing_audio',
          chunksProcessed: chunks.length,
          totalChunks: chunks.length,
        });
      }

      // Step 2: Concatenate all merged chunks
      if (onProgress) {
        onProgress({
          percent: 50,
          currentStep: 'concatenating',
          chunksProcessed: 0,
          totalChunks: chunks.length,
        });
      }

      await this.concatenateVideos(mergedChunks, finalOutputPath, (percent) => {
        if (onProgress) {
          onProgress({
            percent: 50 + Math.floor(percent * 0.45),
            currentStep: 'concatenating',
            chunksProcessed: chunks.length,
            totalChunks: chunks.length,
          });
        }
      });

      // Step 3: Finalize
      if (onProgress) {
        onProgress({
          percent: 95,
          currentStep: 'finalizing',
          chunksProcessed: chunks.length,
          totalChunks: chunks.length,
        });
      }

      // Clean up temp files
      await this.cleanupTempFiles(tempDir);

      if (onProgress) {
        onProgress({
          percent: 100,
          currentStep: 'finalizing',
          chunksProcessed: chunks.length,
          totalChunks: chunks.length,
        });
      }

      return finalOutputPath;
    } catch (error) {
      // Clean up temp files on error
      await this.cleanupTempFiles(tempDir);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      // Don't throw - cleanup failures are not critical
    }
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timestamp: number = 0
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '1280x720',
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`Thumbnail generation failed: ${err.message}`)))
        .run();
    });
  }
}

// Export singleton instance
let instance: MergeService | null = null;

export function getMergeService(): MergeService {
  if (!instance) {
    instance = new MergeService();
  }
  return instance;
}

export function resetMergeService(): void {
  instance = null;
}
