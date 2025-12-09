"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { clamp } from "@/lib/editor/utils";

interface UsePlaybackOptions {
  /** Total duration of the timeline */
  duration: number;
  /** Current playhead time */
  currentTime: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Playback speed multiplier */
  playbackRate: number;
  /** Callback when time changes */
  onTimeChange: (time: number) => void;
  /** Callback when playback state changes */
  onPlayingChange?: (isPlaying: boolean) => void;
  /** Whether to loop at the end */
  loop?: boolean;
  /** Frame rate for playback updates (default: 60) */
  frameRate?: number;
}

/**
 * usePlayback Hook
 *
 * Manages playback timing and synchronization using requestAnimationFrame.
 * This hook handles the timing loop that updates the playhead position
 * during playback.
 */
export function usePlayback({
  duration,
  currentTime,
  isPlaying,
  playbackRate,
  onTimeChange,
  onPlayingChange,
  loop = false,
  frameRate = 60,
}: UsePlaybackOptions) {
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Track external player sync state
  const [isSeeking, setIsSeeking] = useState(false);
  const [externalTime, setExternalTime] = useState<number | null>(null);

  // Frame interval in ms
  const frameInterval = 1000 / frameRate;

  /**
   * Main animation loop using requestAnimationFrame
   */
  const tick = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Accumulate time and only update at frame rate intervals
      accumulatedTimeRef.current += deltaMs;

      if (accumulatedTimeRef.current >= frameInterval) {
        // Calculate time increment based on playback rate
        const timeIncrement =
          (accumulatedTimeRef.current / 1000) * playbackRate;
        accumulatedTimeRef.current = 0;

        const newTime = currentTime + timeIncrement;

        // Handle end of timeline
        if (newTime >= duration) {
          if (loop) {
            onTimeChange(0);
          } else {
            onTimeChange(duration);
            onPlayingChange?.(false);
            return; // Stop the animation loop
          }
        } else {
          onTimeChange(newTime);
        }
      }

      // Continue animation loop if still playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(tick);
      }
    },
    [
      currentTime,
      duration,
      isPlaying,
      playbackRate,
      loop,
      frameInterval,
      onTimeChange,
      onPlayingChange,
    ]
  );

  /**
   * Start/stop animation loop based on playing state
   */
  useEffect(() => {
    if (isPlaying && !isSeeking) {
      lastTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(tick);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, isSeeking, tick]);

  /**
   * Seek to a specific time
   */
  const seekTo = useCallback(
    (time: number) => {
      setIsSeeking(true);
      const clampedTime = clamp(time, 0, duration);
      onTimeChange(clampedTime);
      // Small delay to allow UI to update before resuming playback
      setTimeout(() => setIsSeeking(false), 50);
    },
    [duration, onTimeChange]
  );

  /**
   * Skip forward by a number of seconds
   */
  const skipForward = useCallback(
    (seconds: number = 5) => {
      seekTo(currentTime + seconds);
    },
    [currentTime, seekTo]
  );

  /**
   * Skip backward by a number of seconds
   */
  const skipBackward = useCallback(
    (seconds: number = 5) => {
      seekTo(currentTime - seconds);
    },
    [currentTime, seekTo]
  );

  /**
   * Go to the start
   */
  const goToStart = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  /**
   * Go to the end
   */
  const goToEnd = useCallback(() => {
    seekTo(duration);
  }, [duration, seekTo]);

  /**
   * Sync with external video player time
   */
  const syncWithPlayer = useCallback(
    (playerTime: number) => {
      setExternalTime(playerTime);

      // Only sync if difference is significant (>100ms)
      const timeDiff = Math.abs(playerTime - currentTime);
      if (timeDiff > 0.1) {
        onTimeChange(playerTime);
      }
    },
    [currentTime, onTimeChange]
  );

  /**
   * Get progress as a percentage (0-1)
   */
  const getProgress = useCallback(() => {
    if (duration <= 0) return 0;
    return currentTime / duration;
  }, [currentTime, duration]);

  /**
   * Set progress as a percentage (0-1)
   */
  const setProgress = useCallback(
    (progress: number) => {
      const time = clamp(progress, 0, 1) * duration;
      seekTo(time);
    },
    [duration, seekTo]
  );

  return {
    // State
    isSeeking,
    externalTime,

    // Methods
    seekTo,
    skipForward,
    skipBackward,
    goToStart,
    goToEnd,
    syncWithPlayer,
    getProgress,
    setProgress,
  };
}

export type UsePlaybackReturn = ReturnType<typeof usePlayback>;
