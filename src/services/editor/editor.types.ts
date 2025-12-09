/**
 * Video Editor Service Types
 *
 * DTOs (Data Transfer Objects) and interfaces for video editing operations
 */

/**
 * Project status types
 */
export type ProjectStatus = "draft" | "processing" | "completed" | "failed";

/**
 * Transform configuration for video clips
 */
export interface Transform {
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  crop: { top: number; right: number; bottom: number; left: number };
  flipH: boolean;
  flipV: boolean;
  lockAspectRatio: boolean;
}

/**
 * Video clip type
 */
export interface VideoClip {
  id: string;
  sourceUrl: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  position: number; // position in timeline (seconds)
  layer: number; // z-index for overlapping clips
  volume: number; // 0-1
  muted: boolean;
  effects: Effect[];
  transform?: Transform; // Transform configuration
  metadata?: { width?: number; height?: number }; // Video dimensions
}

/**
 * Audio track type
 */
export interface AudioTrack {
  id: string;
  sourceUrl: string;
  startTime: number;
  endTime: number;
  duration: number;
  position: number; // position in timeline
  volume: number; // 0-1
  muted: boolean;
  fadeIn?: number; // fade in duration in seconds
  fadeOut?: number; // fade out duration in seconds
}

/**
 * Text overlay type
 */
export interface TextOverlay {
  id: string;
  text: string;
  startTime: number; // when to show (seconds)
  endTime: number; // when to hide (seconds)
  position: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  style: {
    fontFamily: string;
    fontSize: number;
    color: string;
    backgroundColor?: string;
    opacity: number; // 0-1
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  animation?: {
    fadeIn?: number; // duration in seconds
    fadeOut?: number; // duration in seconds
  };
}

/**
 * Video effect type
 */
export interface Effect {
  id: string;
  type: EffectType;
  parameters: Record<string, any>;
  startTime?: number;
  endTime?: number;
}

/**
 * Available effect types
 */
export type EffectType =
  | "brightness"
  | "contrast"
  | "saturation"
  | "blur"
  | "sharpen"
  | "grayscale"
  | "sepia"
  | "vignette"
  | "hue"
  | "temperature"
  | "shadows"
  | "highlights"
  | "fade"
  | "fadeIn"
  | "fadeOut"
  | "speed"
  | "crop"
  | "rotate"
  | "flip";

/**
 * Available transition types
 */
export type TransitionType =
  | "fade"
  | "crossfade"
  | "dissolve"
  | "wipe"
  | "wipeLeft"
  | "wipeRight"
  | "wipeUp"
  | "wipeDown"
  | "slide"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoom"
  | "zoomIn"
  | "zoomOut"
  | "none";

/**
 * Transition type
 */
export interface Transition {
  id: string;
  type: TransitionType;
  duration: number; // in seconds
  position: number; // position in timeline
  fromClipId?: string; // Source clip ID
  toClipId?: string; // Target clip ID
  params?: Record<string, unknown>; // Additional parameters
}

/**
 * Timeline data structure
 */
export interface TimelineData {
  clips: VideoClip[];
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
  duration: number; // total timeline duration in seconds
}

/**
 * Project settings
 */
export interface ProjectSettings {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number; // fps
  backgroundColor?: string;
  audioSampleRate?: number; // Hz (default 44100)
}

/**
 * Export settings
 */
export interface ExportSettings {
  format: VideoFormat;
  quality: VideoQuality;
  resolution?: {
    width: number;
    height: number;
  };
  frameRate?: number;
  bitrate?: string; // e.g., "2000k"
  audioBitrate?: string; // e.g., "128k"
  codec?: string; // e.g., "libx264"
}

/**
 * Supported video formats
 */
export type VideoFormat = "mp4" | "webm" | "mov" | "avi";

/**
 * Video quality presets
 */
export type VideoQuality = "low" | "medium" | "high" | "ultra";

/**
 * Video project
 */
export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  thumbnail?: string;
  timeline: TimelineData;
  settings: ProjectSettings;
  status: ProjectStatus;
  progress?: number; // 0-100 for processing/rendering
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input DTO for creating a new project
 */
export interface CreateProjectDto {
  name: string;
  description?: string;
  sourceVideoUrl?: string; // optional initial video
  settings?: Partial<ProjectSettings>;
}

/**
 * Response DTO after creating a project
 */
export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  status: ProjectStatus;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input DTO for updating a project
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  timeline?: TimelineData;
  settings?: ProjectSettings;
}

/**
 * Input DTO for adding a video clip
 */
export interface AddClipDto {
  sourceUrl: string;
  startTime?: number;
  endTime?: number;
  position?: number;
}

/**
 * Input DTO for adding text overlay
 */
export interface AddTextDto {
  text: string;
  startTime: number;
  endTime: number;
  position?: { x: number; y: number };
  style?: Partial<TextOverlay["style"]>;
}

/**
 * Input DTO for exporting a project
 */
export interface ExportProjectDto {
  projectId: string;
  settings: ExportSettings;
}

/**
 * Response DTO for export job
 */
export interface ExportJobDto {
  jobId: string;
  projectId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  outputUrl?: string;
  error?: string;
  createdAt: Date;
}

/**
 * Video metadata
 */
export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  codec: string;
  format: string;
  size: number; // bytes
  hasAudio: boolean;
  audioCodec?: string;
  audioSampleRate?: number;
}

/**
 * Options for EditorService configuration
 */
export interface EditorServiceOptions {
  enableCaching?: boolean;
  maxFileSize?: number; // in bytes
  tempDirectory?: string;
  outputDirectory?: string;
}
