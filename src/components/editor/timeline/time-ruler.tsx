"use client";

import { useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatTime, pixelsToTime } from "@/lib/editor/utils";
import type { TimeRulerProps } from "@/lib/editor/types";

/**
 * TimeRuler Component
 *
 * Displays time markers above the timeline tracks.
 * Supports click-to-seek and adaptive marker intervals based on zoom level.
 */
export function TimeRuler({
  duration,
  pixelsPerSecond,
  scrollLeft,
  width,
  onSeek,
  className,
}: TimeRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);

  /**
   * Calculate marker interval based on pixels per second
   * Adjusts to show appropriate time markers at different zoom levels
   */
  const markerInterval = useMemo(() => {
    if (pixelsPerSecond >= 200) return 1; // Every second
    if (pixelsPerSecond >= 100) return 2; // Every 2 seconds
    if (pixelsPerSecond >= 50) return 5; // Every 5 seconds
    if (pixelsPerSecond >= 25) return 10; // Every 10 seconds
    if (pixelsPerSecond >= 10) return 30; // Every 30 seconds
    return 60; // Every minute
  }, [pixelsPerSecond]);

  /**
   * Calculate sub-marker interval (smaller ticks between main markers)
   */
  const subMarkerInterval = useMemo(() => {
    if (markerInterval === 1) return 0.5;
    if (markerInterval === 2) return 1;
    if (markerInterval === 5) return 1;
    if (markerInterval === 10) return 5;
    if (markerInterval === 30) return 10;
    return 30;
  }, [markerInterval]);

  /**
   * Generate marker positions
   */
  const markers = useMemo(() => {
    const result: Array<{
      time: number;
      x: number;
      isMain: boolean;
      label: string;
    }> = [];

    // Calculate visible time range based on scroll and width
    const visibleStartTime = Math.max(0, pixelsToTime(scrollLeft - 100, 1, pixelsPerSecond));
    const visibleEndTime = Math.min(
      duration,
      pixelsToTime(scrollLeft + width + 100, 1, pixelsPerSecond)
    );

    // Generate main markers
    const startMarker = Math.floor(visibleStartTime / markerInterval) * markerInterval;
    for (let time = startMarker; time <= visibleEndTime; time += markerInterval) {
      if (time < 0) continue;
      result.push({
        time,
        x: time * pixelsPerSecond,
        isMain: true,
        label: formatTime(time, duration >= 3600),
      });
    }

    // Generate sub-markers
    const startSub = Math.floor(visibleStartTime / subMarkerInterval) * subMarkerInterval;
    for (let time = startSub; time <= visibleEndTime; time += subMarkerInterval) {
      if (time < 0) continue;
      // Skip if this is a main marker position
      if (time % markerInterval === 0) continue;
      result.push({
        time,
        x: time * pixelsPerSecond,
        isMain: false,
        label: "",
      });
    }

    return result.sort((a, b) => a.time - b.time);
  }, [duration, pixelsPerSecond, scrollLeft, width, markerInterval, subMarkerInterval]);

  /**
   * Handle click on ruler to seek
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!rulerRef.current || !onSeek) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const time = pixelsToTime(x, 1, pixelsPerSecond);
      const clampedTime = Math.max(0, Math.min(time, duration));

      onSeek(clampedTime);
    },
    [scrollLeft, pixelsPerSecond, duration, onSeek]
  );

  return (
    <div
      ref={rulerRef}
      className={cn(
        "relative h-8 bg-surface-2 border-b border-border select-none cursor-pointer",
        className
      )}
      onClick={handleClick}
      style={{ width: `${Math.max(duration * pixelsPerSecond, width)}px` }}
    >
      {markers.map((marker, index) => (
        <div
          key={`${marker.time}-${index}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${marker.x}px` }}
        >
          {/* Tick mark */}
          <div
            className={cn(
              "w-px bg-border",
              marker.isMain ? "h-3" : "h-1.5"
            )}
          />
          {/* Time label (only for main markers) */}
          {marker.isMain && (
            <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
              {marker.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
