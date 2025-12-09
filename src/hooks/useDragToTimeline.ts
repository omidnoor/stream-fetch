"use client";

import { useState, useCallback, useRef } from "react";
import type { MediaAsset, TimelineClip, TimelineTrack } from "@/lib/editor/types";
import { generateClipId } from "@/lib/editor/utils";

interface DragToTimelineState {
  isDragging: boolean;
  asset: MediaAsset | null;
  targetTrackId: string | null;
  dropTime: number | null;
}

interface UseDragToTimelineOptions {
  /** Available tracks to drop onto */
  tracks: TimelineTrack[];
  /** Pixels per second for time calculation */
  pixelsPerSecond: number;
  /** Callback when drop is completed */
  onDrop?: (clip: TimelineClip, trackId: string) => void;
}

/**
 * useDragToTimeline Hook
 *
 * Handles dragging media assets from the library to the timeline.
 * Creates TimelineClip objects when dropped onto a track.
 */
export function useDragToTimeline({
  tracks,
  pixelsPerSecond,
  onDrop,
}: UseDragToTimelineOptions) {
  const [dragState, setDragState] = useState<DragToTimelineState>({
    isDragging: false,
    asset: null,
    targetTrackId: null,
    dropTime: null,
  });

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Get compatible track types for an asset type
   */
  const getCompatibleTrackTypes = useCallback((assetType: MediaAsset["type"]) => {
    switch (assetType) {
      case "video":
        return ["video"];
      case "audio":
        return ["audio"];
      case "image":
        return ["video"]; // Images can go on video tracks
      default:
        return [];
    }
  }, []);

  /**
   * Find compatible tracks for an asset
   */
  const getCompatibleTracks = useCallback(
    (asset: MediaAsset) => {
      const compatibleTypes = getCompatibleTrackTypes(asset.type);
      return tracks.filter(
        (track) => compatibleTypes.includes(track.type) && !track.locked
      );
    },
    [tracks, getCompatibleTrackTypes]
  );

  /**
   * Start dragging an asset
   */
  const startDrag = useCallback((asset: MediaAsset, startPos: { x: number; y: number }) => {
    dragStartPosRef.current = startPos;
    setDragState({
      isDragging: true,
      asset,
      targetTrackId: null,
      dropTime: null,
    });
  }, []);

  /**
   * Update drag position
   */
  const updateDrag = useCallback(
    (
      currentPos: { x: number; y: number },
      timelineRect: DOMRect,
      trackHeaderWidth: number = 192
    ) => {
      if (!dragState.isDragging || !dragState.asset) return;

      // Calculate time from X position
      const relativeX = currentPos.x - timelineRect.left - trackHeaderWidth;
      const dropTime = Math.max(0, relativeX / pixelsPerSecond);

      // Determine target track from Y position
      const relativeY = currentPos.y - timelineRect.top;
      let targetTrackId: string | null = null;
      let accumulatedHeight = 0;

      const compatibleTracks = getCompatibleTracks(dragState.asset);

      for (const track of tracks) {
        if (
          relativeY >= accumulatedHeight &&
          relativeY < accumulatedHeight + track.height
        ) {
          // Check if this track is compatible
          if (compatibleTracks.some((t) => t.id === track.id)) {
            targetTrackId = track.id;
          }
          break;
        }
        accumulatedHeight += track.height;
      }

      setDragState((prev) => ({
        ...prev,
        targetTrackId,
        dropTime,
      }));
    },
    [dragState.isDragging, dragState.asset, tracks, pixelsPerSecond, getCompatibleTracks]
  );

  /**
   * End drag operation
   */
  const endDrag = useCallback(() => {
    if (
      !dragState.isDragging ||
      !dragState.asset ||
      !dragState.targetTrackId ||
      dragState.dropTime === null
    ) {
      // Cancel drag
      setDragState({
        isDragging: false,
        asset: null,
        targetTrackId: null,
        dropTime: null,
      });
      dragStartPosRef.current = null;
      return;
    }

    // Create clip from asset
    const asset = dragState.asset;
    const duration = asset.metadata.duration || 5; // Default 5 seconds for images

    const clip: TimelineClip = {
      id: generateClipId(),
      trackId: dragState.targetTrackId,
      startTime: dragState.dropTime,
      duration,
      sourceStart: 0,
      sourceEnd: duration,
      sourceUrl: asset.thumbnail || "", // Will need to be replaced with actual file URL
      name: asset.originalFilename,
      volume: 1,
      muted: false,
    };

    // Trigger callback
    onDrop?.(clip, dragState.targetTrackId);

    // Reset state
    setDragState({
      isDragging: false,
      asset: null,
      targetTrackId: null,
      dropTime: null,
    });
    dragStartPosRef.current = null;
  }, [dragState, onDrop]);

  /**
   * Cancel drag operation
   */
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      asset: null,
      targetTrackId: null,
      dropTime: null,
    });
    dragStartPosRef.current = null;
  }, []);

  /**
   * Check if a track can accept the current drag
   */
  const canDropOnTrack = useCallback(
    (trackId: string): boolean => {
      if (!dragState.isDragging || !dragState.asset) return false;

      const compatibleTracks = getCompatibleTracks(dragState.asset);
      return compatibleTracks.some((t) => t.id === trackId);
    },
    [dragState.isDragging, dragState.asset, getCompatibleTracks]
  );

  /**
   * Get drop preview for rendering
   */
  const getDropPreview = useCallback(() => {
    if (
      !dragState.isDragging ||
      !dragState.asset ||
      !dragState.targetTrackId ||
      dragState.dropTime === null
    ) {
      return null;
    }

    const duration = dragState.asset.metadata.duration || 5;

    return {
      trackId: dragState.targetTrackId,
      startTime: dragState.dropTime,
      duration,
      assetType: dragState.asset.type,
      name: dragState.asset.originalFilename,
    };
  }, [dragState]);

  return {
    // State
    isDragging: dragState.isDragging,
    draggedAsset: dragState.asset,
    targetTrackId: dragState.targetTrackId,
    dropTime: dragState.dropTime,

    // Actions
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,

    // Helpers
    canDropOnTrack,
    getDropPreview,
    getCompatibleTracks,
  };
}

export type UseDragToTimelineReturn = ReturnType<typeof useDragToTimeline>;
