"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  TimelineClip,
  TimelineTrack,
  DragState,
  SnapConfig,
} from "@/lib/editor/types";
import {
  pixelsToTime,
  snapTime,
  getClipEdges,
  detectOverlap,
  clamp,
} from "@/lib/editor/utils";

interface UseDragClipOptions {
  /** All tracks in the timeline */
  tracks: TimelineTrack[];
  /** Pixels per second at current zoom */
  pixelsPerSecond: number;
  /** Current playhead time */
  playheadTime: number;
  /** Snap configuration */
  snapConfig: SnapConfig;
  /** Callback when clip position changes during drag */
  onDragUpdate?: (clipId: string, newStartTime: number, targetTrackId: string) => void;
  /** Callback when drag completes */
  onDragEnd?: (
    clipId: string,
    fromTrackId: string,
    toTrackId: string,
    newStartTime: number
  ) => void;
  /** Callback when trim operation completes */
  onTrimEnd?: (
    clipId: string,
    trackId: string,
    updates: { startTime?: number; duration?: number; sourceStart?: number; sourceEnd?: number }
  ) => void;
  /** Minimum clip duration in seconds */
  minClipDuration?: number;
}

/**
 * useDragClip Hook
 *
 * Handles drag-and-drop operations for clips on the timeline including:
 * - Moving clips (horizontal repositioning)
 * - Trimming clips from start or end
 * - Snapping to grid, playhead, and other clip edges
 * - Detecting overlaps with other clips
 */
export function useDragClip({
  tracks,
  pixelsPerSecond,
  playheadTime,
  snapConfig,
  onDragUpdate,
  onDragEnd,
  onTrimEnd,
  minClipDuration = 0.1,
}: UseDragClipOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    clipId: null,
    targetTrackId: null,
    originalStartTime: 0,
    deltaTime: 0,
    dragType: null,
  });

  // Refs for tracking drag state
  const dragStartXRef = useRef<number>(0);
  const originalClipRef = useRef<TimelineClip | null>(null);
  const originalTrackIdRef = useRef<string | null>(null);

  // Snapped position indicator
  const [snappedTo, setSnappedTo] = useState<string | null>(null);

  /**
   * Find a clip by ID across all tracks
   */
  const findClip = useCallback(
    (clipId: string): { clip: TimelineClip; trackId: string } | null => {
      for (const track of tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          return { clip, trackId: track.id };
        }
      }
      return null;
    },
    [tracks]
  );

  /**
   * Get clip edges for snapping (excluding the dragged clip)
   */
  const getSnapTargets = useCallback(
    (excludeClipId: string) => {
      const clipEdges = getClipEdges(tracks, excludeClipId);
      return {
        playheadTime,
        clipEdges,
      };
    },
    [tracks, playheadTime]
  );

  /**
   * Start a drag operation
   */
  const startDrag = useCallback(
    (
      clipId: string,
      dragType: DragState["dragType"],
      startX: number
    ) => {
      const result = findClip(clipId);
      if (!result) return;

      const { clip, trackId } = result;

      dragStartXRef.current = startX;
      originalClipRef.current = { ...clip };
      originalTrackIdRef.current = trackId;

      setDragState({
        isDragging: true,
        clipId,
        targetTrackId: trackId,
        originalStartTime: clip.startTime,
        deltaTime: 0,
        dragType,
      });
    },
    [findClip]
  );

  /**
   * Update drag position
   */
  const updateDrag = useCallback(
    (currentX: number, targetTrackId?: string) => {
      if (!dragState.isDragging || !originalClipRef.current) return;

      const deltaPixels = currentX - dragStartXRef.current;
      const deltaTime = pixelsToTime(deltaPixels, 1) / pixelsPerSecond * 50; // Adjust for actual pps

      const clip = originalClipRef.current;
      const originalTrackId = originalTrackIdRef.current!;
      const newTargetTrackId = targetTrackId ?? dragState.targetTrackId ?? originalTrackId;

      // Get snap targets
      const snapTargets = getSnapTargets(clip.id);

      let newStartTime: number;
      let updates: Partial<TimelineClip> = {};

      switch (dragState.dragType) {
        case "move": {
          // Calculate new position with snapping
          const rawStartTime = clip.startTime + deltaTime;
          const { snappedTime, snappedTo: snapLabel } = snapTime(
            rawStartTime,
            snapConfig,
            snapTargets
          );
          newStartTime = Math.max(0, snappedTime);
          setSnappedTo(snapLabel);

          // Check for overlaps on the target track
          const targetTrack = tracks.find((t) => t.id === newTargetTrackId);
          if (targetTrack) {
            const overlap = detectOverlap(
              { startTime: newStartTime, duration: clip.duration, id: clip.id },
              targetTrack.clips
            );
            if (overlap) {
              // Adjust position to avoid overlap
              const overlapEnd = overlap.startTime + overlap.duration;
              if (newStartTime < overlapEnd && newStartTime + clip.duration > overlap.startTime) {
                if (deltaTime > 0) {
                  newStartTime = overlapEnd;
                } else {
                  newStartTime = overlap.startTime - clip.duration;
                }
              }
            }
          }

          break;
        }

        case "trim-start": {
          // Trim from the start (affects startTime, duration, and sourceStart)
          const rawStartTime = clip.startTime + deltaTime;
          const { snappedTime } = snapTime(rawStartTime, snapConfig, snapTargets);

          // Clamp to valid range
          const maxStartTime = clip.startTime + clip.duration - minClipDuration;
          newStartTime = clamp(snappedTime, 0, maxStartTime);

          const timeDelta = newStartTime - clip.startTime;
          const newDuration = clip.duration - timeDelta;
          const sourceDuration = clip.sourceEnd - clip.sourceStart;
          const sourceTimeDelta = (timeDelta / clip.duration) * sourceDuration;

          updates = {
            startTime: newStartTime,
            duration: newDuration,
            sourceStart: clip.sourceStart + sourceTimeDelta,
          };
          break;
        }

        case "trim-end": {
          // Trim from the end (affects duration and sourceEnd)
          const rawEndTime = clip.startTime + clip.duration + deltaTime;
          const { snappedTime } = snapTime(rawEndTime, snapConfig, snapTargets);

          // Clamp to valid range
          const minEndTime = clip.startTime + minClipDuration;
          const newEndTime = Math.max(snappedTime, minEndTime);
          const newDuration = newEndTime - clip.startTime;

          const sourceDuration = clip.sourceEnd - clip.sourceStart;
          const durationRatio = newDuration / clip.duration;
          const newSourceEnd = clip.sourceStart + sourceDuration * durationRatio;

          newStartTime = clip.startTime;
          updates = {
            duration: newDuration,
            sourceEnd: newSourceEnd,
          };
          break;
        }

        default:
          return;
      }

      setDragState((prev) => ({
        ...prev,
        deltaTime,
        targetTrackId: newTargetTrackId,
      }));

      if (dragState.dragType === "move") {
        onDragUpdate?.(clip.id, newStartTime, newTargetTrackId);
      }
    },
    [
      dragState,
      pixelsPerSecond,
      snapConfig,
      tracks,
      minClipDuration,
      getSnapTargets,
      onDragUpdate,
    ]
  );

  /**
   * End a drag operation
   */
  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !originalClipRef.current) {
      setDragState({
        isDragging: false,
        clipId: null,
        targetTrackId: null,
        originalStartTime: 0,
        deltaTime: 0,
        dragType: null,
      });
      return;
    }

    const clip = originalClipRef.current;
    const originalTrackId = originalTrackIdRef.current!;
    const targetTrackId = dragState.targetTrackId ?? originalTrackId;

    // Calculate final position
    const deltaPixels = dragState.deltaTime * pixelsPerSecond;
    const deltaTime = pixelsToTime(deltaPixels, 1);

    switch (dragState.dragType) {
      case "move": {
        const rawStartTime = clip.startTime + deltaTime;
        const { snappedTime } = snapTime(rawStartTime, snapConfig, {
          playheadTime,
          clipEdges: getClipEdges(tracks, clip.id),
        });
        const newStartTime = Math.max(0, snappedTime);

        onDragEnd?.(clip.id, originalTrackId, targetTrackId, newStartTime);
        break;
      }

      case "trim-start":
      case "trim-end": {
        // Recalculate trim values for final commit
        const rawTime =
          dragState.dragType === "trim-start"
            ? clip.startTime + deltaTime
            : clip.startTime + clip.duration + deltaTime;

        const { snappedTime } = snapTime(rawTime, snapConfig, {
          playheadTime,
          clipEdges: getClipEdges(tracks, clip.id),
        });

        let updates: Parameters<NonNullable<typeof onTrimEnd>>[2] = {};

        if (dragState.dragType === "trim-start") {
          const maxStartTime = clip.startTime + clip.duration - minClipDuration;
          const newStartTime = clamp(snappedTime, 0, maxStartTime);
          const timeDelta = newStartTime - clip.startTime;
          const newDuration = clip.duration - timeDelta;
          const sourceDuration = clip.sourceEnd - clip.sourceStart;
          const sourceTimeDelta = (timeDelta / clip.duration) * sourceDuration;

          updates = {
            startTime: newStartTime,
            duration: newDuration,
            sourceStart: clip.sourceStart + sourceTimeDelta,
          };
        } else {
          const minEndTime = clip.startTime + minClipDuration;
          const newEndTime = Math.max(snappedTime, minEndTime);
          const newDuration = newEndTime - clip.startTime;
          const sourceDuration = clip.sourceEnd - clip.sourceStart;
          const durationRatio = newDuration / clip.duration;

          updates = {
            duration: newDuration,
            sourceEnd: clip.sourceStart + sourceDuration * durationRatio,
          };
        }

        onTrimEnd?.(clip.id, originalTrackId, updates);
        break;
      }
    }

    // Reset state
    setDragState({
      isDragging: false,
      clipId: null,
      targetTrackId: null,
      originalStartTime: 0,
      deltaTime: 0,
      dragType: null,
    });
    setSnappedTo(null);
    originalClipRef.current = null;
    originalTrackIdRef.current = null;
  }, [
    dragState,
    pixelsPerSecond,
    snapConfig,
    playheadTime,
    tracks,
    minClipDuration,
    onDragEnd,
    onTrimEnd,
  ]);

  /**
   * Cancel a drag operation
   */
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      clipId: null,
      targetTrackId: null,
      originalStartTime: 0,
      deltaTime: 0,
      dragType: null,
    });
    setSnappedTo(null);
    originalClipRef.current = null;
    originalTrackIdRef.current = null;
  }, []);

  // Handle escape key to cancel drag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dragState.isDragging) {
        cancelDrag();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dragState.isDragging, cancelDrag]);

  // Calculate preview position for the dragged clip
  const getDragPreview = useCallback(() => {
    if (!dragState.isDragging || !originalClipRef.current) return null;

    const clip = originalClipRef.current;
    const deltaTime = dragState.deltaTime;

    switch (dragState.dragType) {
      case "move":
        return {
          clipId: clip.id,
          startTime: Math.max(0, clip.startTime + deltaTime),
          duration: clip.duration,
          trackId: dragState.targetTrackId,
        };

      case "trim-start": {
        const newStartTime = clamp(
          clip.startTime + deltaTime,
          0,
          clip.startTime + clip.duration - minClipDuration
        );
        return {
          clipId: clip.id,
          startTime: newStartTime,
          duration: clip.startTime + clip.duration - newStartTime,
          trackId: dragState.targetTrackId,
        };
      }

      case "trim-end": {
        const newEndTime = Math.max(
          clip.startTime + minClipDuration,
          clip.startTime + clip.duration + deltaTime
        );
        return {
          clipId: clip.id,
          startTime: clip.startTime,
          duration: newEndTime - clip.startTime,
          trackId: dragState.targetTrackId,
        };
      }

      default:
        return null;
    }
  }, [dragState, minClipDuration]);

  return {
    // State
    dragState,
    snappedTo,

    // Methods
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,

    // Preview
    getDragPreview,
  };
}

export type UseDragClipReturn = ReturnType<typeof useDragClip>;
