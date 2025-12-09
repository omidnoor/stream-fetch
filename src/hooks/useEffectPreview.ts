/**
 * useEffectPreview Hook
 *
 * Generates CSS filter strings for real-time effect preview.
 * Provides vignette overlay and combined effect styling.
 */

"use client";

import { useMemo, useCallback } from "react";
import type { ClipEffect } from "@/lib/editor/types";
import { generateCssFilter, effectValueToCss, EFFECT_CONFIGS } from "@/lib/editor/utils";

/**
 * Preview style output
 */
export interface EffectPreviewStyle {
  /** CSS filter string for video/image element */
  filter: string;
  /** Vignette overlay style (if vignette effect present) */
  vignetteOverlay?: React.CSSProperties;
  /** Combined style object for easy application */
  style: React.CSSProperties;
}

/**
 * Hook for generating CSS preview styles from effects
 */
export function useEffectPreview(effects: ClipEffect[]): EffectPreviewStyle {
  /**
   * Generate CSS filter string
   */
  const filter = useMemo(() => {
    return generateCssFilter(effects);
  }, [effects]);

  /**
   * Generate vignette overlay if present
   */
  const vignetteOverlay = useMemo((): React.CSSProperties | undefined => {
    const vignetteEffect = effects.find(
      (e) => e.type === "vignette" && e.enabled
    );

    if (!vignetteEffect) return undefined;

    const intensity = (vignetteEffect.params.intensity ?? 50) / 100;
    const radius = (vignetteEffect.params.radius ?? 50) / 100;

    // Calculate vignette gradient
    const innerRadius = Math.max(0.1, radius - intensity * 0.3);
    const outerRadius = Math.min(1, radius + 0.2);

    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center,
        transparent ${innerRadius * 100}%,
        rgba(0,0,0,${intensity * 0.8}) ${outerRadius * 100}%)`,
    };
  }, [effects]);

  /**
   * Combined style object
   */
  const style = useMemo((): React.CSSProperties => {
    return {
      filter: filter || undefined,
    };
  }, [filter]);

  return {
    filter,
    vignetteOverlay,
    style,
  };
}

/**
 * Hook for previewing a single effect
 */
export function useSingleEffectPreview(
  type: ClipEffect["type"],
  params: Record<string, number>,
  enabled: boolean = true
): string {
  return useMemo(() => {
    if (!enabled) return "";

    const config = EFFECT_CONFIGS[type];
    if (!config.cssFilter) return "";

    const value = effectValueToCss(type, params);

    switch (type) {
      case "brightness":
      case "contrast":
        return `${config.cssFilter}(${value})`;
      case "saturation":
        return `saturate(${value})`;
      case "blur":
        return value > 0 ? `blur(${value}px)` : "";
      case "grayscale":
      case "sepia":
        return `${config.cssFilter}(${value * 100}%)`;
      case "hue":
        return `hue-rotate(${value}deg)`;
      case "fade":
        return `opacity(${value})`;
      default:
        return "";
    }
  }, [type, params, enabled]);
}

/**
 * Hook for generating preview thumbnails with effects
 */
export function useEffectPreviewThumbnail(
  effects: ClipEffect[],
  thumbnailUrl?: string
): React.CSSProperties {
  const { filter } = useEffectPreview(effects);

  return useMemo((): React.CSSProperties => {
    return {
      backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: filter || undefined,
    };
  }, [thumbnailUrl, filter]);
}

/**
 * Calculate combined effect intensity for UI indicators
 */
export function useEffectIntensity(effects: ClipEffect[]): number {
  return useMemo(() => {
    const enabledEffects = effects.filter((e) => e.enabled);
    if (enabledEffects.length === 0) return 0;

    let totalIntensity = 0;
    let count = 0;

    for (const effect of enabledEffects) {
      const config = EFFECT_CONFIGS[effect.type];

      for (const paramConfig of config.params) {
        const value = effect.params[paramConfig.key] ?? paramConfig.default;
        const range = paramConfig.max - paramConfig.min;
        const normalized = Math.abs(value - paramConfig.default) / (range / 2);
        totalIntensity += Math.min(1, normalized);
        count++;
      }
    }

    return count > 0 ? totalIntensity / count : 0;
  }, [effects]);
}

/**
 * Get effect comparison styles (before/after split view)
 */
export function useEffectComparison(effects: ClipEffect[]): {
  beforeStyle: React.CSSProperties;
  afterStyle: React.CSSProperties;
} {
  const { style: afterStyle } = useEffectPreview(effects);

  return useMemo(
    () => ({
      beforeStyle: {},
      afterStyle,
    }),
    [afterStyle]
  );
}
