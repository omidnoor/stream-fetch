"use client";

import { cn } from "@/lib/utils";
import type { EffectPresetsProps, EffectPreset } from "@/lib/editor/types";
import { EFFECT_PRESETS } from "@/lib/editor/utils";

/**
 * EffectPresets Component
 *
 * Grid of effect presets for quick application.
 */
export function EffectPresets({ onApplyPreset, className }: EffectPresetsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {EFFECT_PRESETS.map((preset) => (
        <PresetCard key={preset.id} preset={preset} onClick={() => onApplyPreset(preset)} />
      ))}
    </div>
  );
}

/**
 * Individual preset card
 */
function PresetCard({
  preset,
  onClick,
}: {
  preset: EffectPreset;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-2 rounded-lg border border-border",
        "hover:border-primary hover:bg-surface-2 transition-colors",
        "text-left group"
      )}
    >
      {/* Preview */}
      <div
        className="w-full h-12 rounded mb-2"
        style={{
          background: preset.preview || "linear-gradient(135deg, #333, #555)",
        }}
      />

      {/* Info */}
      <span className="text-sm font-medium group-hover:text-primary transition-colors">
        {preset.name}
      </span>
      <span className="text-xs text-muted-foreground line-clamp-1">
        {preset.description}
      </span>
    </button>
  );
}

/**
 * Compact preset selector for inline use
 */
export function PresetSelector({
  onSelect,
  className,
}: {
  onSelect: (preset: EffectPreset) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto pb-1", className)}>
      {EFFECT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs",
            "border border-border hover:border-primary",
            "hover:bg-surface-2 transition-colors"
          )}
          title={preset.description}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
