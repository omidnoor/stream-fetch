/**
 * TransitionPicker Component
 *
 * UI for selecting and configuring transition types.
 * Shows a grid of available transitions with previews and duration slider.
 */

"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { TransitionPickerProps, TransitionType } from "@/lib/editor/types";
import { TRANSITION_CONFIGS, getBasicTransitions } from "@/lib/editor/utils";

/**
 * Single transition type card
 */
interface TransitionTypeCardProps {
  type: TransitionType;
  isSelected: boolean;
  onSelect: () => void;
}

function TransitionTypeCard({
  type,
  isSelected,
  onSelect,
}: TransitionTypeCardProps) {
  const config = TRANSITION_CONFIGS[type];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-lg",
        "border-2 transition-all duration-200",
        "hover:shadow-md",
        isSelected
          ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {/* Visual preview */}
      <div className="w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded overflow-hidden">
        {/* Animated preview placeholder */}
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          {config.name}
        </div>
      </div>

      {/* Name */}
      <div className="text-sm font-medium text-center">{config.name}</div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

/**
 * TransitionPicker component
 */
export function TransitionPicker({
  selectedType,
  duration = 500,
  onSelect,
  onDurationChange,
  onClose,
  className,
}: TransitionPickerProps) {
  const [localDuration, setLocalDuration] = useState(duration);

  // Get basic transitions (no directional variants)
  const transitions = getBasicTransitions();

  const handleDurationChange = (values: number[]) => {
    const newDuration = values[0];
    setLocalDuration(newDuration);
    onDurationChange?.(newDuration);
  };

  return (
    <div className={cn("w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg border", className)}>
      {/* Header */}
      <div className="flex flex-row items-start justify-between p-6 border-b">
        <div>
          <h3 className="text-lg font-semibold">Select Transition</h3>
          <p className="text-sm text-muted-foreground">
            Choose a transition effect between clips
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Transition grid */}
        <div className="grid grid-cols-3 gap-4">
          {transitions.map((config) => (
            <TransitionTypeCard
              key={config.type}
              type={config.type}
              isSelected={selectedType === config.type}
              onSelect={() => onSelect(config.type)}
            />
          ))}
        </div>

        {/* Duration slider */}
        {selectedType && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">Duration</Label>
              <span className="text-sm text-muted-foreground">
                {(localDuration / 1000).toFixed(1)}s
              </span>
            </div>
            <Slider
              id="duration"
              min={100}
              max={3000}
              step={100}
              value={[localDuration]}
              onValueChange={handleDurationChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1s</span>
              <span>3.0s</span>
            </div>
          </div>
        )}

        {/* Selected transition info */}
        {selectedType && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-1">
              {TRANSITION_CONFIGS[selectedType].name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {TRANSITION_CONFIGS[selectedType].description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact transition type selector (dropdown style)
 */
interface TransitionTypeSelectorProps {
  value: TransitionType;
  onChange: (type: TransitionType) => void;
  className?: string;
}

export function TransitionTypeSelector({
  value,
  onChange,
  className,
}: TransitionTypeSelectorProps) {
  const transitions = getBasicTransitions();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TransitionType)}
      className={cn(
        "w-full px-3 py-2 rounded-md border border-input bg-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {transitions.map((config) => (
        <option key={config.type} value={config.type}>
          {config.name}
        </option>
      ))}
    </select>
  );
}
