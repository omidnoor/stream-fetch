"use client";

import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { pixelsToTime, timeToPixels } from "@/lib/editor/utils";
import type { PlayheadProps } from "@/lib/editor/types";

/**
 * Playhead Component
 *
 * The vertical indicator showing the current time position.
 * Supports dragging to seek to different positions.
 */
export function Playhead({
  time,
  pixelsPerSecond,
  height,
  onSeek,
  className,
}: PlayheadProps) {
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const xPosition = timeToPixels(time, 1, pixelsPerSecond);

  /**
   * Handle drag start
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onSeek) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const startX = e.clientX;
      const startTime = time;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaTime = pixelsToTime(deltaX, 1, pixelsPerSecond);
        const newTime = Math.max(0, startTime + deltaTime);
        onSeek(newTime);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [time, pixelsPerSecond, onSeek]
  );

  return (
    <div
      ref={playheadRef}
      className={cn(
        "absolute top-0 z-20 pointer-events-auto",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: `${xPosition}px`,
        height: `${height}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Playhead head (triangle/circle at top) */}
      <div
        className={cn(
          "absolute -top-1 left-1/2 -translate-x-1/2 cursor-grab",
          "w-4 h-4 bg-red-500 rounded-full shadow-lg",
          "hover:scale-110 transition-transform",
          isDragging && "scale-110 cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Playhead line */}
      <div
        className={cn(
          "absolute top-3 left-1/2 w-0.5 bg-red-500",
          "-translate-x-1/2"
        )}
        style={{ height: `calc(${height}px - 12px)` }}
      />

      {/* Time tooltip (shown while dragging) */}
      {isDragging && (
        <div
          className={cn(
            "absolute -top-7 left-1/2 -translate-x-1/2",
            "px-2 py-0.5 bg-red-500 text-white text-xs rounded",
            "whitespace-nowrap shadow-lg"
          )}
        >
          {formatTimeDisplay(time)}
        </div>
      )}
    </div>
  );
}

/**
 * Format time for tooltip display
 */
function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
