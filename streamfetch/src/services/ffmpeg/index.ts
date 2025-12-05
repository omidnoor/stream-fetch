/**
 * FFmpeg Service Module
 *
 * Barrel export for FFmpeg service
 */

export { FFmpegService } from "./ffmpeg.service.js";
export type {
  ProcessingOptions,
  TrimOptions,
  ConcatenateOptions,
  ThumbnailOptions,
  AddAudioOptions,
  FilterOptions,
  RenderOptions,
  ProgressInfo,
  VideoInfo,
  FFmpegResult,
  QualityPreset,
  ResolutionPreset,
} from "./ffmpeg.types.js";
export { QUALITY_PRESETS, RESOLUTION_PRESETS } from "./ffmpeg.types.js";
