/**
 * useTransitionPreview Hook
 *
 * Generates CSS animations for transition previews.
 * Handles animation state, timing, and cleanup.
 */

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Transition, TransitionType } from "@/lib/editor/types";
import { getTransitionCssKeyframes, TRANSITION_CONFIGS } from "@/lib/editor/utils";

/**
 * Animation state for a transition preview
 */
interface TransitionAnimationState {
  /** Whether animation is playing */
  isPlaying: boolean;
  /** Current progress 0-1 */
  progress: number;
  /** Animation start timestamp */
  startTime: number | null;
}

/**
 * Hook return type
 */
interface UseTransitionPreviewReturn {
  /** CSS styles for the outgoing element */
  outgoingStyles: React.CSSProperties;
  /** CSS styles for the incoming element */
  incomingStyles: React.CSSProperties;
  /** CSS keyframes string to inject */
  keyframes: string;
  /** Animation state */
  animationState: TransitionAnimationState;
  /** Start preview animation */
  play: () => void;
  /** Stop and reset animation */
  stop: () => void;
  /** Pause animation */
  pause: () => void;
}

/**
 * Get CSS animation name based on transition type
 */
function getAnimationName(type: TransitionType): string {
  switch (type) {
    case "fade":
    case "crossfade":
      return "transition-fade";
    case "dissolve":
      return "transition-dissolve";
    case "wipeLeft":
    case "wipe":
      return "transition-wipe-left";
    case "wipeRight":
      return "transition-wipe-right";
    case "wipeUp":
      return "transition-wipe-up";
    case "wipeDown":
      return "transition-wipe-down";
    case "slideLeft":
    case "slide":
      return "transition-slide-left";
    case "slideRight":
      return "transition-slide-right";
    case "slideUp":
      return "transition-slide-up";
    case "slideDown":
      return "transition-slide-down";
    case "zoomIn":
    case "zoom":
      return "transition-zoom-in";
    case "zoomOut":
      return "transition-zoom-out";
    default:
      return "transition-fade";
  }
}

/**
 * useTransitionPreview hook
 */
export function useTransitionPreview(
  transition: Transition | null,
  autoPlay: boolean = false
): UseTransitionPreviewReturn {
  const [animationState, setAnimationState] = useState<TransitionAnimationState>({
    isPlaying: false,
    progress: 0,
    startTime: null,
  });

  const animationFrameRef = useRef<number | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Get duration in seconds
  const duration = transition ? transition.duration / 1000 : 0.5;
  const type = transition?.type ?? "fade";

  // Generate keyframes
  const keyframes = useMemo(() => {
    return getTransitionCssKeyframes(type);
  }, [type]);

  // Inject keyframes into document
  useEffect(() => {
    if (!keyframes) return;

    // Create or update style element
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = keyframes;

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [keyframes]);

  /**
   * Update animation progress
   */
  const updateProgress = useCallback(() => {
    if (!animationState.startTime) return;

    const elapsed = Date.now() - animationState.startTime;
    const progress = Math.min(elapsed / (duration * 1000), 1);

    setAnimationState((prev) => ({
      ...prev,
      progress,
      isPlaying: progress < 1,
    }));

    if (progress < 1) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [animationState.startTime, duration]);

  /**
   * Start animation
   */
  const play = useCallback(() => {
    setAnimationState({
      isPlaying: true,
      progress: 0,
      startTime: Date.now(),
    });
  }, []);

  /**
   * Stop animation
   */
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAnimationState({
      isPlaying: false,
      progress: 0,
      startTime: null,
    });
  }, []);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  // Update progress while playing
  useEffect(() => {
    if (animationState.isPlaying && animationState.startTime) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, animationState.startTime, updateProgress]);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && transition) {
      play();
    }
  }, [autoPlay, transition, play]);

  // Generate CSS styles based on animation state
  const outgoingStyles = useMemo((): React.CSSProperties => {
    if (!animationState.isPlaying) {
      return {};
    }

    const animationName = getAnimationName(type);

    return {
      animation: `${animationName} ${duration}s ease-in-out forwards`,
      animationPlayState: animationState.isPlaying ? "running" : "paused",
    };
  }, [animationState.isPlaying, type, duration]);

  const incomingStyles = useMemo((): React.CSSProperties => {
    if (!animationState.isPlaying) {
      return { opacity: 0 };
    }

    // Incoming element fades in as outgoing fades out
    return {
      opacity: animationState.progress,
      transition: "opacity linear",
    };
  }, [animationState.isPlaying, animationState.progress]);

  return {
    outgoingStyles,
    incomingStyles,
    keyframes,
    animationState,
    play,
    stop,
    pause,
  };
}

/**
 * Hook for multiple transition previews
 */
export function useTransitionPreviewMap(
  transitions: Transition[]
): Map<string, UseTransitionPreviewReturn> {
  const [previewMap, setPreviewMap] = useState<Map<string, UseTransitionPreviewReturn>>(
    new Map()
  );

  // This is a simplified version - in production you'd want more sophisticated state management
  useEffect(() => {
    // For now, just return empty map - individual components should use useTransitionPreview
  }, [transitions]);

  return previewMap;
}

/**
 * Generate inline preview styles without animation
 */
export function getTransitionPreviewStyles(
  type: TransitionType,
  progress: number
): { outgoing: React.CSSProperties; incoming: React.CSSProperties } {
  const p = Math.max(0, Math.min(1, progress));

  switch (type) {
    case "fade":
    case "crossfade":
      return {
        outgoing: { opacity: 1 - p },
        incoming: { opacity: p },
      };

    case "dissolve":
      return {
        outgoing: { opacity: 1 - p, filter: `blur(${p * 4}px)` },
        incoming: { opacity: p, filter: `blur(${(1 - p) * 4}px)` },
      };

    case "wipeLeft":
    case "wipe":
      return {
        outgoing: { clipPath: `inset(0 ${p * 100}% 0 0)` },
        incoming: { clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` },
      };

    case "wipeRight":
      return {
        outgoing: { clipPath: `inset(0 0 0 ${p * 100}%)` },
        incoming: { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` },
      };

    case "wipeUp":
      return {
        outgoing: { clipPath: `inset(${p * 100}% 0 0 0)` },
        incoming: { clipPath: `inset(0 0 ${(1 - p) * 100}% 0)` },
      };

    case "wipeDown":
      return {
        outgoing: { clipPath: `inset(0 0 ${p * 100}% 0)` },
        incoming: { clipPath: `inset(${(1 - p) * 100}% 0 0 0)` },
      };

    case "slideLeft":
    case "slide":
      return {
        outgoing: { transform: `translateX(${-p * 100}%)` },
        incoming: { transform: `translateX(${(1 - p) * 100}%)` },
      };

    case "slideRight":
      return {
        outgoing: { transform: `translateX(${p * 100}%)` },
        incoming: { transform: `translateX(${-(1 - p) * 100}%)` },
      };

    case "slideUp":
      return {
        outgoing: { transform: `translateY(${-p * 100}%)` },
        incoming: { transform: `translateY(${(1 - p) * 100}%)` },
      };

    case "slideDown":
      return {
        outgoing: { transform: `translateY(${p * 100}%)` },
        incoming: { transform: `translateY(${-(1 - p) * 100}%)` },
      };

    case "zoomIn":
    case "zoom":
      return {
        outgoing: { transform: `scale(${1 + p})`, opacity: 1 - p },
        incoming: { transform: `scale(${1 - (1 - p) * 0.5})`, opacity: p },
      };

    case "zoomOut":
      return {
        outgoing: { transform: `scale(${1 - p * 0.5})`, opacity: 1 - p },
        incoming: { transform: `scale(${0.5 + p * 0.5})`, opacity: p },
      };

    default:
      return {
        outgoing: { opacity: 1 - p },
        incoming: { opacity: p },
      };
  }
}
