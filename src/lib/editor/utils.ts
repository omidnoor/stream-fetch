/**
 * Timeline Utility Functions
 *
 * Helper functions for timeline calculations, snapping, and clip operations.
 */

import type { TimelineClip, TimelineTrack, SnapConfig } from "./types";

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
