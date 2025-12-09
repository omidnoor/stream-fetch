"use client";

import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Minus,
  Scissors,
  Trash2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Magnet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TimeRuler, Playhead, Track } from "./timeline/index";
import { useTimeline } from "@/hooks/useTimeline";
import { usePlayback } from "@/hooks/usePlayback";
import { useDragClip } from "@/hooks/useDragClip";
import {
  formatTime,
  createVideoTrack,
  createAudioTrack,
  generateClipId,
  getPixelsPerSecond,
} from "@/lib/editor/utils";
import type { TimelineTrack, TimelineClip, DragState } from "@/lib/editor/types";

interface TimelineEditorProps {
  /** Initial tracks (if any) */
  initialTracks?: TimelineTrack[];
  /** Called when timeline state changes (for saving) */
  onStateChange?: (tracks: TimelineTrack[], duration: number) => void;
  /** Called when playhead time changes */
  onTimeChange?: (time: number) => void;
  /** Called when playing state changes */
  onPlayingChange?: (isPlaying: boolean) => void;
  /** Current playhead time (controlled) */
  currentTime?: number;
  /** Whether playback is active (controlled) */
  isPlaying?: boolean;
  /** Class name */
  className?: string;
}

/**
 * TimelineEditor Component
 *
 * Full-featured timeline editor with tracks, clips, playhead,
 * and all the editing capabilities.
 */
export function TimelineEditor({
  initialTracks,
  onStateChange,
  onTimeChange,
  onPlayingChange,
  currentTime: controlledTime,
  isPlaying: controlledPlaying,
  className,
}: TimelineEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  // Initialize timeline state
  const timeline = useTimeline(initialTracks);
  const {
    state,
    pixelsPerSecond,
    selectedClips,
    addTrack,
    removeClip,
    updateClip,
    moveClip,
    cutAtPlayhead,
    seek,
    play,
    pause,
    togglePlayback,
    setZoom,
    zoomIn,
    zoomOut,
    setScroll,
    selectClip,
    clearSelection,
    setSnapConfig,
    updateTrack,
  } = timeline;

  // Use controlled values if provided
  const currentTime = controlledTime ?? state.playhead.currentTime;
  const isPlaying = controlledPlaying ?? state.playhead.isPlaying;

  // Playback hook
  const playback = usePlayback({
    duration: state.duration,
    currentTime,
    isPlaying,
    playbackRate: state.playhead.playbackRate,
    onTimeChange: (time) => {
      seek(time);
      onTimeChange?.(time);
    },
    onPlayingChange: (playing) => {
      if (playing) {
        play();
      } else {
        pause();
      }
      onPlayingChange?.(playing);
    },
    loop: false,
  });

  // Drag clip hook
  const dragClip = useDragClip({
    tracks: state.tracks,
    pixelsPerSecond,
    playheadTime: currentTime,
    snapConfig: state.snap,
    onDragEnd: (clipId, fromTrackId, toTrackId, newStartTime) => {
      moveClip(clipId, fromTrackId, toTrackId, newStartTime);
    },
    onTrimEnd: (clipId, trackId, updates) => {
      updateClip(trackId, clipId, updates);
    },
  });

  // Calculate total height for all tracks
  const totalTracksHeight = useMemo(() => {
    return state.tracks.reduce((sum, track) => sum + track.height, 0);
  }, [state.tracks]);

  // Timeline width in pixels
  const timelineWidth = useMemo(() => {
    const minWidth = 1000;
    return Math.max(state.duration * pixelsPerSecond, minWidth);
  }, [state.duration, pixelsPerSecond]);

  /**
   * Handle click on timeline background to seek
   */
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragClip.dragState.isDragging) return;

      const container = tracksContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + state.view.scrollLeft;
      const time = x / pixelsPerSecond;
      const clampedTime = Math.max(0, Math.min(time, state.duration));

      playback.seekTo(clampedTime);
      clearSelection();
    },
    [dragClip.dragState.isDragging, state.view.scrollLeft, pixelsPerSecond, state.duration, playback, clearSelection]
  );

  /**
   * Handle scroll event
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScroll(e.currentTarget.scrollLeft);
    },
    [setScroll]
  );

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayback();
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          // Delete selected clips
          selectedClips.forEach((clip) => {
            const track = state.tracks.find((t) =>
              t.clips.some((c) => c.id === clip.id)
            );
            if (track) {
              removeClip(track.id, clip.id);
            }
          });
          break;
        case "ArrowLeft":
          e.preventDefault();
          playback.skipBackward(e.shiftKey ? 1 : 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          playback.skipForward(e.shiftKey ? 1 : 5);
          break;
        case "Home":
          e.preventDefault();
          playback.goToStart();
          break;
        case "End":
          e.preventDefault();
          playback.goToEnd();
          break;
        case "=":
        case "+":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            // Cut at playhead
            selectedClips.forEach((clip) => {
              const track = state.tracks.find((t) =>
                t.clips.some((c) => c.id === clip.id)
              );
              if (track) {
                cutAtPlayhead(track.id, clip.id);
              }
            });
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlayback,
    selectedClips,
    state.tracks,
    removeClip,
    playback,
    zoomIn,
    zoomOut,
    cutAtPlayhead,
  ]);

  /**
   * Notify parent of state changes
   */
  useEffect(() => {
    onStateChange?.(state.tracks, state.duration);
  }, [state.tracks, state.duration, onStateChange]);

  /**
   * Handle adding a new video track
   */
  const handleAddVideoTrack = useCallback(() => {
    const trackCount = state.tracks.filter((t) => t.type === "video").length;
    addTrack(createVideoTrack(`Video ${trackCount + 1}`));
  }, [state.tracks, addTrack]);

  /**
   * Handle adding a new audio track
   */
  const handleAddAudioTrack = useCallback(() => {
    const trackCount = state.tracks.filter((t) => t.type === "audio").length;
    addTrack(createAudioTrack(`Audio ${trackCount + 1}`));
  }, [state.tracks, addTrack]);

  /**
   * Handle clip selection
   */
  const handleClipSelect = useCallback(
    (clipId: string, multiSelect?: boolean) => {
      selectClip(clipId, multiSelect);
    },
    [selectClip]
  );

  /**
   * Handle clip drag start
   */
  const handleClipDragStart = useCallback(
    (clipId: string, dragType: DragState["dragType"]) => {
      // Find the clip and track
      for (const track of state.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          dragClip.startDrag(clipId, dragType, 0);
          break;
        }
      }
    },
    [state.tracks, dragClip]
  );

  /**
   * Handle clip drag end
   */
  const handleClipDragEnd = useCallback(() => {
    dragClip.endDrag();
  }, [dragClip]);

  /**
   * Handle track update
   */
  const handleTrackUpdate = useCallback(
    (trackId: string, updates: Partial<TimelineTrack>) => {
      updateTrack(trackId, updates);
    },
    [updateTrack]
  );

  return (
    <div
      className={cn(
        "w-full bg-surface-2 rounded-lg border border-border flex flex-col",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Transport Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playback.goToStart}
              title="Go to Start (Home)"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={togglePlayback}
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playback.goToEnd}
              title="Go to End (End)"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="text-sm font-mono text-muted-foreground">
            {formatTime(currentTime, state.duration >= 3600)} /{" "}
            {formatTime(state.duration, state.duration >= 3600)}
          </div>

          {/* Edit Tools */}
          <div className="flex items-center gap-1 border-l border-border pl-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                selectedClips.forEach((clip) => {
                  const track = state.tracks.find((t) =>
                    t.clips.some((c) => c.id === clip.id)
                  );
                  if (track) {
                    cutAtPlayhead(track.id, clip.id);
                  }
                });
              }}
              disabled={selectedClips.length === 0}
              title="Split at Playhead (Ctrl+C)"
            >
              <Scissors className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                selectedClips.forEach((clip) => {
                  const track = state.tracks.find((t) =>
                    t.clips.some((c) => c.id === clip.id)
                  );
                  if (track) {
                    removeClip(track.id, clip.id);
                  }
                });
              }}
              disabled={selectedClips.length === 0}
              title="Delete Selected (Delete)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Snap Toggle */}
          <Button
            variant={state.snap.enabled ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setSnapConfig({ enabled: !state.snap.enabled })}
            title={`Snapping ${state.snap.enabled ? "On" : "Off"}`}
          >
            <Magnet className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Track */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddVideoTrack}
              title="Add Video Track"
            >
              <Plus className="h-4 w-4 mr-1" />
              Video
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddAudioTrack}
              title="Add Audio Track"
            >
              <Plus className="h-4 w-4 mr-1" />
              Audio
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
              disabled={state.view.zoom <= 0.1}
              title="Zoom Out (Ctrl+-)"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(state.view.zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomIn}
              disabled={state.view.zoom >= 5}
              title="Zoom In (Ctrl++)"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ minHeight: "200px" }}
      >
        {/* Time Ruler (fixed at top) */}
        <div className="sticky top-0 z-10 bg-surface-2 ml-48">
          <TimeRuler
            duration={state.duration || 60}
            pixelsPerSecond={pixelsPerSecond}
            scrollLeft={state.view.scrollLeft}
            width={containerRef.current?.clientWidth ?? 800}
            onSeek={playback.seekTo}
          />
        </div>

        {/* Tracks Container */}
        <div
          ref={tracksContainerRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100% - 32px)" }}
          onScroll={handleScroll}
          onClick={handleTimelineClick}
        >
          <div
            className="relative"
            style={{
              width: `${timelineWidth + 192}px`, // +192 for track headers
              minHeight: `${Math.max(totalTracksHeight, 160)}px`,
            }}
          >
            {/* Tracks */}
            {state.tracks.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">No tracks yet</p>
                  <p className="text-sm text-muted-foreground/60">
                    Click &quot;+ Video&quot; or &quot;+ Audio&quot; to add a track
                  </p>
                </div>
              </div>
            ) : (
              state.tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
                  pixelsPerSecond={pixelsPerSecond}
                  playheadTime={currentTime}
                  selectedClipIds={state.selection.clipIds}
                  onClipSelect={handleClipSelect}
                  onClipDragStart={handleClipDragStart}
                  onClipDragEnd={handleClipDragEnd}
                  onTrackUpdate={(updates) => handleTrackUpdate(track.id, updates)}
                />
              ))
            )}

            {/* Playhead (spans all tracks) */}
            <div className="absolute top-0 left-48 bottom-0 pointer-events-none">
              <Playhead
                time={currentTime}
                pixelsPerSecond={pixelsPerSecond}
                height={Math.max(totalTracksHeight, 160)}
                onSeek={playback.seekTo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {state.tracks.length} track{state.tracks.length !== 1 ? "s" : ""}
          </span>
          <span>
            {state.tracks.reduce((sum, t) => sum + t.clips.length, 0)} clip
            {state.tracks.reduce((sum, t) => sum + t.clips.length, 0) !== 1
              ? "s"
              : ""}
          </span>
        </div>
        {selectedClips.length > 0 && (
          <span className="text-primary">
            {selectedClips.length} selected
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * SimpleTimeline Component (Backwards Compatible)
 *
 * This is a simpler timeline component for basic use cases
 * that maintains backwards compatibility with the old API.
 */

interface SimpleClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  position: number;
  sourceUrl: string;
}

interface SimpleTimelineProps {
  clips?: SimpleClip[];
  duration?: number;
  currentTime?: number;
  onClipsChange?: (clips: SimpleClip[]) => void;
  onSeek?: (time: number) => void;
  onDeleteClip?: (clipId: string) => void;
  className?: string;
}

export function Timeline({
  clips = [],
  duration = 0,
  currentTime = 0,
  onClipsChange,
  onSeek,
  onDeleteClip,
  className = "",
}: SimpleTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const PIXELS_PER_SECOND = 50 * zoom;
  const TIMELINE_HEIGHT = 80;
  const timelineWidth = Math.max(duration * PIXELS_PER_SECOND, 1000);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedTime = x / PIXELS_PER_SECOND;

      onSeek?.(Math.max(0, Math.min(clickedTime, duration)));
    },
    [duration, PIXELS_PER_SECOND, onSeek]
  );

  const handleDeleteClip = useCallback(
    (clipId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteClip?.(clipId);
      if (selectedClipId === clipId) {
        setSelectedClipId(null);
      }
    },
    [selectedClipId, onDeleteClip]
  );

  const handleClipClick = useCallback((clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClipId(clipId);
  }, []);

  const renderTimeMarkers = () => {
    const markers = [];
    const markerInterval = 5;
    const markerCount = Math.ceil(duration / markerInterval);

    for (let i = 0; i <= markerCount; i++) {
      const time = i * markerInterval;
      const xPos = time * PIXELS_PER_SECOND;

      markers.push(
        <div
          key={`marker-${i}`}
          className="absolute flex flex-col items-center"
          style={{ left: `${xPos}px` }}
        >
          <div className="h-2 w-px bg-border" />
          <span className="text-[10px] text-muted-foreground mt-1">
            {formatTime(time)}
          </span>
        </div>
      );
    }

    return markers;
  };

  return (
    <div className={cn("w-full bg-surface-2 rounded-lg border border-border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Timeline</span>
          <span className="text-xs text-muted-foreground/60">
            {clips.length} clip{clips.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            -
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
          >
            +
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="relative overflow-x-auto overflow-y-hidden">
        <div
          ref={timelineRef}
          className="relative cursor-pointer bg-surface-1"
          style={{
            width: `${timelineWidth}px`,
            height: `${TIMELINE_HEIGHT + 40}px`,
          }}
          onClick={handleTimelineClick}
        >
          {/* Time Markers */}
          <div className="absolute top-0 left-0 right-0 h-8 border-b border-border">
            {renderTimeMarkers()}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{
              left: `${currentTime * PIXELS_PER_SECOND}px`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
          </div>

          {/* Clips Track */}
          <div className="absolute top-8 left-0 right-0" style={{ height: `${TIMELINE_HEIGHT}px` }}>
            {clips.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground/60 text-sm">
                No clips on timeline. Upload a video to get started.
              </div>
            ) : (
              clips.map((clip) => {
                const xPos = clip.position * PIXELS_PER_SECOND;
                const width = clip.duration * PIXELS_PER_SECOND;
                const isSelected = selectedClipId === clip.id;

                return (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-2 rounded cursor-pointer transition-all",
                      isSelected
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:ring-1 hover:ring-border"
                    )}
                    style={{
                      left: `${xPos}px`,
                      width: `${width}px`,
                      height: `${TIMELINE_HEIGHT - 16}px`,
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
                    }}
                    onClick={(e) => handleClipClick(clip.id, e)}
                  >
                    <div className="relative h-full p-2 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-medium text-white truncate flex-1">
                          {clip.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-500/20"
                          onClick={(e) => handleDeleteClip(clip.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                      <div className="text-[10px] text-white/70">
                        {formatTime(clip.duration)}
                      </div>
                    </div>

                    {isSelected && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize hover:bg-white" />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
        <div>
          Current: {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        {selectedClipId && (
          <div className="text-primary">
            1 clip selected
          </div>
        )}
      </div>
    </div>
  );
}

