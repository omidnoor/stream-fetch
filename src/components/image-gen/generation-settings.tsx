"use client";

import { useState } from "react";
import {
  Settings2,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ASPECT_RATIOS,
  GEMINI_MODELS,
  AspectRatio,
  GeminiModel,
} from "@/lib/gemini-helper";

interface GenerationSettingsProps {
  model: GeminiModel;
  aspectRatio: AspectRatio;
  numberOfImages: number;
  onModelChange: (model: GeminiModel) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onNumberOfImagesChange: (count: number) => void;
}

// Aspect ratio visual preview dimensions
const ASPECT_PREVIEW: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 24, h: 24 },
  "16:9": { w: 32, h: 18 },
  "9:16": { w: 18, h: 32 },
  "4:3": { w: 28, h: 21 },
  "3:4": { w: 21, h: 28 },
  "3:2": { w: 30, h: 20 },
  "2:3": { w: 20, h: 30 },
  "4:5": { w: 24, h: 30 },
  "5:4": { w: 30, h: 24 },
  "21:9": { w: 36, h: 15 },
};

export function GenerationSettings({
  model,
  aspectRatio,
  numberOfImages,
  onModelChange,
  onAspectRatioChange,
  onNumberOfImagesChange,
}: GenerationSettingsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("model");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Settings2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Run Settings</span>
      </div>

      {/* Model Selection */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("model")}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Model</span>
          </div>
          {expandedSection === "model" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "model" && (
          <div className="px-3 pb-3 space-y-2">
            {GEMINI_MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => onModelChange(m.value)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  model === m.value
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-surface-1 hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-1.5 rounded-md ${
                      model === m.value ? "bg-primary/20" : "bg-surface-3"
                    }`}
                  >
                    {m.value.includes("flash") ? (
                      <Zap className={`h-4 w-4 ${model === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    ) : (
                      <Sparkles className={`h-4 w-4 ${model === m.value ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${model === m.value ? "text-primary" : ""}`}>
                        {m.label}
                      </span>
                      {m.value.includes("flash") && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-feature-2/20 text-feature-2 rounded">
                          FAST
                        </span>
                      )}
                      {m.value.includes("pro") && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-feature-3/20 text-feature-3 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aspect Ratio */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("aspect")}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-current rounded-sm" />
            <span className="text-sm font-medium">Aspect Ratio</span>
            <span className="text-xs text-muted-foreground">({aspectRatio})</span>
          </div>
          {expandedSection === "aspect" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "aspect" && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((r) => {
                const preview = ASPECT_PREVIEW[r.value];
                const isSelected = aspectRatio === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => onAspectRatioChange(r.value)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary"
                        : "hover:bg-surface-2"
                    }`}
                    title={r.label}
                  >
                    <div
                      className={`border-2 rounded-sm transition-colors ${
                        isSelected ? "border-primary bg-primary/20" : "border-muted-foreground/50"
                      }`}
                      style={{
                        width: `${preview.w}px`,
                        height: `${preview.h}px`,
                      }}
                    />
                    <span className={`text-[10px] font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      {r.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Number of Images */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggleSection("count")}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-current rounded-sm" />
              <div className="bg-current rounded-sm opacity-50" />
              <div className="bg-current rounded-sm opacity-50" />
              <div className="bg-current rounded-sm opacity-50" />
            </div>
            <span className="text-sm font-medium">Images</span>
            <span className="text-xs text-muted-foreground">({numberOfImages})</span>
          </div>
          {expandedSection === "count" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "count" && (
          <div className="px-3 pb-3 space-y-3">
            <div className="flex items-center gap-3">
              <Slider
                value={[numberOfImages]}
                onValueChange={([v]) => onNumberOfImagesChange(v)}
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-center text-sm font-medium bg-surface-2 rounded px-2 py-1">
                {numberOfImages}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Options Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/30">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-info mb-1">Pro Tips</p>
          <ul className="space-y-0.5">
            <li>• Be specific about style and composition</li>
            <li>• Use Flash for quick iterations</li>
            <li>• Pro model supports 4K output</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
