/**
 * TransformPanel Component
 *
 * Control panel for clip transformations including scale, rotation, position, crop, and flip.
 */

"use client";

import React from "react";
import { RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { TransformPanelProps } from "@/lib/editor/types";

export function TransformPanel({
  clipId,
  projectId,
  transform,
  onChange,
  videoDimensions,
  className,
}: TransformPanelProps) {
  const handleScaleChange = (values: number[]) => {
    onChange({ ...transform, scale: values[0] });
  };

  const handleRotationChange = (values: number[]) => {
    onChange({ ...transform, rotation: values[0] });
  };

  const handleFlipH = () => {
    onChange({ ...transform, flipH: !transform.flipH });
  };

  const handleFlipV = () => {
    onChange({ ...transform, flipV: !transform.flipV });
  };

  const handleReset = () => {
    onChange({
      ...transform,
      scale: 1.0,
      rotation: 0,
      position: { x: 0, y: 0 },
      crop: { top: 0, right: 0, bottom: 0, left: 0 },
      flipH: false,
      flipV: false,
    });
  };

  return (
    <div className={cn("space-y-6 p-4", className)}>
      {/* Scale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Scale</Label>
          <span className="text-sm text-muted-foreground">
            {(transform.scale * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          min={0.1}
          max={3}
          step={0.01}
          value={[transform.scale]}
          onValueChange={handleScaleChange}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Rotation</Label>
          <span className="text-sm text-muted-foreground">
            {transform.rotation}°
          </span>
        </div>
        <Slider
          min={0}
          max={360}
          step={1}
          value={[transform.rotation]}
          onValueChange={handleRotationChange}
        />
      </div>

      {/* Crop */}
      <div className="space-y-2">
        <Label>Crop</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Top</Label>
            <Slider
              min={0}
              max={videoDimensions?.height || 1080}
              value={[transform.crop.top]}
              onValueChange={(values) =>
                onChange({
                  ...transform,
                  crop: { ...transform.crop, top: values[0] },
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Bottom</Label>
            <Slider
              min={0}
              max={videoDimensions?.height || 1080}
              value={[transform.crop.bottom]}
              onValueChange={(values) =>
                onChange({
                  ...transform,
                  crop: { ...transform.crop, bottom: values[0] },
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Left</Label>
            <Slider
              min={0}
              max={videoDimensions?.width || 1920}
              value={[transform.crop.left]}
              onValueChange={(values) =>
                onChange({
                  ...transform,
                  crop: { ...transform.crop, left: values[0] },
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Right</Label>
            <Slider
              min={0}
              max={videoDimensions?.width || 1920}
              value={[transform.crop.right]}
              onValueChange={(values) =>
                onChange({
                  ...transform,
                  crop: { ...transform.crop, right: values[0] },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Flip buttons */}
      <div className="space-y-2">
        <Label>Flip</Label>
        <div className="flex gap-2">
          <Button
            variant={transform.flipH ? "default" : "outline"}
            size="sm"
            onClick={handleFlipH}
            className="flex-1"
          >
            <FlipHorizontal className="h-4 w-4 mr-2" />
            Horizontal
          </Button>
          <Button
            variant={transform.flipV ? "default" : "outline"}
            size="sm"
            onClick={handleFlipV}
            className="flex-1"
          >
            <FlipVertical className="h-4 w-4 mr-2" />
            Vertical
          </Button>
        </div>
      </div>

      {/* Reset */}
      <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset Transform
      </Button>
    </div>
  );
}
