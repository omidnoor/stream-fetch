"use client";

import { useMemo, useCallback } from "react";
import {
  Video,
  Music,
  Type,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClipHandle } from "./clip-handle";
import type { TrackProps } from "@/lib/editor/types";
import type { DragState } from "@/lib/editor/types";

/**
 * Track Component
 *
 * Displays a single track row with its clips.
 * Includes track header with controls for mute/lock/visibility.
 */
export function Track({
  track,
  pixelsPerSecond,
  playheadTime,
  selectedClipIds,
  onClipSelect,
  onClipDragStart,
  onClipDragEnd,
  onTrackUpdate,
  className,
}: TrackProps & {
  onTrackUpdate?: (updates: { muted?: boolean; locked?: boolean; visible?: boolean }) => void;
}) {
  /**
   * Get track type icon
   */
  const TrackIcon = useMemo(() => {
    switch (track.type) {
      case "video":
        return Video;
      case "audio":
        return Music;
      case "text":
        return Type;
      default:
        return Video;
    }
  }, [track.type]);

  /**
   * Get track color based on type
   */
  const trackColor = useMemo(() => {
    switch (track.type) {
      case "video":
        return "from-blue-500/80 to-blue-600/80";
      case "audio":
        return "from-green-500/80 to-green-600/80";
      case "text":
        return "from-purple-500/80 to-purple-600/80";
      default:
        return "from-gray-500/80 to-gray-600/80";
    }
  }, [track.type]);

  /**
   * Handle track control toggles
   */
  const handleToggleMute = useCallback(() => {
    onTrackUpdate?.({ muted: !track.muted });
  }, [track.muted, onTrackUpdate]);

  const handleToggleLock = useCallback(() => {
    onTrackUpdate?.({ locked: !track.locked });
  }, [track.locked, onTrackUpdate]);

  const handleToggleVisible = useCallback(() => {
    onTrackUpdate?.({ visible: !track.visible });
  }, [track.visible, onTrackUpdate]);

  return (
    <div
      className={cn(
        "flex border-b border-border",
        !track.visible && "opacity-50",
        className
      )}
      style={{ height: `${track.height}px` }}
    >
      {/* Track Header */}
      <div className="flex-shrink-0 w-48 bg-surface-2 border-r border-border flex items-center gap-2 px-3">
        {/* Track Icon */}
        <TrackIcon className="w-4 h-4 text-muted-foreground" />

        {/* Track Name */}
        <span className="flex-1 text-sm font-medium truncate">{track.name}</span>

        {/* Track Controls */}
        <div className="flex items-center gap-1">
          {/* Mute (for video/audio tracks) */}
          {track.type !== "text" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleToggleMute}
              title={track.muted ? "Unmute" : "Mute"}
            >
              {track.muted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

          {/* Visibility */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleToggleVisible}
            title={track.visible ? "Hide" : "Show"}
          >
            {track.visible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>

          {/* Lock */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleToggleLock}
            title={track.locked ? "Unlock" : "Lock"}
          >
            {track.locked ? (
              <Lock className="w-3.5 h-3.5 text-yellow-500" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Track Content (Clips Area) */}
      <div className="flex-1 relative bg-surface-1">
        {/* Clips */}
        {track.clips.map((clip) => (
          <ClipHandle
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            isSelected={selectedClipIds.includes(clip.id)}
            isDragging={false}
            isLocked={track.locked}
            trackColor={trackColor}
            onSelect={(multiSelect) => onClipSelect(clip.id, multiSelect)}
            onDragStart={(dragType) => onClipDragStart(clip.id, dragType)}
            onDragEnd={onClipDragEnd}
          />
        ))}

        {/* Empty track indicator */}
        {track.clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">
            Drop clips here
          </div>
        )}
      </div>
    </div>
  );
}
