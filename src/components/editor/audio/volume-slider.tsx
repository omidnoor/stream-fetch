/**
 * VolumeSlider Component
 *
 * Professional audio volume control with dB display,
 * mute toggle, and visual level indicators.
 */

"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { VolumeSliderProps } from "@/lib/editor/types";
import { formatVolumeDb, formatVolumePercent, volumeToDb } from "@/lib/editor/utils";

export function VolumeSlider({
  value,
  onChange,
  muted = false,
  onMuteToggle,
  orientation = "horizontal",
  showDb = true,
  className,
}: VolumeSliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  const getVolumeColor = (vol: number): string => {
    const db = volumeToDb(vol);
    if (muted || vol === 0) return "text-gray-400";
    if (db > 6) return "text-red-500"; // Clipping warning
    if (db > 0) return "text-yellow-500"; // Boost warning
    return "text-green-500"; // Normal
  };

  return (
    <div
      className={cn(
        "flex gap-2",
        orientation === "vertical" ? "flex-col items-center" : "items-center",
        className
      )}
    >
      {/* Mute button */}
      {onMuteToggle && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMuteToggle}
          className={cn("h-8 w-8", muted && "text-red-500")}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted || value === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Slider */}
      <div className={cn("flex-1", orientation === "vertical" ? "h-32" : "min-w-24")}>
        <Slider
          min={0}
          max={2}
          step={0.01}
          value={[muted ? 0 : value]}
          onValueChange={handleValueChange}
          orientation={orientation}
          className="w-full"
          disabled={muted}
        />
      </div>

      {/* Volume display */}
      <div
        className={cn(
          "text-xs tabular-nums font-medium min-w-16 text-center",
          getVolumeColor(value)
        )}
      >
        {showDb ? formatVolumeDb(muted ? 0 : value) : formatVolumePercent(muted ? 0 : value)}
      </div>
    </div>
  );
}

/**
 * Compact volume slider (no labels)
 */
interface CompactVolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  muted?: boolean;
  onMuteToggle?: () => void;
  className?: string;
}

export function CompactVolumeSlider({
  value,
  onChange,
  muted = false,
  onMuteToggle,
  className,
}: CompactVolumeSliderProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {onMuteToggle && (
        <button
          onClick={onMuteToggle}
          className={cn(
            "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            muted && "text-red-500"
          )}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted || value === 0 ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </button>
      )}

      <Slider
        min={0}
        max={2}
        step={0.01}
        value={[muted ? 0 : value]}
        onValueChange={(values) => onChange(values[0])}
        className="flex-1 min-w-16"
        disabled={muted}
      />
    </div>
  );
}

/**
 * Volume level meter (visual indicator only)
 */
interface VolumeMeterProps {
  value: number;
  muted?: boolean;
  height?: number;
  className?: string;
}

export function VolumeMeter({
  value,
  muted = false,
  height = 80,
  className,
}: VolumeMeterProps) {
  const normalizedValue = Math.min(1, value / 2); // 0-2 -> 0-1
  const db = volumeToDb(value);

  const getSegmentColor = (segment: number): string => {
    const segmentDb = segment * 12 - 60; // Map to dB range
    if (muted) return "bg-gray-300 dark:bg-gray-700";
    if (db < segmentDb) return "bg-gray-300 dark:bg-gray-700";
    if (segmentDb > 0) return "bg-red-500";
    if (segmentDb > -6) return "bg-yellow-500";
    return "bg-green-500";
  };

  const segments = 20;

  return (
    <div className={cn("flex flex-col-reverse gap-px", className)} style={{ height }}>
      {Array.from({ length: segments }).map((_, i) => {
        const segmentThreshold = i / segments;
        return (
          <div
            key={i}
            className={cn(
              "w-full h-full rounded-sm transition-colors",
              getSegmentColor(segmentThreshold)
            )}
          />
        );
      })}
    </div>
  );
}
