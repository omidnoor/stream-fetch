/**
 * TransitionPreview Component
 *
 * Animated preview of a transition between two clips.
 * Shows before/after thumbnails with CSS animation.
 */

"use client";

import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TransitionPreviewProps } from "@/lib/editor/types";
import {
  useTransitionPreview,
  getTransitionPreviewStyles,
} from "@/hooks/useTransitionPreview";

export function TransitionPreview({
  transition,
  fromThumbnail,
  toThumbnail,
  width = 320,
  height = 180,
  autoPlay = false,
  className,
}: TransitionPreviewProps) {
  const { outgoingStyles, incomingStyles, animationState, play, stop, pause } =
    useTransitionPreview(transition, autoPlay);

  const [manualProgress, setManualProgress] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);

  // Reset manual mode when animation plays
  useEffect(() => {
    if (animationState.isPlaying) {
      setIsManualMode(false);
    }
  }, [animationState.isPlaying]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    setManualProgress(progress);
    setIsManualMode(true);
    stop();
  };

  const handlePlayPause = () => {
    if (animationState.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleReset = () => {
    stop();
    setManualProgress(0);
    setIsManualMode(false);
  };

  // Get styles based on mode
  const currentProgress = isManualMode
    ? manualProgress
    : animationState.progress;
  const previewStyles = isManualMode
    ? getTransitionPreviewStyles(transition.type, manualProgress)
    : { outgoing: outgoingStyles, incoming: incomingStyles };

  return (
    <div className={cn("space-y-4", className)} style={{ width }}>
      {/* Preview area */}
      <div
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ width, height }}
      >
        {/* Outgoing clip */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={previewStyles.outgoing}
        >
          {fromThumbnail ? (
            <img
              src={fromThumbnail}
              alt="From clip"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              Clip A
            </div>
          )}
        </div>

        {/* Incoming clip */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={previewStyles.incoming}
        >
          {toThumbnail ? (
            <img
              src={toThumbnail}
              alt="To clip"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
              Clip B
            </div>
          )}
        </div>

        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${currentProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="flex-shrink-0"
          >
            {animationState.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Progress slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={currentProgress}
            onChange={handleProgressChange}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
          />

          <span className="text-sm text-muted-foreground tabular-nums min-w-[3rem] text-right">
            {(currentProgress * 100).toFixed(0)}%
          </span>
        </div>

        {/* Transition info */}
        <div className="text-xs text-muted-foreground text-center">
          {transition.type} • {(transition.duration / 1000).toFixed(1)}s
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified preview without controls (for thumbnails/grids)
 */
interface TransitionPreviewThumbnailProps {
  transition: TransitionPreviewProps["transition"];
  size?: number;
  progress?: number;
  className?: string;
}

export function TransitionPreviewThumbnail({
  transition,
  size = 80,
  progress = 0.5,
  className,
}: TransitionPreviewThumbnailProps) {
  const styles = getTransitionPreviewStyles(transition.type, progress);

  return (
    <div
      className={cn(
        "relative bg-gray-900 rounded overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Outgoing */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500"
        style={styles.outgoing}
      />

      {/* Incoming */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-500"
        style={styles.incoming}
      />
    </div>
  );
}

/**
 * Before/After comparison view
 */
interface TransitionComparisonProps {
  fromThumbnail?: string;
  toThumbnail?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function TransitionComparison({
  fromThumbnail,
  toThumbnail,
  width = 320,
  height = 180,
  className,
}: TransitionComparisonProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {/* Before */}
      <div className="flex-1 space-y-1">
        <div className="text-xs text-muted-foreground text-center">Before</div>
        <div
          className="bg-gray-900 rounded overflow-hidden"
          style={{ height }}
        >
          {fromThumbnail ? (
            <img
              src={fromThumbnail}
              alt="Before"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              Clip A
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center">
        <svg
          className="w-6 h-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>

      {/* After */}
      <div className="flex-1 space-y-1">
        <div className="text-xs text-muted-foreground text-center">After</div>
        <div
          className="bg-gray-900 rounded overflow-hidden"
          style={{ height }}
        >
          {toThumbnail ? (
            <img
              src={toThumbnail}
              alt="After"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
              Clip B
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
