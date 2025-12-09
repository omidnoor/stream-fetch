/**
 * Timeline Utility Functions
 *
 * Helper functions for timeline calculations, snapping, and clip operations.
 */

import type {
  TimelineClip,
  TimelineTrack,
  SnapConfig,
  TextOverlay,
  TextStyle,
  TextPosition,
  TextAnimation,
  TextPreset,
  TextPresetType,
  EffectType,
  EffectConfig,
  ClipEffect,
  EffectPreset,
  Transition,
  TransitionType,
  TransitionConfig,
  CreateTransitionDto,
  AudioClip,
  AudioConfig,
  WaveformData,
  AudioMixerTrack,
} from "./types";

/**
 * Default base pixels per second (at zoom level 1)
 */
export const DEFAULT_PIXELS_PER_SECOND = 50;

/**
 * Convert time (seconds) to pixels based on zoom level
 */
export function timeToPixels(
  time: number,
  zoom: number,
  basePixelsPerSecond: number = DEFAULT_PIXELS_PER_SECOND
): number {
  return time * basePixelsPerSecond * zoom;
}

/**
 * Convert pixels to time (seconds) based on zoom level
 */
export function pixelsToTime(
  pixels: number,
  zoom: number,
  basePixelsPerSecond: number = DEFAULT_PIXELS_PER_SECOND
): number {
  return pixels / (basePixelsPerSecond * zoom);
}

/**
 * Get the current pixels per second based on zoom
 */
export function getPixelsPerSecond(
  zoom: number,
  basePixelsPerSecond: number = DEFAULT_PIXELS_PER_SECOND
): number {
  return basePixelsPerSecond * zoom;
}

/**
 * Snap a time value to the nearest grid position
 */
export function snapToGrid(time: number, gridSize: number): number {
  if (gridSize <= 0) return time;
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Snap a time value based on snap configuration and nearby targets
 */
export function snapTime(
  time: number,
  config: SnapConfig,
  targets: {
    playheadTime?: number;
    clipEdges?: number[];
  }
): { snappedTime: number; snappedTo: string | null } {
  if (!config.enabled) {
    return { snappedTime: time, snappedTo: null };
  }

  const pixelThreshold = config.threshold;
  let snappedTime = time;
  let snappedTo: string | null = null;
  let minDistance = Infinity;

  // Helper to check and update snap target
  const checkSnap = (targetTime: number, label: string) => {
    const distance = Math.abs(time - targetTime);
    // Convert pixel threshold to time threshold (approximate at zoom 1)
    const timeThreshold = pixelThreshold / DEFAULT_PIXELS_PER_SECOND;
    if (distance < timeThreshold && distance < minDistance) {
      minDistance = distance;
      snappedTime = targetTime;
      snappedTo = label;
    }
  };

  // Snap to playhead
  if (config.toPlayhead && targets.playheadTime !== undefined) {
    checkSnap(targets.playheadTime, "playhead");
  }

  // Snap to clip edges
  if (config.toClips && targets.clipEdges) {
    targets.clipEdges.forEach((edge, i) => {
      checkSnap(edge, `clip-edge-${i}`);
    });
  }

  // Snap to grid
  if (config.toGrid && config.gridSize > 0) {
    const gridSnapped = snapToGrid(time, config.gridSize);
    checkSnap(gridSnapped, "grid");
  }

  return { snappedTime, snappedTo };
}

/**
 * Get all clip edges (start and end times) from tracks
 */
export function getClipEdges(
  tracks: TimelineTrack[],
  excludeClipId?: string
): number[] {
  const edges: number[] = [];

  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      if (clip.id !== excludeClipId) {
        edges.push(clip.startTime);
        edges.push(clip.startTime + clip.duration);
      }
    });
  });

  // Remove duplicates and sort
  return [...new Set(edges)].sort((a, b) => a - b);
}

/**
 * Find a clip at a specific time on a track
 */
export function getClipAtTime(
  clips: TimelineClip[],
  time: number
): TimelineClip | null {
  return (
    clips.find(
      (clip) => time >= clip.startTime && time < clip.startTime + clip.duration
    ) ?? null
  );
}

/**
 * Find all clips that overlap with a given time range
 */
export function getClipsInRange(
  clips: TimelineClip[],
  startTime: number,
  endTime: number
): TimelineClip[] {
  return clips.filter((clip) => {
    const clipEnd = clip.startTime + clip.duration;
    return clip.startTime < endTime && clipEnd > startTime;
  });
}

/**
 * Detect if a clip would overlap with other clips on the same track
 */
export function detectOverlap(
  clip: { startTime: number; duration: number; id?: string },
  otherClips: TimelineClip[]
): TimelineClip | null {
  const clipEnd = clip.startTime + clip.duration;

  for (const other of otherClips) {
    // Skip self-comparison
    if (clip.id && clip.id === other.id) continue;

    const otherEnd = other.startTime + other.duration;

    // Check for overlap
    if (clip.startTime < otherEnd && clipEnd > other.startTime) {
      return other;
    }
  }

  return null;
}

/**
 * Find the nearest gap that can fit a clip of given duration
 */
export function findNearestGap(
  clips: TimelineClip[],
  targetTime: number,
  clipDuration: number,
  timelineDuration: number
): { startTime: number; endTime: number } | null {
  // Sort clips by start time
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  // Collect all gaps
  const gaps: { startTime: number; endTime: number; distance: number }[] = [];

  // Gap at the beginning
  if (sortedClips.length === 0 || sortedClips[0].startTime > 0) {
    const gapEnd = sortedClips.length > 0 ? sortedClips[0].startTime : timelineDuration;
    if (gapEnd >= clipDuration) {
      gaps.push({
        startTime: 0,
        endTime: gapEnd,
        distance: Math.abs(targetTime - 0),
      });
    }
  }

  // Gaps between clips
  for (let i = 0; i < sortedClips.length - 1; i++) {
    const currentEnd = sortedClips[i].startTime + sortedClips[i].duration;
    const nextStart = sortedClips[i + 1].startTime;
    const gapSize = nextStart - currentEnd;

    if (gapSize >= clipDuration) {
      gaps.push({
        startTime: currentEnd,
        endTime: nextStart,
        distance: Math.min(
          Math.abs(targetTime - currentEnd),
          Math.abs(targetTime - nextStart)
        ),
      });
    }
  }

  // Gap at the end
  if (sortedClips.length > 0) {
    const lastClip = sortedClips[sortedClips.length - 1];
    const lastEnd = lastClip.startTime + lastClip.duration;
    if (lastEnd < timelineDuration) {
      gaps.push({
        startTime: lastEnd,
        endTime: timelineDuration,
        distance: Math.abs(targetTime - lastEnd),
      });
    }
  }

  // Find nearest gap
  if (gaps.length === 0) return null;

  gaps.sort((a, b) => a.distance - b.distance);
  return { startTime: gaps[0].startTime, endTime: gaps[0].endTime };
}

/**
 * Calculate the total duration based on all clips across tracks
 */
export function calculateTimelineDuration(tracks: TimelineTrack[]): number {
  let maxEnd = 0;

  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEnd = clip.startTime + clip.duration;
      if (clipEnd > maxEnd) {
        maxEnd = clipEnd;
      }
    });
  });

  return maxEnd;
}

/**
 * Split a clip at a given time, returning two new clips
 */
export function splitClip(
  clip: TimelineClip,
  splitTime: number
): [TimelineClip, TimelineClip] | null {
  // Validate split time is within clip bounds
  if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
    return null;
  }

  const splitOffset = splitTime - clip.startTime;
  const sourceOffset = clip.sourceEnd - clip.sourceStart;
  const splitRatio = splitOffset / clip.duration;
  const sourceSplitPoint = clip.sourceStart + sourceOffset * splitRatio;

  const firstClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-1`,
    duration: splitOffset,
    sourceEnd: sourceSplitPoint,
  };

  const secondClip: TimelineClip = {
    ...clip,
    id: `${clip.id}-2`,
    startTime: splitTime,
    duration: clip.duration - splitOffset,
    sourceStart: sourceSplitPoint,
  };

  return [firstClip, secondClip];
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number, includeHours: boolean = false): string {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return includeHours ? "00:00:00" : "00:00";
  }

  const absSeconds = Math.abs(seconds);
  const sign = seconds < 0 ? "-" : "";

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = Math.floor(absSeconds % 60);

  if (includeHours || hours > 0) {
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${sign}${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Format time with milliseconds for precise display
 */
export function formatTimePrecise(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return "00:00.000";
  }

  const absSeconds = Math.abs(seconds);
  const sign = seconds < 0 ? "-" : "";

  const minutes = Math.floor(absSeconds / 60);
  const secs = Math.floor(absSeconds % 60);
  const ms = Math.round((absSeconds % 1) * 1000);

  return `${sign}${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a unique clip ID
 */
export function generateClipId(): string {
  return `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique track ID
 */
export function generateTrackId(): string {
  return `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a default empty timeline state
 */
export function createDefaultTimelineState() {
  return {
    tracks: [] as TimelineTrack[],
    playhead: {
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1,
    },
    view: {
      zoom: 1,
      scrollLeft: 0,
      basePixelsPerSecond: DEFAULT_PIXELS_PER_SECOND,
    },
    selection: {
      clipIds: [] as string[],
      trackIds: [] as string[],
    },
    snap: {
      enabled: true,
      toPlayhead: true,
      toClips: true,
      toGrid: true,
      gridSize: 1, // 1 second grid
      threshold: 10, // 10 pixels
    },
    drag: {
      isDragging: false,
      clipId: null,
      targetTrackId: null,
      originalStartTime: 0,
      deltaTime: 0,
      dragType: null,
    },
    duration: 0,
  };
}

/**
 * Create a new video track with default settings
 */
export function createVideoTrack(name: string = "Video"): TimelineTrack {
  return {
    id: generateTrackId(),
    type: "video",
    name,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 80,
  };
}

/**
 * Create a new audio track with default settings
 */
export function createAudioTrack(name: string = "Audio"): TimelineTrack {
  return {
    id: generateTrackId(),
    type: "audio",
    name,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 60,
  };
}

/**
 * Create a new text track with default settings
 */
export function createTextTrack(name: string = "Text"): TimelineTrack {
  return {
    id: generateTrackId(),
    type: "text",
    name,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 40,
  };
}

// ============================================================================
// Text Overlay Utilities
// ============================================================================

/**
 * Generate a unique text overlay ID
 */
export function generateTextId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default text style
 */
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Inter, sans-serif",
  fontSize: 48,
  fontWeight: "bold",
  color: "#FFFFFF",
  backgroundColor: undefined,
  opacity: 1,
  align: "center",
  verticalAlign: "middle",
  bold: true,
  italic: false,
  underline: false,
  letterSpacing: 0,
  lineHeight: 1.2,
  shadow: {
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: "rgba(0, 0, 0, 0.5)",
  },
};

/**
 * Default text position (centered)
 */
export const DEFAULT_TEXT_POSITION: TextPosition = {
  x: 50,
  y: 50,
  rotation: 0,
};

/**
 * Default fade animation
 */
export const DEFAULT_FADE_ANIMATION: TextAnimation = {
  type: "fade",
  duration: 0.5,
  easing: "ease-out",
};

/**
 * Text presets for quick text creation
 */
export const TEXT_PRESETS: Record<TextPresetType, TextPreset> = {
  title: {
    type: "title",
    name: "Title",
    description: "Large centered text for titles",
    position: { x: 50, y: 50 },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 72,
      fontWeight: "bold",
      align: "center",
      verticalAlign: "middle",
    },
    animationIn: { type: "fade", duration: 0.5, easing: "ease-out" },
    animationOut: { type: "fade", duration: 0.5, easing: "ease-in" },
    defaultDuration: 4,
  },
  subtitle: {
    type: "subtitle",
    name: "Subtitle",
    description: "Medium text below title",
    position: { x: 50, y: 60 },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 36,
      fontWeight: "normal",
      align: "center",
      verticalAlign: "middle",
      bold: false,
    },
    animationIn: { type: "fade", duration: 0.3, easing: "ease-out" },
    animationOut: { type: "fade", duration: 0.3, easing: "ease-in" },
    defaultDuration: 3,
  },
  "lower-third": {
    type: "lower-third",
    name: "Lower Third",
    description: "Name/title bar at bottom left",
    position: { x: 10, y: 80 },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 32,
      fontWeight: "bold",
      align: "left",
      verticalAlign: "bottom",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      padding: { top: 12, right: 24, bottom: 12, left: 24 },
      borderRadius: 4,
    },
    animationIn: { type: "slide", duration: 0.4, slideDirection: "left", easing: "ease-out" },
    animationOut: { type: "slide", duration: 0.4, slideDirection: "left", easing: "ease-in" },
    defaultDuration: 5,
  },
  caption: {
    type: "caption",
    name: "Caption",
    description: "Subtitle/caption at bottom center",
    position: { x: 50, y: 90 },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 28,
      fontWeight: "normal",
      align: "center",
      verticalAlign: "bottom",
      bold: false,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      borderRadius: 4,
    },
    animationIn: { type: "fade", duration: 0.2, easing: "ease-out" },
    animationOut: { type: "fade", duration: 0.2, easing: "ease-in" },
    defaultDuration: 3,
  },
  watermark: {
    type: "watermark",
    name: "Watermark",
    description: "Small text in corner",
    position: { x: 95, y: 5 },
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 18,
      fontWeight: "normal",
      align: "right",
      verticalAlign: "top",
      bold: false,
      opacity: 0.6,
      shadow: undefined,
    },
    defaultDuration: -1, // -1 means full video duration
  },
  custom: {
    type: "custom",
    name: "Custom",
    description: "Custom text with default styling",
    position: DEFAULT_TEXT_POSITION,
    style: DEFAULT_TEXT_STYLE,
    defaultDuration: 3,
  },
};

/**
 * Create a text overlay from a preset
 */
export function createTextOverlay(
  content: string,
  trackId: string,
  startTime: number,
  preset: TextPresetType = "custom",
  overrides?: {
    position?: Partial<TextPosition>;
    style?: Partial<TextStyle>;
    duration?: number;
  }
): TextOverlay {
  const presetConfig = TEXT_PRESETS[preset];

  return {
    id: generateTextId(),
    trackId,
    content,
    startTime,
    duration: overrides?.duration ?? presetConfig.defaultDuration,
    position: {
      ...presetConfig.position,
      ...overrides?.position,
    },
    style: {
      ...presetConfig.style,
      ...overrides?.style,
    },
    animationIn: presetConfig.animationIn,
    animationOut: presetConfig.animationOut,
    preset,
    visible: true,
    locked: false,
  };
}

/**
 * Check if a text overlay is visible at a given time
 */
export function isTextVisibleAtTime(overlay: TextOverlay, time: number): boolean {
  if (!overlay.visible) return false;
  return time >= overlay.startTime && time < overlay.startTime + overlay.duration;
}

/**
 * Get all text overlays visible at a given time
 */
export function getVisibleTexts(overlays: TextOverlay[], time: number): TextOverlay[] {
  return overlays.filter((overlay) => isTextVisibleAtTime(overlay, time));
}

/**
 * Calculate animation progress (0-1) for a text overlay
 */
export function calculateAnimationProgress(
  overlay: TextOverlay,
  currentTime: number
): { inProgress: number; outProgress: number } {
  const overlayEnd = overlay.startTime + overlay.duration;
  let inProgress = 1;
  let outProgress = 0;

  // Calculate entry animation progress
  if (overlay.animationIn && overlay.animationIn.type !== "none") {
    const inDuration = overlay.animationIn.duration;
    const inDelay = overlay.animationIn.delay ?? 0;
    const inStart = overlay.startTime + inDelay;
    const inEnd = inStart + inDuration;

    if (currentTime < inStart) {
      inProgress = 0;
    } else if (currentTime < inEnd) {
      inProgress = (currentTime - inStart) / inDuration;
    }
  }

  // Calculate exit animation progress
  if (overlay.animationOut && overlay.animationOut.type !== "none") {
    const outDuration = overlay.animationOut.duration;
    const outStart = overlayEnd - outDuration;

    if (currentTime >= outStart && currentTime < overlayEnd) {
      outProgress = (currentTime - outStart) / outDuration;
    } else if (currentTime >= overlayEnd) {
      outProgress = 1;
    }
  }

  return { inProgress, outProgress };
}

/**
 * Apply easing function to progress value
 */
export function applyEasing(
  progress: number,
  easing: TextAnimation["easing"] = "ease-out"
): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    default:
      return progress;
  }
}

/**
 * Convert text position percentage to pixel coordinates
 */
export function textPositionToPixels(
  position: TextPosition,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width?: number; height?: number } {
  return {
    x: (position.x / 100) * canvasWidth,
    y: (position.y / 100) * canvasHeight,
    width: position.width ? (position.width / 100) * canvasWidth : undefined,
    height: position.height ? (position.height / 100) * canvasHeight : undefined,
  };
}

/**
 * Convert pixel coordinates to text position percentage
 */
export function pixelsToTextPosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): TextPosition {
  return {
    x: clamp((x / canvasWidth) * 100, 0, 100),
    y: clamp((y / canvasHeight) * 100, 0, 100),
  };
}

/**
 * Generate FFmpeg drawtext filter string for a text overlay
 */
export function generateFFmpegTextFilter(
  overlay: TextOverlay,
  videoWidth: number,
  videoHeight: number
): string {
  const { position, style, content, startTime, duration } = overlay;

  // Calculate pixel position
  const x = Math.round((position.x / 100) * videoWidth);
  const y = Math.round((position.y / 100) * videoHeight);

  // Escape special characters in text
  const escapedText = content
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, "\\:")
    .replace(/\\/g, "\\\\");

  // Build filter components
  const parts: string[] = [
    `text='${escapedText}'`,
    `fontsize=${style.fontSize}`,
    `fontcolor=${style.color}`,
    `x=${x}`,
    `y=${y}`,
  ];

  // Add font family if not default
  if (style.fontFamily && style.fontFamily !== "sans-serif") {
    parts.push(`font='${style.fontFamily.split(",")[0].trim()}'`);
  }

  // Add background box if specified
  if (style.backgroundColor) {
    parts.push(`box=1`);
    parts.push(`boxcolor=${style.backgroundColor}`);
    if (style.padding) {
      parts.push(`boxborderw=${style.padding.top}`);
    }
  }

  // Add shadow if specified
  if (style.shadow) {
    parts.push(`shadowcolor=${style.shadow.color}`);
    parts.push(`shadowx=${style.shadow.offsetX}`);
    parts.push(`shadowy=${style.shadow.offsetY}`);
  }

  // Add time enable filter
  const endTime = startTime + duration;
  parts.push(`enable='between(t,${startTime},${endTime})'`);

  return `drawtext=${parts.join(":")}`;
}

/**
 * Validate text overlay data
 */
export function validateTextOverlay(overlay: Partial<TextOverlay>): string[] {
  const errors: string[] = [];

  if (!overlay.content || overlay.content.trim().length === 0) {
    errors.push("Text content cannot be empty");
  }

  if (overlay.startTime !== undefined && overlay.startTime < 0) {
    errors.push("Start time cannot be negative");
  }

  if (overlay.duration !== undefined && overlay.duration <= 0) {
    errors.push("Duration must be positive");
  }

  if (overlay.position) {
    if (overlay.position.x < 0 || overlay.position.x > 100) {
      errors.push("X position must be between 0 and 100");
    }
    if (overlay.position.y < 0 || overlay.position.y > 100) {
      errors.push("Y position must be between 0 and 100");
    }
  }

  if (overlay.style) {
    if (overlay.style.fontSize < 1) {
      errors.push("Font size must be at least 1");
    }
    if (overlay.style.opacity < 0 || overlay.style.opacity > 1) {
      errors.push("Opacity must be between 0 and 1");
    }
  }

  return errors;
}

/**
 * Available font families for text overlays
 */
export const AVAILABLE_FONTS = [
  "Inter, sans-serif",
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
  "Roboto, sans-serif",
  "Open Sans, sans-serif",
  "Lato, sans-serif",
  "Montserrat, sans-serif",
  "Oswald, sans-serif",
  "Playfair Display, serif",
  "Bebas Neue, sans-serif",
  "Impact, sans-serif",
];

/**
 * Color presets for quick selection
 */
export const COLOR_PRESETS = [
  "#FFFFFF", // White
  "#000000", // Black
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#008000", // Dark Green
  "#000080", // Navy
  "#808080", // Gray
  "#C0C0C0", // Silver
];

// ============================================================================
// Effects & Filters Utilities
// ============================================================================

/**
 * Generate a unique effect ID
 */
export function generateEffectId(): string {
  return `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Effect configurations with parameters and FFmpeg mappings
 */
export const EFFECT_CONFIGS: Record<EffectType, EffectConfig> = {
  brightness: {
    type: "brightness",
    name: "Brightness",
    description: "Adjust image brightness",
    params: [
      { key: "value", label: "Brightness", min: -100, max: 100, step: 1, default: 0, unit: "%" },
    ],
    cssFilter: "brightness",
    ffmpegFilter: "eq=brightness={value}",
  },
  contrast: {
    type: "contrast",
    name: "Contrast",
    description: "Adjust image contrast",
    params: [
      { key: "value", label: "Contrast", min: -100, max: 100, step: 1, default: 0, unit: "%" },
    ],
    cssFilter: "contrast",
    ffmpegFilter: "eq=contrast={value}",
  },
  saturation: {
    type: "saturation",
    name: "Saturation",
    description: "Adjust color saturation",
    params: [
      { key: "value", label: "Saturation", min: -100, max: 100, step: 1, default: 0, unit: "%" },
    ],
    cssFilter: "saturate",
    ffmpegFilter: "eq=saturation={value}",
  },
  blur: {
    type: "blur",
    name: "Blur",
    description: "Apply gaussian blur",
    params: [
      { key: "radius", label: "Radius", min: 0, max: 20, step: 0.5, default: 0, unit: "px" },
    ],
    cssFilter: "blur",
    ffmpegFilter: "boxblur={radius}:1",
  },
  sharpen: {
    type: "sharpen",
    name: "Sharpen",
    description: "Sharpen image details",
    params: [
      { key: "amount", label: "Amount", min: 0, max: 100, step: 1, default: 0, unit: "%" },
    ],
    ffmpegFilter: "unsharp=5:5:{amount}:5:5:0",
  },
  grayscale: {
    type: "grayscale",
    name: "Grayscale",
    description: "Convert to black and white",
    params: [
      { key: "amount", label: "Amount", min: 0, max: 100, step: 1, default: 100, unit: "%" },
    ],
    cssFilter: "grayscale",
    ffmpegFilter: "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3",
  },
  sepia: {
    type: "sepia",
    name: "Sepia",
    description: "Apply sepia tone",
    params: [
      { key: "amount", label: "Amount", min: 0, max: 100, step: 1, default: 100, unit: "%" },
    ],
    cssFilter: "sepia",
    ffmpegFilter: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
  },
  vignette: {
    type: "vignette",
    name: "Vignette",
    description: "Darken edges",
    params: [
      { key: "intensity", label: "Intensity", min: 0, max: 100, step: 1, default: 50, unit: "%" },
      { key: "radius", label: "Radius", min: 0, max: 100, step: 1, default: 50, unit: "%" },
    ],
    ffmpegFilter: "vignette=angle={intensity}*PI/180",
  },
  hue: {
    type: "hue",
    name: "Hue Rotate",
    description: "Rotate color hue",
    params: [
      { key: "angle", label: "Angle", min: -180, max: 180, step: 1, default: 0, unit: "°" },
    ],
    cssFilter: "hue-rotate",
    ffmpegFilter: "hue=h={angle}",
  },
  temperature: {
    type: "temperature",
    name: "Temperature",
    description: "Adjust color temperature (warm/cool)",
    params: [
      { key: "value", label: "Temperature", min: -100, max: 100, step: 1, default: 0, unit: "" },
    ],
    ffmpegFilter: "colortemperature=temperature={value}",
  },
  shadows: {
    type: "shadows",
    name: "Shadows",
    description: "Adjust shadow levels",
    params: [
      { key: "value", label: "Shadows", min: -100, max: 100, step: 1, default: 0, unit: "%" },
    ],
    ffmpegFilter: "curves=m='0/0 0.25/{value} 1/1'",
  },
  highlights: {
    type: "highlights",
    name: "Highlights",
    description: "Adjust highlight levels",
    params: [
      { key: "value", label: "Highlights", min: -100, max: 100, step: 1, default: 0, unit: "%" },
    ],
    ffmpegFilter: "curves=m='0/0 0.75/{value} 1/1'",
  },
  fade: {
    type: "fade",
    name: "Fade",
    description: "Reduce overall intensity",
    params: [
      { key: "amount", label: "Amount", min: 0, max: 100, step: 1, default: 0, unit: "%" },
    ],
    cssFilter: "opacity",
    ffmpegFilter: "colorlevels=rimin={amount}:gimin={amount}:bimin={amount}",
  },
};

/**
 * Effect presets for quick application
 */
export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Film-like look with enhanced contrast and subtle color grading",
    effects: [
      { type: "contrast", params: { value: 15 } },
      { type: "saturation", params: { value: -10 } },
      { type: "vignette", params: { intensity: 30, radius: 60 } },
      { type: "shadows", params: { value: -10 } },
    ],
    preview: "linear-gradient(135deg, #1a1a2e, #16213e)",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Retro look with sepia tones and faded colors",
    effects: [
      { type: "sepia", params: { amount: 40 } },
      { type: "contrast", params: { value: -10 } },
      { type: "saturation", params: { value: -30 } },
      { type: "vignette", params: { intensity: 40, radius: 50 } },
      { type: "fade", params: { amount: 15 } },
    ],
    preview: "linear-gradient(135deg, #d4a574, #8b7355)",
  },
  {
    id: "blackwhite",
    name: "Black & White",
    description: "Classic monochrome with enhanced contrast",
    effects: [
      { type: "grayscale", params: { amount: 100 } },
      { type: "contrast", params: { value: 20 } },
    ],
    preview: "linear-gradient(135deg, #2d2d2d, #808080)",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Boosted colors and brightness",
    effects: [
      { type: "saturation", params: { value: 40 } },
      { type: "brightness", params: { value: 10 } },
      { type: "contrast", params: { value: 10 } },
    ],
    preview: "linear-gradient(135deg, #ff6b6b, #4ecdc4)",
  },
  {
    id: "moody",
    name: "Moody",
    description: "Dark and atmospheric",
    effects: [
      { type: "brightness", params: { value: -15 } },
      { type: "contrast", params: { value: 20 } },
      { type: "saturation", params: { value: -20 } },
      { type: "shadows", params: { value: -20 } },
      { type: "vignette", params: { intensity: 50, radius: 40 } },
    ],
    preview: "linear-gradient(135deg, #0f0f23, #1a1a3e)",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Cozy warm tones",
    effects: [
      { type: "temperature", params: { value: 30 } },
      { type: "saturation", params: { value: 10 } },
    ],
    preview: "linear-gradient(135deg, #ff9a56, #ff6b6b)",
  },
  {
    id: "cool",
    name: "Cool",
    description: "Cool blue tones",
    effects: [
      { type: "temperature", params: { value: -30 } },
      { type: "saturation", params: { value: 10 } },
    ],
    preview: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    id: "dreamy",
    name: "Dreamy",
    description: "Soft and ethereal look",
    effects: [
      { type: "brightness", params: { value: 15 } },
      { type: "contrast", params: { value: -15 } },
      { type: "saturation", params: { value: -20 } },
      { type: "blur", params: { radius: 0.5 } },
    ],
    preview: "linear-gradient(135deg, #ffecd2, #fcb69f)",
  },
];

/**
 * Convert effect value from internal range to CSS filter range
 */
export function effectValueToCss(type: EffectType, params: Record<string, number>): number {
  switch (type) {
    case "brightness":
      // -100 to 100 -> 0 to 2 (1 is default)
      return 1 + (params.value ?? 0) / 100;
    case "contrast":
      // -100 to 100 -> 0 to 2 (1 is default)
      return 1 + (params.value ?? 0) / 100;
    case "saturation":
      // -100 to 100 -> 0 to 2 (1 is default)
      return 1 + (params.value ?? 0) / 100;
    case "blur":
      // 0 to 20 -> 0px to 20px
      return params.radius ?? 0;
    case "grayscale":
    case "sepia":
      // 0 to 100 -> 0% to 100%
      return (params.amount ?? 100) / 100;
    case "hue":
      // -180 to 180 -> -180deg to 180deg
      return params.angle ?? 0;
    case "fade":
      // 0 to 100 -> 1 to 0 opacity
      return 1 - (params.amount ?? 0) / 100;
    default:
      return 1;
  }
}

/**
 * Generate CSS filter string from effects array
 */
export function generateCssFilter(effects: ClipEffect[]): string {
  const filters: string[] = [];

  // Sort by order and filter enabled effects
  const sortedEffects = [...effects]
    .filter((e) => e.enabled)
    .sort((a, b) => a.order - b.order);

  for (const effect of sortedEffects) {
    const config = EFFECT_CONFIGS[effect.type];
    if (!config.cssFilter) continue;

    const value = effectValueToCss(effect.type, effect.params);

    switch (effect.type) {
      case "brightness":
      case "contrast":
        filters.push(`${config.cssFilter}(${value})`);
        break;
      case "blur":
        if (value > 0) {
          filters.push(`blur(${value}px)`);
        }
        break;
      case "grayscale":
      case "sepia":
        filters.push(`${config.cssFilter}(${value * 100}%)`);
        break;
      case "hue":
        filters.push(`hue-rotate(${value}deg)`);
        break;
      case "fade":
        filters.push(`opacity(${value})`);
        break;
    }
  }

  // Handle saturation (uses "saturate" in CSS, not "saturation")
  const satEffect = sortedEffects.find((e) => e.type === "saturation");
  if (satEffect) {
    const value = effectValueToCss("saturation", satEffect.params);
    filters.push(`saturate(${value})`);
  }

  return filters.join(" ");
}

/**
 * Convert effect value from internal range to FFmpeg range
 */
export function effectValueToFFmpeg(type: EffectType, params: Record<string, number>): Record<string, number> {
  switch (type) {
    case "brightness":
      // -100 to 100 -> -1 to 1 for FFmpeg eq filter
      return { value: (params.value ?? 0) / 100 };
    case "contrast":
      // -100 to 100 -> 0 to 2 for FFmpeg
      return { value: 1 + (params.value ?? 0) / 100 };
    case "saturation":
      // -100 to 100 -> 0 to 3 for FFmpeg
      return { value: 1 + (params.value ?? 0) / 50 };
    case "blur":
      // 0 to 20 -> blur radius
      return { radius: Math.max(1, Math.round(params.radius ?? 0)) };
    case "sharpen":
      // 0 to 100 -> 0 to 1.5 for unsharp
      return { amount: (params.amount ?? 0) / 66.67 };
    case "vignette":
      // Convert intensity to angle
      return {
        intensity: ((params.intensity ?? 50) / 100) * 0.5,
      };
    case "hue":
      return { angle: params.angle ?? 0 };
    default:
      return params;
  }
}

/**
 * Generate FFmpeg filter string from effects array
 */
export function generateFFmpegFilterChain(effects: ClipEffect[]): string {
  const filters: string[] = [];

  // Sort by order and filter enabled effects
  const sortedEffects = [...effects]
    .filter((e) => e.enabled)
    .sort((a, b) => a.order - b.order);

  // Combine eq filters (brightness, contrast, saturation)
  const eqParams: string[] = [];
  for (const effect of sortedEffects) {
    const ffmpegParams = effectValueToFFmpeg(effect.type, effect.params);

    switch (effect.type) {
      case "brightness":
        eqParams.push(`brightness=${ffmpegParams.value}`);
        break;
      case "contrast":
        eqParams.push(`contrast=${ffmpegParams.value}`);
        break;
      case "saturation":
        eqParams.push(`saturation=${ffmpegParams.value}`);
        break;
    }
  }

  // Add combined eq filter if any
  if (eqParams.length > 0) {
    filters.push(`eq=${eqParams.join(":")}`);
  }

  // Add other filters
  for (const effect of sortedEffects) {
    const config = EFFECT_CONFIGS[effect.type];
    const ffmpegParams = effectValueToFFmpeg(effect.type, effect.params);

    switch (effect.type) {
      case "blur":
        if ((effect.params.radius ?? 0) > 0) {
          filters.push(`boxblur=${ffmpegParams.radius}:1`);
        }
        break;
      case "sharpen":
        if ((effect.params.amount ?? 0) > 0) {
          filters.push(`unsharp=5:5:${ffmpegParams.amount}:5:5:0`);
        }
        break;
      case "grayscale":
        if ((effect.params.amount ?? 0) > 0) {
          filters.push("colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3");
        }
        break;
      case "sepia":
        if ((effect.params.amount ?? 0) > 0) {
          filters.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
        }
        break;
      case "vignette":
        filters.push(`vignette=angle=${ffmpegParams.intensity}*PI/180`);
        break;
      case "hue":
        if ((effect.params.angle ?? 0) !== 0) {
          filters.push(`hue=h=${ffmpegParams.angle}`);
        }
        break;
    }
  }

  return filters.join(",");
}

/**
 * Create a new effect with default parameters
 */
export function createEffect(
  clipId: string,
  type: EffectType,
  order: number,
  overrideParams?: Record<string, number>
): ClipEffect {
  const config = EFFECT_CONFIGS[type];

  // Build default params from config
  const defaultParams: Record<string, number> = {};
  for (const param of config.params) {
    defaultParams[param.key] = param.default;
  }

  return {
    id: generateEffectId(),
    clipId,
    type,
    params: { ...defaultParams, ...overrideParams },
    enabled: true,
    order,
  };
}

/**
 * Apply a preset to a clip, returning array of effects
 */
export function applyEffectPreset(
  clipId: string,
  preset: EffectPreset,
  startOrder: number = 0
): ClipEffect[] {
  return preset.effects.map((effectDef, index) =>
    createEffect(clipId, effectDef.type, startOrder + index, effectDef.params)
  );
}

/**
 * Reset effect parameters to defaults
 */
export function resetEffectParams(effect: ClipEffect): ClipEffect {
  const config = EFFECT_CONFIGS[effect.type];
  const defaultParams: Record<string, number> = {};

  for (const param of config.params) {
    defaultParams[param.key] = param.default;
  }

  return {
    ...effect,
    params: defaultParams,
  };
}

/**
 * Check if effect has non-default values
 */
export function isEffectModified(effect: ClipEffect): boolean {
  const config = EFFECT_CONFIGS[effect.type];

  for (const param of config.params) {
    if (effect.params[param.key] !== param.default) {
      return true;
    }
  }

  return false;
}

/**
 * Get list of available effect types
 */
export function getAvailableEffects(): EffectConfig[] {
  return Object.values(EFFECT_CONFIGS);
}

// ============================================================================
// Transition Utilities
// ============================================================================

/**
 * Transition configurations with metadata
 */
export const TRANSITION_CONFIGS: Record<TransitionType, TransitionConfig> = {
  fade: {
    type: "fade",
    name: "Fade",
    description: "Simple fade to black between clips",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 3000,
    ffmpegTransition: "fade",
    cssAnimation: "transition-fade",
  },
  crossfade: {
    type: "crossfade",
    name: "Crossfade",
    description: "Smooth crossfade between two clips",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 3000,
    ffmpegTransition: "fade",
    cssAnimation: "transition-crossfade",
  },
  dissolve: {
    type: "dissolve",
    name: "Dissolve",
    description: "Dissolve transition with gradual blend",
    defaultDuration: 750,
    minDuration: 200,
    maxDuration: 3000,
    ffmpegTransition: "dissolve",
    cssAnimation: "transition-dissolve",
  },
  wipe: {
    type: "wipe",
    name: "Wipe",
    description: "Wipe from left to right",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "wipeleft",
    cssAnimation: "transition-wipe",
    hasDirection: true,
  },
  wipeLeft: {
    type: "wipeLeft",
    name: "Wipe Left",
    description: "Wipe from right to left",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "wipeleft",
    cssAnimation: "transition-wipe-left",
  },
  wipeRight: {
    type: "wipeRight",
    name: "Wipe Right",
    description: "Wipe from left to right",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "wiperight",
    cssAnimation: "transition-wipe-right",
  },
  wipeUp: {
    type: "wipeUp",
    name: "Wipe Up",
    description: "Wipe from bottom to top",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "wipeup",
    cssAnimation: "transition-wipe-up",
  },
  wipeDown: {
    type: "wipeDown",
    name: "Wipe Down",
    description: "Wipe from top to bottom",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "wipedown",
    cssAnimation: "transition-wipe-down",
  },
  slide: {
    type: "slide",
    name: "Slide",
    description: "Slide transition between clips",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "slideleft",
    cssAnimation: "transition-slide",
    hasDirection: true,
  },
  slideLeft: {
    type: "slideLeft",
    name: "Slide Left",
    description: "New clip slides in from right",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "slideleft",
    cssAnimation: "transition-slide-left",
  },
  slideRight: {
    type: "slideRight",
    name: "Slide Right",
    description: "New clip slides in from left",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "slideright",
    cssAnimation: "transition-slide-right",
  },
  slideUp: {
    type: "slideUp",
    name: "Slide Up",
    description: "New clip slides in from bottom",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "slideup",
    cssAnimation: "transition-slide-up",
  },
  slideDown: {
    type: "slideDown",
    name: "Slide Down",
    description: "New clip slides in from top",
    defaultDuration: 500,
    minDuration: 100,
    maxDuration: 2000,
    ffmpegTransition: "slidedown",
    cssAnimation: "transition-slide-down",
  },
  zoom: {
    type: "zoom",
    name: "Zoom",
    description: "Zoom transition between clips",
    defaultDuration: 600,
    minDuration: 200,
    maxDuration: 2000,
    ffmpegTransition: "circleopen",
    cssAnimation: "transition-zoom",
    hasDirection: true,
  },
  zoomIn: {
    type: "zoomIn",
    name: "Zoom In",
    description: "Zoom in to reveal new clip",
    defaultDuration: 600,
    minDuration: 200,
    maxDuration: 2000,
    ffmpegTransition: "circleopen",
    cssAnimation: "transition-zoom-in",
  },
  zoomOut: {
    type: "zoomOut",
    name: "Zoom Out",
    description: "Zoom out to reveal new clip",
    defaultDuration: 600,
    minDuration: 200,
    maxDuration: 2000,
    ffmpegTransition: "circleclose",
    cssAnimation: "transition-zoom-out",
  },
  none: {
    type: "none",
    name: "None",
    description: "No transition",
    defaultDuration: 0,
    minDuration: 0,
    maxDuration: 0,
    ffmpegTransition: "",
    cssAnimation: "",
  },
};

/**
 * Generate unique transition ID
 */
export function generateTransitionId(): string {
  return `transition_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new transition between two clips
 */
export function createTransition(
  projectId: string,
  dto: CreateTransitionDto
): Transition {
  const config = TRANSITION_CONFIGS[dto.type];

  return {
    id: generateTransitionId(),
    projectId,
    fromClipId: dto.fromClipId,
    toClipId: dto.toClipId,
    type: dto.type,
    duration: dto.duration ?? config.defaultDuration,
    params: dto.params,
  };
}

/**
 * Get transition configuration
 */
export function getTransitionConfig(type: TransitionType): TransitionConfig {
  return TRANSITION_CONFIGS[type];
}

/**
 * Get all available transition types
 */
export function getAvailableTransitions(): TransitionConfig[] {
  return Object.values(TRANSITION_CONFIGS);
}

/**
 * Get basic transition types (without directional variants)
 */
export function getBasicTransitions(): TransitionConfig[] {
  return [
    TRANSITION_CONFIGS.fade,
    TRANSITION_CONFIGS.crossfade,
    TRANSITION_CONFIGS.dissolve,
    TRANSITION_CONFIGS.wipe,
    TRANSITION_CONFIGS.slide,
    TRANSITION_CONFIGS.zoom,
  ];
}

/**
 * Generate FFmpeg xfade filter for a transition
 */
export function generateTransitionFFmpegFilter(
  transition: Transition,
  offset: number
): string {
  const config = TRANSITION_CONFIGS[transition.type];
  const durationSeconds = transition.duration / 1000;

  return `xfade=transition=${config.ffmpegTransition}:duration=${durationSeconds}:offset=${offset}`;
}

/**
 * Generate FFmpeg filter complex for multiple transitions
 */
export function generateTransitionsFilterComplex(
  transitions: Transition[],
  clipDurations: number[]
): string {
  if (transitions.length === 0 || clipDurations.length < 2) {
    return "";
  }

  const filters: string[] = [];
  let currentOffset = 0;

  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    const clipDuration = clipDurations[i];
    const transitionDuration = transition.duration / 1000;

    // Calculate offset (end of current clip minus transition duration)
    currentOffset += clipDuration - transitionDuration;

    const filter = generateTransitionFFmpegFilter(transition, currentOffset);

    // Handle filter chain labeling
    if (i === 0) {
      filters.push(`[0:v][1:v]${filter}[v${i}]`);
    } else if (i === transitions.length - 1) {
      filters.push(`[v${i - 1}][${i + 1}:v]${filter}[outv]`);
    } else {
      filters.push(`[v${i - 1}][${i + 1}:v]${filter}[v${i}]`);
    }
  }

  return filters.join(";");
}

/**
 * Calculate transition offset given clip positions
 */
export function calculateTransitionOffset(
  fromClipEnd: number,
  transitionDuration: number
): number {
  // Transition starts before the clip ends
  return fromClipEnd - transitionDuration / 1000;
}

/**
 * Validate transition duration against clip durations
 */
export function validateTransitionDuration(
  duration: number,
  fromClipDuration: number,
  toClipDuration: number
): { valid: boolean; maxDuration: number; message?: string } {
  // Duration in seconds
  const durationSec = duration / 1000;

  // Transition can't be longer than the shorter clip
  const maxDuration = Math.min(fromClipDuration, toClipDuration) * 1000;

  if (duration > maxDuration) {
    return {
      valid: false,
      maxDuration,
      message: `Transition duration cannot exceed ${(maxDuration / 1000).toFixed(1)} seconds`,
    };
  }

  // Minimum duration check
  const config = TRANSITION_CONFIGS.fade; // Use default config for min
  if (duration < config.minDuration) {
    return {
      valid: false,
      maxDuration,
      message: `Transition duration must be at least ${config.minDuration}ms`,
    };
  }

  return { valid: true, maxDuration };
}

/**
 * Get CSS keyframes for transition preview
 */
export function getTransitionCssKeyframes(type: TransitionType): string {
  switch (type) {
    case "fade":
    case "crossfade":
      return `
        @keyframes transition-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
    case "dissolve":
      return `
        @keyframes transition-dissolve {
          0% { opacity: 1; filter: blur(0); }
          50% { opacity: 0.5; filter: blur(2px); }
          100% { opacity: 0; filter: blur(4px); }
        }
      `;
    case "wipeLeft":
    case "wipe":
      return `
        @keyframes transition-wipe-left {
          0% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 100% 0 0); }
        }
      `;
    case "wipeRight":
      return `
        @keyframes transition-wipe-right {
          0% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 100%); }
        }
      `;
    case "wipeUp":
      return `
        @keyframes transition-wipe-up {
          0% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(100% 0 0 0); }
        }
      `;
    case "wipeDown":
      return `
        @keyframes transition-wipe-down {
          0% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 100% 0); }
        }
      `;
    case "slideLeft":
    case "slide":
      return `
        @keyframes transition-slide-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `;
    case "slideRight":
      return `
        @keyframes transition-slide-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `;
    case "slideUp":
      return `
        @keyframes transition-slide-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
      `;
    case "slideDown":
      return `
        @keyframes transition-slide-down {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `;
    case "zoomIn":
    case "zoom":
      return `
        @keyframes transition-zoom-in {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `;
    case "zoomOut":
      return `
        @keyframes transition-zoom-out {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
      `;
    default:
      return "";
  }
}

/**
 * Find transition between two specific clips
 */
export function findTransitionBetweenClips(
  transitions: Transition[],
  fromClipId: string,
  toClipId: string
): Transition | undefined {
  return transitions.find(
    (t) => t.fromClipId === fromClipId && t.toClipId === toClipId
  );
}

/**
 * Get all transitions for a specific clip
 */
export function getClipTransitions(
  transitions: Transition[],
  clipId: string
): { incoming?: Transition; outgoing?: Transition } {
  return {
    incoming: transitions.find((t) => t.toClipId === clipId),
    outgoing: transitions.find((t) => t.fromClipId === clipId),
  };
}

// ============================================================================
// Audio Utilities
// ============================================================================

/**
 * Convert linear volume (0-2) to decibels
 */
export function volumeToDb(volume: number): number {
  if (volume === 0) return -Infinity;
  return 20 * Math.log10(volume);
}

/**
 * Convert decibels to linear volume (0-2)
 */
export function dbToVolume(db: number): number {
  if (db === -Infinity) return 0;
  return Math.pow(10, db / 20);
}

/**
 * Format volume as dB string
 */
export function formatVolumeDb(volume: number): string {
  const db = volumeToDb(volume);
  if (db === -Infinity) return "-∞ dB";
  return `${db > 0 ? "+" : ""}${db.toFixed(1)} dB`;
}

/**
 * Format volume as percentage
 */
export function formatVolumePercent(volume: number): string {
  return `${Math.round(volume * 100)}%`;
}

/**
 * Clamp volume to valid range (0-2)
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(2, volume));
}

/**
 * Clamp pan to valid range (-1 to 1)
 */
export function clampPan(pan: number): number {
  return Math.max(-1, Math.min(1, pan));
}

/**
 * Generate FFmpeg volume filter
 */
export function generateVolumeFilter(volume: number): string {
  if (volume === 1) return ""; // No filter needed for default volume
  return `volume=${volume.toFixed(3)}`;
}

/**
 * Generate FFmpeg fade filter
 */
export function generateAudioFadeFilter(
  fadeIn?: number,
  fadeOut?: number,
  duration?: number
): string {
  const filters: string[] = [];

  if (fadeIn && fadeIn > 0) {
    filters.push(`afade=t=in:d=${fadeIn.toFixed(3)}`);
  }

  if (fadeOut && fadeOut > 0 && duration) {
    const startTime = Math.max(0, duration - fadeOut);
    filters.push(`afade=t=out:st=${startTime.toFixed(3)}:d=${fadeOut.toFixed(3)}`);
  }

  return filters.join(",");
}

/**
 * Generate FFmpeg pan filter
 */
export function generatePanFilter(pan: number): string {
  if (pan === 0) return ""; // No filter for center

  // Pan from -1 (left) to 1 (right)
  // Convert to FFmpeg pan format
  const leftGain = pan <= 0 ? 1 : 1 - pan;
  const rightGain = pan >= 0 ? 1 : 1 + pan;

  return `pan=stereo|c0=${leftGain.toFixed(2)}*c0|c1=${rightGain.toFixed(2)}*c1`;
}

/**
 * Generate complete audio filter chain for a clip
 */
export function generateAudioFilterChain(
  config: AudioConfig,
  clipDuration?: number
): string {
  const filters: string[] = [];

  // Volume
  const volumeFilter = generateVolumeFilter(config.volume);
  if (volumeFilter) {
    filters.push(volumeFilter);
  }

  // Fades
  const fadeFilter = generateAudioFadeFilter(
    config.fadeIn,
    config.fadeOut,
    clipDuration
  );
  if (fadeFilter) {
    filters.push(fadeFilter);
  }

  // Pan
  if (config.pan !== undefined) {
    const panFilter = generatePanFilter(config.pan);
    if (panFilter) {
      filters.push(panFilter);
    }
  }

  return filters.join(",");
}

/**
 * Generate FFmpeg amix filter for multiple audio tracks
 */
export function generateAudioMixFilter(trackCount: number): string {
  if (trackCount <= 1) return "";
  return `amix=inputs=${trackCount}:duration=longest`;
}

/**
 * Create default audio config for a clip
 */
export function createDefaultAudioConfig(clipId: string): AudioConfig {
  return {
    clipId,
    volume: 1.0,
    fadeIn: 0,
    fadeOut: 0,
    muted: false,
    pan: 0,
  };
}

/**
 * Create default mixer track
 */
export function createDefaultMixerTrack(
  trackId: string,
  name: string
): AudioMixerTrack {
  return {
    trackId,
    name,
    volume: 1.0,
    muted: false,
    solo: false,
    pan: 0,
    visible: true,
  };
}

/**
 * Calculate effective volume considering mute and solo states
 */
export function calculateEffectiveVolume(
  track: AudioMixerTrack,
  hasSolo: boolean,
  masterVolume: number,
  masterMute: boolean
): number {
  // If master is muted, everything is muted
  if (masterMute) return 0;

  // If track is muted, volume is 0
  if (track.muted) return 0;

  // If any track is soloed and this track is not solo, volume is 0
  if (hasSolo && !track.solo) return 0;

  // Otherwise, multiply track volume by master volume
  return track.volume * masterVolume;
}

/**
 * Generate waveform peaks from raw audio data
 * This is a simplified version - in production, use FFmpeg or Web Audio API
 */
export function generateWaveformPeaks(
  audioData: Float32Array,
  targetPeaks: number = 200
): number[] {
  const peaks: number[] = [];
  const samplesPerPeak = Math.floor(audioData.length / targetPeaks);

  for (let i = 0; i < targetPeaks; i++) {
    const start = i * samplesPerPeak;
    const end = start + samplesPerPeak;
    let max = 0;

    for (let j = start; j < end && j < audioData.length; j++) {
      max = Math.max(max, Math.abs(audioData[j]));
    }

    peaks.push(max);
  }

  return peaks;
}

/**
 * Normalize waveform peaks to 0-1 range
 */
export function normalizeWaveformPeaks(peaks: number[]): number[] {
  const max = Math.max(...peaks, 0.0001); // Avoid division by zero
  return peaks.map((peak) => peak / max);
}

/**
 * Downsample waveform peaks for lower resolution
 */
export function downsampleWaveformPeaks(
  peaks: number[],
  targetCount: number
): number[] {
  if (peaks.length <= targetCount) return peaks;

  const downsampled: number[] = [];
  const ratio = peaks.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let max = 0;

    for (let j = start; j < end; j++) {
      max = Math.max(max, peaks[j]);
    }

    downsampled.push(max);
  }

  return downsampled;
}

/**
 * Create empty waveform data
 */
export function createEmptyWaveform(duration: number): WaveformData {
  return {
    peaks: new Array(200).fill(0),
    sampleRate: 44100,
    duration,
    channels: 2,
  };
}

/**
 * Validate audio config
 */
export function validateAudioConfig(config: AudioConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.volume < 0 || config.volume > 2) {
    errors.push("Volume must be between 0 and 2");
  }

  if (config.fadeIn < 0) {
    errors.push("Fade in cannot be negative");
  }

  if (config.fadeOut < 0) {
    errors.push("Fade out cannot be negative");
  }

  if (config.pan !== undefined && (config.pan < -1 || config.pan > 1)) {
    errors.push("Pan must be between -1 and 1");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get audio clip at a specific time
 */
export function getAudioClipAtTime(
  clips: AudioClip[],
  time: number
): AudioClip | undefined {
  return clips.find(
    (clip) => time >= clip.startTime && time < clip.startTime + clip.duration
  );
}

/**
 * Calculate total audio duration from clips
 */
export function calculateTotalAudioDuration(clips: AudioClip[]): number {
  if (clips.length === 0) return 0;
  return Math.max(...clips.map((clip) => clip.startTime + clip.duration));
}
