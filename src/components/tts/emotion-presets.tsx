"use client";

import { cn } from "@/lib/utils";

interface EmotionPresetsProps {
  selectedPreset: string | null;
  onPresetSelect: (preset: string, vector: number[]) => void;
  className?: string;
}

const PRESET_DATA: {
  name: string;
  icon: string;
  vector: number[];
  color: string;
}[] = [
  { name: "happy", icon: "😊", vector: [1.0, 0, 0, 0, 0, 0, 0, 0], color: "bg-yellow-500/20 border-yellow-500/50" },
  { name: "sad", icon: "😢", vector: [0, 0, 1.0, 0, 0, 0, 0, 0], color: "bg-blue-500/20 border-blue-500/50" },
  { name: "angry", icon: "😠", vector: [0, 1.0, 0, 0, 0, 0, 0, 0], color: "bg-red-500/20 border-red-500/50" },
  { name: "afraid", icon: "😨", vector: [0, 0, 0, 1.0, 0, 0, 0, 0], color: "bg-purple-500/20 border-purple-500/50" },
  { name: "surprised", icon: "😲", vector: [0, 0, 0, 0, 0, 0, 1.0, 0], color: "bg-pink-500/20 border-pink-500/50" },
  { name: "calm", icon: "😌", vector: [0, 0, 0, 0, 0, 0, 0, 1.0], color: "bg-green-500/20 border-green-500/50" },
  { name: "excited", icon: "🤩", vector: [0.8, 0, 0, 0, 0, 0, 0.3, 0], color: "bg-orange-500/20 border-orange-500/50" },
  { name: "neutral", icon: "😐", vector: [0, 0, 0, 0, 0, 0, 0, 0], color: "bg-gray-500/20 border-gray-500/50" },
];

export function EmotionPresets({
  selectedPreset,
  onPresetSelect,
  className,
}: EmotionPresetsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Quick Presets</h4>
        {selectedPreset && (
          <span className="text-xs text-muted-foreground capitalize">
            Selected: {selectedPreset}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {PRESET_DATA.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onPresetSelect(preset.name, preset.vector)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
              "hover:scale-105 active:scale-95",
              selectedPreset === preset.name
                ? preset.color + " border-2"
                : "bg-surface-2 border-border hover:border-muted-foreground"
            )}
          >
            <span className="text-2xl">{preset.icon}</span>
            <span className="text-xs capitalize">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
