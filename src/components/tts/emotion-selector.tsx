"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface EmotionSelectorProps {
  emotionVector: number[];
  emotionAlpha: number;
  onVectorChange: (vector: number[]) => void;
  onAlphaChange: (alpha: number) => void;
  className?: string;
}

const EMOTION_DIMENSIONS = [
  { name: "Happy", icon: "😊", color: "bg-yellow-500", index: 0 },
  { name: "Angry", icon: "😠", color: "bg-red-500", index: 1 },
  { name: "Sad", icon: "😢", color: "bg-blue-500", index: 2 },
  { name: "Afraid", icon: "😨", color: "bg-purple-500", index: 3 },
  { name: "Disgusted", icon: "🤢", color: "bg-green-600", index: 4 },
  { name: "Melancholic", icon: "😔", color: "bg-indigo-500", index: 5 },
  { name: "Surprised", icon: "😲", color: "bg-pink-500", index: 6 },
  { name: "Calm", icon: "😌", color: "bg-teal-500", index: 7 },
];

export function EmotionSelector({
  emotionVector,
  emotionAlpha,
  onVectorChange,
  onAlphaChange,
  className,
}: EmotionSelectorProps) {
  const handleDimensionChange = useCallback(
    (index: number, value: number) => {
      const newVector = [...emotionVector];
      newVector[index] = value;
      onVectorChange(newVector);
    },
    [emotionVector, onVectorChange]
  );

  const totalSum = emotionVector.reduce((a, b) => a + b, 0);
  const isOverLimit = totalSum > 1.5;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Emotion Intensity</label>
          <span className="text-sm text-muted-foreground">
            {Math.round(emotionAlpha * 100)}%
          </span>
        </div>
        <Slider
          value={[emotionAlpha]}
          onValueChange={(v) => onAlphaChange(v[0])}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          0% = speaker's natural emotion, 100% = full emotion control
        </p>
      </div>

      {/* Sum Indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Emotion Balance</span>
        <span
          className={cn(
            "font-mono",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {totalSum.toFixed(2)} / 1.50
        </span>
      </div>

      {/* Progress bar for sum */}
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-200 rounded-full",
            isOverLimit ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${Math.min((totalSum / 1.5) * 100, 100)}%` }}
        />
      </div>

      {/* Emotion Sliders */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Emotion Dimensions</h4>

        <div className="grid gap-3">
          {EMOTION_DIMENSIONS.map((emotion) => (
            <div key={emotion.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emotion.icon}</span>
                  <span className="text-sm">{emotion.name}</span>
                </div>
                <span className="text-sm text-muted-foreground font-mono w-12 text-right">
                  {emotionVector[emotion.index]?.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={cn("w-1 h-6 rounded-full", emotion.color)}
                  style={{
                    opacity: 0.3 + (emotionVector[emotion.index] || 0) * 0.7,
                  }}
                />
                <Slider
                  value={[emotionVector[emotion.index] || 0]}
                  onValueChange={(v) =>
                    handleDimensionChange(emotion.index, v[0])
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      {isOverLimit && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
          ⚠️ High emotion values may cause audio artifacts. Consider reducing
          some dimensions.
        </div>
      )}
    </div>
  );
}
