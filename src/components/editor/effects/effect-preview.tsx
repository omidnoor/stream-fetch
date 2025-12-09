"use client";

import { cn } from "@/lib/utils";
import type { EffectPreviewProps } from "@/lib/editor/types";
import { useEffectPreview } from "@/hooks/useEffectPreview";

/**
 * EffectPreview Component
 *
 * Wrapper that applies CSS filters to preview effects on children.
 * Used to preview effects on video/image elements without re-encoding.
 */
export function EffectPreview({
  effects,
  children,
  className,
}: EffectPreviewProps) {
  const { style, vignetteOverlay } = useEffectPreview(effects);

  return (
    <div className={cn("relative", className)}>
      {/* Content with filter applied */}
      <div style={style} className="w-full h-full">
        {children}
      </div>

      {/* Vignette overlay (CSS filters don't support vignette) */}
      {vignetteOverlay && <div style={vignetteOverlay} />}
    </div>
  );
}

/**
 * Before/After comparison slider for effects
 */
export function EffectComparison({
  effects,
  children,
  className,
}: EffectPreviewProps & { splitPosition?: number }) {
  const { style } = useEffectPreview(effects);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Before (no effects) */}
      <div className="absolute inset-0 w-1/2 overflow-hidden">
        {children}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
          Before
        </div>
      </div>

      {/* After (with effects) */}
      <div className="absolute inset-0 left-1/2 w-1/2 overflow-hidden">
        <div style={{ ...style, marginLeft: "-100%" }} className="w-[200%] h-full">
          {children}
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
          After
        </div>
      </div>

      {/* Divider */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80 shadow-lg" />
    </div>
  );
}

/**
 * Effect intensity indicator badge
 */
export function EffectIntensityBadge({
  effects,
  className,
}: {
  effects: EffectPreviewProps["effects"];
  className?: string;
}) {
  const enabledCount = effects.filter((e) => e.enabled).length;

  if (enabledCount === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-primary/20 text-primary text-xs font-medium",
        className
      )}
    >
      <span>fx</span>
      <span>{enabledCount}</span>
    </div>
  );
}
