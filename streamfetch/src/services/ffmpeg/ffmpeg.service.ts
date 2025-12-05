/**
 * FFmpeg Service
 *
 * Handles video processing operations using FFmpeg.
 * Provides methods for trimming, concatenating, filtering, and rendering videos.
 */

import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import {
  FFmpegError,
  FFmpegNotFoundError,
  VideoProcessingError,
  ThumbnailGenerationError,
} from "@/lib/errors/editor.errors.js";
import type {
  TrimOptions,
  ConcatenateOptions,
  ThumbnailOptions,
  AddAudioOptions,
  FilterOptions,
  RenderOptions,
  VideoInfo,
  FFmpegResult,
  ProgressInfo,
  QUALITY_PRESETS,
} from "./ffmpeg.types.js";
import type { VideoMetadata } from "../editor/editor.types.js";

export class FFmpegService {
  private ffmpegPath?: string;
  private ffprobePath?: string;

  constructor(ffmpegPath?: string, ffprobePath?: string) {
    this.ffmpegPath = ffmpegPath;
    this.ffprobePath = ffprobePath;

    // Set custom paths if provided
    if (this.ffmpegPath) {
      ffmpeg.setFfmpegPath(this.ffmpegPath);
    }
    if (this.ffprobePath) {
      ffmpeg.setFfprobePath(this.ffprobePath);
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(
            new VideoProcessingError("Failed to get video metadata", err)
          );
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === "video");
        const audioStream = metadata.streams.find((s) => s.codec_type === "audio");

        if (!videoStream) {
          reject(new VideoProcessingError("No video stream found"));
          return;
        }

        const videoMetadata: VideoMetadata = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          frameRate: this.parseFrameRate(videoStream.r_frame_rate || videoStream.avg_frame_rate),
          bitrate: metadata.format.bit_rate || 0,
          codec: videoStream.codec_name || "unknown",
          format: metadata.format.format_name || "unknown",
          size: metadata.format.size || 0,
          hasAudio: !!audioStream,
          audioCodec: audioStream?.codec_name,
          audioSampleRate: audioStream?.sample_rate,
        };

        resolve(videoMetadata);
      });
    });
  }

  /**
   * Trim video to specified time range
   */
  async trimVideo(options: TrimOptions): Promise<FFmpegResult> {
    const { inputPath, outputPath, startTime, endTime } = options;
    const duration = endTime - startTime;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on("end", () => {
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err) => {
          reject(new FFmpegError("trim", err.message, err));
        })
        .run();
    });
  }

  /**
   * Concatenate multiple videos
   */
  async concatenateVideos(options: ConcatenateOptions): Promise<FFmpegResult> {
    const { inputPaths, outputPath } = options;

    if (inputPaths.length === 0) {
      throw new VideoProcessingError("No input files provided for concatenation");
    }

    if (inputPaths.length === 1) {
      // Just copy the file if there's only one
      await fs.copyFile(inputPaths[0], outputPath);
      return { success: true, outputPath };
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Add all input files
      inputPaths.forEach((inputPath) => {
        command.input(inputPath);
      });

      // Use concat filter
      const filterComplex = inputPaths
        .map((_, i) => `[${i}:v:0][${i}:a:0]`)
        .join("") + `concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

      command
        .complexFilter(filterComplex)
        .map("[outv]")
        .map("[outa]")
        .output(outputPath)
        .on("end", () => {
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err) => {
          reject(new FFmpegError("concatenate", err.message, err));
        })
        .run();
    });
  }

  /**
   * Generate thumbnail from video
   */
  async extractThumbnail(options: ThumbnailOptions): Promise<FFmpegResult> {
    const {
      inputPath,
      outputPath,
      timestamp = 0,
      width,
      height,
      quality = 2,
    } = options;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: width && height ? `${width}x${height}` : undefined,
        })
        .on("end", () => {
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err) => {
          reject(new ThumbnailGenerationError(inputPath, err.message));
        });

      command.run();
    });
  }

  /**
   * Add or replace audio track
   */
  async addAudioTrack(options: AddAudioOptions): Promise<FFmpegResult> {
    const {
      videoPath,
      audioPath,
      outputPath,
      replaceAudio = true,
      audioVolume = 1.0,
      videoVolume = 1.0,
    } = options;

    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(videoPath)
        .input(audioPath);

      if (replaceAudio) {
        // Replace audio completely
        command
          .outputOptions(["-c:v copy", "-map 0:v:0", "-map 1:a:0"])
          .audioFilters(`volume=${audioVolume}`);
      } else {
        // Mix audio tracks
        command.complexFilter([
          `[0:a]volume=${videoVolume}[a0]`,
          `[1:a]volume=${audioVolume}[a1]`,
          `[a0][a1]amix=inputs=2:duration=longest[aout]`,
        ]).map("[aout]");
      }

      command
        .output(outputPath)
        .on("end", () => {
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err) => {
          reject(new FFmpegError("addAudio", err.message, err));
        })
        .run();
    });
  }

  /**
   * Apply video filter
   */
  async applyFilter(options: FilterOptions): Promise<FFmpegResult> {
    const { inputPath, outputPath, filter, videoCodec, audioCodec } = options;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath).videoFilters(filter);

      if (videoCodec) {
        command.videoCodec(videoCodec);
      }

      if (audioCodec) {
        command.audioCodec(audioCodec);
      }

      command
        .output(outputPath)
        .on("end", () => {
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err) => {
          reject(new FFmpegError("filter", err.message, err));
        })
        .run();
    });
  }

  /**
   * Render final video with all settings
   */
  async renderVideo(options: RenderOptions): Promise<FFmpegResult> {
    const { inputPaths, outputPath, settings, onProgress } = options;

    if (inputPaths.length === 0) {
      throw new VideoProcessingError("No input files provided for rendering");
    }

    // Import quality presets dynamically
    const { QUALITY_PRESETS } = await import("./ffmpeg.types.js");
    const qualityPreset = (QUALITY_PRESETS as typeof import("./ffmpeg.types.js").QUALITY_PRESETS)[settings.quality];

    return new Promise(async (resolve, reject) => {
      try {
        // If multiple inputs, concatenate first
        let inputPath: string;
        if (inputPaths.length > 1) {
          const tempConcatPath = path.join(
            path.dirname(outputPath),
            `temp_concat_${Date.now()}.mp4`
          );
          await this.concatenateVideos({
            inputPaths,
            outputPath: tempConcatPath,
          });
          inputPath = tempConcatPath;
        } else {
          inputPath = inputPaths[0];
        }

        const command = ffmpeg(inputPath);

        // Set codec
        const codec = settings.codec || "libx264";
        command.videoCodec(codec);

        // Set quality settings
        if (qualityPreset) {
          command
            .videoBitrate(settings.bitrate || qualityPreset.videoBitrate)
            .audioBitrate(settings.audioBitrate || qualityPreset.audioBitrate);

          if (qualityPreset.crf !== undefined) {
            command.outputOptions([`-crf ${qualityPreset.crf}`]);
          }

          if (qualityPreset.preset) {
            command.outputOptions([`-preset ${qualityPreset.preset}`]);
          }
        }

        // Set resolution if specified
        if (settings.resolution) {
          command.size(`${settings.resolution.width}x${settings.resolution.height}`);
        }

        // Set frame rate if specified
        if (settings.frameRate) {
          command.fps(settings.frameRate);
        }

        // Set format
        command.format(settings.format);

        // Handle progress
        if (onProgress) {
          command.on("progress", (progress) => {
            const progressInfo: ProgressInfo = {
              percent: progress.percent || 0,
              currentTime: this.parseTime(progress.timemark),
              targetDuration: 0, // Will be updated if metadata is available
              currentFrame: progress.frames,
              fps: progress.currentFps,
              speed: progress.currentKbps ? `${progress.currentKbps}kbps` : undefined,
            };
            onProgress(progressInfo);
          });
        }

        command
          .output(outputPath)
          .on("end", async () => {
            // Clean up temp file if created
            if (inputPaths.length > 1) {
              try {
                await fs.unlink(inputPath);
              } catch (err) {
                // Ignore cleanup errors
              }
            }

            resolve({
              success: true,
              outputPath,
            });
          })
          .on("error", async (err) => {
            // Clean up temp file if created
            if (inputPaths.length > 1) {
              try {
                await fs.unlink(inputPath);
              } catch (cleanupErr) {
                // Ignore cleanup errors
              }
            }

            reject(new FFmpegError("render", err.message, err));
          })
          .run();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoPath: string): Promise<VideoInfo> {
    const metadata = await this.getVideoMetadata(videoPath);

    return {
      ...metadata,
      path: videoPath,
      filename: path.basename(videoPath),
    };
  }

  /**
   * Parse frame rate string (e.g., "30/1" -> 30)
   */
  private parseFrameRate(frameRateStr?: string): number {
    if (!frameRateStr) return 30;

    const parts = frameRateStr.split("/");
    if (parts.length === 2) {
      const numerator = parseInt(parts[0], 10);
      const denominator = parseInt(parts[1], 10);
      return denominator !== 0 ? numerator / denominator : 30;
    }

    return parseFloat(frameRateStr) || 30;
  }

  /**
   * Parse time string to seconds (e.g., "00:01:30.00" -> 90)
   */
  private parseTime(timeStr?: string): number {
    if (!timeStr) return 0;

    const parts = timeStr.split(":");
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
