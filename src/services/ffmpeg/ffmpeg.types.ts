/**
 * FFmpeg Service Types
 *
 * Types and interfaces for FFmpeg video processing operations
 */

import type { VideoMetadata, ExportSettings } from "../editor/editor.types";

/**
 * FFmpeg processing options
 */
export interface ProcessingOptions {
  inputPath: string;
  outputPath: string;
  startTime?: number; // in seconds
  duration?: number; // in seconds
  noAudio?: boolean;
  videoCodec?: string;
  audioCodec?: string;
  format?: string;
}

/**
 * Trim video options
 */
export interface TrimOptions {
  inputPath: string;
  outputPath: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * Concatenate videos options
 */
export interface ConcatenateOptions {
  inputPaths: string[];
  outputPath: string;
  format?: string;
}

/**
 * Thumbnail generation options
 */
export interface ThumbnailOptions {
  inputPath: string;
  outputPath: string;
  timestamp?: number; // time in seconds to extract thumbnail
  width?: number;
  height?: number;
  quality?: number; // 1-31, lower is better (default 2)
}

/**
 * Add audio track options
 */
export interface AddAudioOptions {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  replaceAudio?: boolean; // true: replace, false: mix
  audioVolume?: number; // 0-1
  videoVolume?: number; // 0-1
}

/**
 * Apply filter options
 */
export interface FilterOptions {
  inputPath: string;
  outputPath: string;
  filter: string; // FFmpeg filter string
  videoCodec?: string;
  audioCodec?: string;
}

/**
 * Render options for final video export
 */
export interface RenderOptions {
  inputPaths: string[];
  outputPath: string;
  settings: ExportSettings;
  onProgress?: (progress: ProgressInfo) => void;
}

/**
 * Progress information for FFmpeg operations
 */
export interface ProgressInfo {
  percent: number; // 0-100
  currentTime: number; // in seconds
  targetDuration: number; // in seconds
  currentFrame?: number;
  fps?: number;
  speed?: string; // e.g., "1.5x"
}

/**
 * Video information response
 */
export interface VideoInfo extends VideoMetadata {
  path: string;
  filename: string;
}

/**
 * FFmpeg command result
 */
export interface FFmpegResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number; // processing duration in seconds
}

/**
 * Quality preset configurations
 */
export interface QualityPreset {
  videoBitrate: string;
  audioBitrate: string;
  crf?: number; // Constant Rate Factor (0-51, lower is better)
  preset?: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow";
}

/**
 * Resolution preset configurations
 */
export interface ResolutionPreset {
  width: number;
  height: number;
  label: string;
}

/**
 * Export quality presets
 */
export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: {
    videoBitrate: "500k",
    audioBitrate: "64k",
    crf: 28,
    preset: "faster",
  },
  medium: {
    videoBitrate: "1500k",
    audioBitrate: "128k",
    crf: 23,
    preset: "medium",
  },
  high: {
    videoBitrate: "3000k",
    audioBitrate: "192k",
    crf: 20,
    preset: "slow",
  },
  ultra: {
    videoBitrate: "8000k",
    audioBitrate: "320k",
    crf: 18,
    preset: "slower",
  },
};

/**
 * Common resolution presets
 */
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { width: 640, height: 360, label: "360p" },
  { width: 854, height: 480, label: "480p" },
  { width: 1280, height: 720, label: "720p (HD)" },
  { width: 1920, height: 1080, label: "1080p (Full HD)" },
  { width: 2560, height: 1440, label: "1440p (2K)" },
  { width: 3840, height: 2160, label: "2160p (4K)" },
];
