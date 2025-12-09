"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Wand2,
  Sun,
  Contrast,
  Palette,
  CircleDot,
  Droplets,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EffectSlider } from "./effect-slider";
import { EffectPresets } from "./effect-presets";
import { useEffects } from "@/hooks/useEffects";
import type { EffectsPanelProps, EffectType } from "@/lib/editor/types";
import { EFFECT_CONFIGS, getAvailableEffects } from "@/lib/editor/utils";

/**
 * Get icon for effect type
 */
function getEffectIcon(type: EffectType) {
  switch (type) {
    case "brightness":
      return Sun;
    case "contrast":
      return Contrast;
    case "saturation":
    case "hue":
    case "temperature":
      return Palette;
    case "blur":
    case "sharpen":
      return CircleDot;
    case "vignette":
      return Droplets;
    default:
      return Sparkles;
  }
}

/**
 * EffectsPanel Component
 *
 * Main panel for managing clip effects including adding,
 * removing, and adjusting effect parameters.
 */
export function EffectsPanel({
  clipId,
  projectId,
  onEffectChange,
  className,
}: EffectsPanelProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [addingEffect, setAddingEffect] = useState<EffectType | null>(null);

  const {
    effects,
    loading,
    error,
    addEffect,
    updateParam,
    toggleEffect,
    resetEffect,
    removeEffect,
    applyPreset,
    clearEffects,
    presets,
    effectConfigs,
  } = useEffects(projectId, clipId);

  /**
   * Handle adding a new effect
   */
  const handleAddEffect = useCallback(
    async (type: EffectType) => {
      setAddingEffect(type);
      try {
        await addEffect(type);
        onEffectChange?.(effects);
      } finally {
        setAddingEffect(null);
      }
    },
    [addEffect, effects, onEffectChange]
  );

  /**
   * Handle preset selection
   */
  const handleApplyPreset = useCallback(
    async (preset: (typeof presets)[0]) => {
      try {
        await applyPreset(preset);
        setShowPresets(false);
        onEffectChange?.(effects);
      } catch (error) {
        console.error("Failed to apply preset:", error);
      }
    },
    [applyPreset, effects, onEffectChange]
  );

  /**
   * Get available effects (not already added)
   */
  const availableEffects = getAvailableEffects().filter(
    (config) => !effects.some((e) => e.type === config.type)
  );

  if (!clipId) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a clip to add effects</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Effects
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Presets
          </Button>
          {effects.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={clearEffects}
              title="Clear all effects"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Presets panel */}
      {showPresets && (
        <div className="p-3 border-b border-border">
          <EffectPresets onApplyPreset={handleApplyPreset} />
        </div>
      )}

      {/* Add effect */}
      <div className="p-3 border-b border-border">
        <Select
          value=""
          onValueChange={(value) => handleAddEffect(value as EffectType)}
          disabled={availableEffects.length === 0 || !!addingEffect}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {addingEffect ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Add Effect</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableEffects.map((config) => {
              const Icon = getEffectIcon(config.type);
              return (
                <SelectItem key={config.type} value={config.type}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <div>
                      <span>{config.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {config.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
            {availableEffects.length === 0 && (
              <SelectItem value="none" disabled>
                All effects added
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Effects list */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading && effects.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : effects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No effects applied</p>
            <p className="text-xs mt-1">
              Add effects above or choose a preset
            </p>
          </div>
        ) : (
          effects.map((effect) => (
            <EffectSlider
              key={effect.id}
              effect={effect}
              config={effectConfigs[effect.type]}
              onParamChange={(key, value) => {
                updateParam(effect.id, key, value);
                onEffectChange?.(effects);
              }}
              onToggle={() => {
                toggleEffect(effect.id);
                onEffectChange?.(effects);
              }}
              onRemove={() => {
                removeEffect(effect.id);
                onEffectChange?.(effects);
              }}
              onReset={() => {
                resetEffect(effect.id);
                onEffectChange?.(effects);
              }}
            />
          ))
        )}
      </div>

      {/* Footer with effect count */}
      {effects.length > 0 && (
        <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
          {effects.filter((e) => e.enabled).length} of {effects.length} effects
          active
        </div>
      )}
    </div>
  );
}
