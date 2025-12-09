"use client";

import { useCallback, useMemo } from "react";
import {
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { EffectSliderProps } from "@/lib/editor/types";
import { isEffectModified } from "@/lib/editor/utils";
import { useState } from "react";

/**
 * EffectSlider Component
 *
 * Individual effect control with parameter sliders,
 * enable/disable toggle, reset, and remove actions.
 */
export function EffectSlider({
  effect,
  config,
  onParamChange,
  onToggle,
  onRemove,
  onReset,
  className,
}: EffectSliderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isModified = useMemo(() => isEffectModified(effect), [effect]);

  /**
   * Handle slider change with debounce-friendly callback
   */
  const handleParamChange = useCallback(
    (key: string) => (values: number[]) => {
      onParamChange(key, values[0]);
    },
    [onParamChange]
  );

  return (
    <div
      className={cn(
        "border rounded-lg bg-surface-1 transition-opacity",
        !effect.enabled && "opacity-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        {/* Drag handle */}
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Effect name */}
        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-medium text-sm">{config.name}</span>
          {isModified && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggle}
            title={effect.enabled ? "Disable effect" : "Enable effect"}
          >
            {effect.enabled ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onReset}
            disabled={!isModified}
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
            title="Remove effect"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Parameters */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {config.params.map((param) => (
            <div key={param.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  {param.label}
                </Label>
                <span className="text-xs font-mono">
                  {effect.params[param.key]?.toFixed(param.step < 1 ? 1 : 0)}
                  {param.unit}
                </span>
              </div>
              <Slider
                value={[effect.params[param.key] ?? param.default]}
                min={param.min}
                max={param.max}
                step={param.step}
                onValueChange={handleParamChange(param.key)}
                disabled={!effect.enabled}
              />
            </div>
          ))}

          {config.params.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No adjustable parameters
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact effect indicator for timeline clips
 */
export function EffectIndicator({
  effectCount,
  onClick,
  className,
}: {
  effectCount: number;
  onClick?: () => void;
  className?: string;
}) {
  if (effectCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
        "bg-primary/20 text-primary hover:bg-primary/30 transition-colors",
        className
      )}
    >
      <span className="font-medium">fx</span>
      <span>{effectCount}</span>
    </button>
  );
}
