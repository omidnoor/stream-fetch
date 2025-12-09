"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatTime, timeToPixels } from "@/lib/editor/utils";
import type { ClipHandleProps, DragState } from "@/lib/editor/types";

/**
 * ClipHandle Component
 *
 * Represents a single clip on the timeline.
 * Supports selection, dragging to move, and trim handles on edges.
 */
export function ClipHandle({
  clip,
  pixelsPerSecond,
  isSelected,
  isDragging,
  isLocked,
  trackColor = "from-primary/80 to-accent/80",
  onSelect,
  onDragStart,
  onDragEnd,
  className,
}: ClipHandleProps & {
  isLocked?: boolean;
  trackColor?: string;
}) {
  const clipRef = useRef<HTMLDivElement>(null);

  // Calculate position and dimensions
  const xPosition = timeToPixels(clip.startTime, 1, pixelsPerSecond);
  const width = timeToPixels(clip.duration, 1, pixelsPerSecond);

  /**
   * Handle clip selection
   */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(e.shiftKey || e.ctrlKey || e.metaKey);
    },
    [onSelect]
  );

  /**
   * Handle double-click (could open clip properties)
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open clip properties dialog
  }, []);

  /**
   * Handle drag start for moving the clip
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return;
      if (e.button !== 0) return; // Only left click

      // Check if clicking on trim handles
      const rect = clipRef.current?.getBoundingClientRect();
      if (!rect) return;

      const relativeX = e.clientX - rect.left;
      const handleWidth = 8; // pixels

      // Determine drag type based on click position
      let dragType: DragState["dragType"] = "move";
      if (relativeX <= handleWidth) {
        dragType = "trim-start";
      } else if (relativeX >= rect.width - handleWidth) {
        dragType = "trim-end";
      }

      e.stopPropagation();
      e.preventDefault();

      onDragStart?.(dragType);

      // Setup mouse move and up handlers
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Drag handling is done in parent via useDragClip
      };

      const handleMouseUp = () => {
        onDragEnd?.();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isLocked, onDragStart, onDragEnd]
  );

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 bottom-1 rounded cursor-pointer transition-all",
        "group",
        `bg-gradient-to-br ${trackColor}`,
        isSelected && "ring-2 ring-white shadow-lg",
        isDragging && "opacity-75 cursor-grabbing",
        isLocked && "cursor-not-allowed opacity-75",
        !isLocked && "hover:ring-1 hover:ring-white/50",
        className
      )}
      style={{
        left: `${xPosition}px`,
        width: `${Math.max(width, 4)}px`, // Minimum 4px width
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Clip Content */}
      <div className="relative h-full p-1.5 overflow-hidden">
        {/* Clip Name */}
        <div className="text-xs font-medium text-white truncate">
          {clip.name}
        </div>

        {/* Duration (shown if clip is wide enough) */}
        {width > 60 && (
          <div className="absolute bottom-1 left-1.5 text-[10px] text-white/70">
            {formatTime(clip.duration)}
          </div>
        )}

        {/* Waveform or thumbnail preview could go here */}
      </div>

      {/* Trim Handles (visible when selected or hovered) */}
      {!isLocked && (
        <>
          {/* Left trim handle */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize",
              "bg-white/0 hover:bg-white/30 transition-colors",
              "opacity-0 group-hover:opacity-100",
              isSelected && "opacity-100"
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart?.("trim-start");
            }}
          >
            <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/50 rounded-full" />
          </div>

          {/* Right trim handle */}
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize",
              "bg-white/0 hover:bg-white/30 transition-colors",
              "opacity-0 group-hover:opacity-100",
              isSelected && "opacity-100"
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              onDragStart?.("trim-end");
            }}
          >
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/50 rounded-full" />
          </div>
        </>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-white rounded pointer-events-none" />
      )}

      {/* Locked indicator */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/20 rounded pointer-events-none" />
      )}
    </div>
  );
}
