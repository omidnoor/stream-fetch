/**
 * Annotation Properties Component
 *
 * Allows users to configure annotation tool properties
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnnotations } from '@/lib/pdf/annotations';
import { AnnotationType } from '@/lib/pdf/annotations/types';

export function AnnotationProperties() {
  const { activeTool, toolConfig, updateToolConfig } = useAnnotations();

  if (!activeTool) {
    return (
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Select an annotation tool to configure properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white mb-4">Tool Properties</h3>

      {/* Text Tool Properties */}
      {activeTool === AnnotationType.TEXT && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="font-size" className="text-foreground text-xs">
              Font Size
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                id="font-size"
                min={8}
                max={72}
                step={1}
                value={[toolConfig.fontSize || 16]}
                onValueChange={([value]) => updateToolConfig({ fontSize: value })}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {toolConfig.fontSize || 16}px
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="font-family" className="text-foreground text-xs">
              Font Family
            </Label>
            <Select
              value={toolConfig.fontFamily || 'Arial'}
              onValueChange={(value) => updateToolConfig({ fontFamily: value })}
            >
              <SelectTrigger className="mt-1 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="font-weight" className="text-foreground text-xs">
              Font Weight
            </Label>
            <Select
              value={toolConfig.fontWeight || 'normal'}
              onValueChange={(value: 'normal' | 'bold') =>
                updateToolConfig({ fontWeight: value })
              }
            >
              <SelectTrigger className="mt-1 bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="text-color" className="text-foreground text-xs">
              Text Color
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="text-color"
                type="color"
                value={toolConfig.textColor || '#000000'}
                onChange={(e) => updateToolConfig({ textColor: e.target.value })}
                className="w-12 h-8 p-1 bg-input border-border"
              />
              <Input
                type="text"
                value={toolConfig.textColor || '#000000'}
                onChange={(e) => updateToolConfig({ textColor: e.target.value })}
                className="flex-1 bg-input border-border text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Highlight Tool Properties */}
      {activeTool === AnnotationType.HIGHLIGHT && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="highlight-color" className="text-foreground text-xs">
              Highlight Color
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="highlight-color"
                type="color"
                value={toolConfig.highlightColor || '#FFFF00'}
                onChange={(e) => updateToolConfig({ highlightColor: e.target.value })}
                className="w-12 h-8 p-1 bg-input border-border"
              />
              <Input
                type="text"
                value={toolConfig.highlightColor || '#FFFF00'}
                onChange={(e) => updateToolConfig({ highlightColor: e.target.value })}
                className="flex-1 bg-input border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="highlight-opacity" className="text-foreground text-xs">
              Opacity
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                id="highlight-opacity"
                min={0.1}
                max={1}
                step={0.1}
                value={[toolConfig.highlightOpacity || 0.3]}
                onValueChange={([value]) => updateToolConfig({ highlightOpacity: value })}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round((toolConfig.highlightOpacity || 0.3) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Tool Properties */}
      {activeTool === AnnotationType.DRAWING && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="stroke-width" className="text-foreground text-xs">
              Stroke Width
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                id="stroke-width"
                min={1}
                max={20}
                step={1}
                value={[toolConfig.strokeWidth || 2]}
                onValueChange={([value]) => updateToolConfig({ strokeWidth: value })}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {toolConfig.strokeWidth || 2}px
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="stroke-color" className="text-foreground text-xs">
              Stroke Color
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="stroke-color"
                type="color"
                value={toolConfig.strokeColor || '#FF0000'}
                onChange={(e) => updateToolConfig({ strokeColor: e.target.value })}
                className="w-12 h-8 p-1 bg-input border-border"
              />
              <Input
                type="text"
                value={toolConfig.strokeColor || '#FF0000'}
                onChange={(e) => updateToolConfig({ strokeColor: e.target.value })}
                className="flex-1 bg-input border-border text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shape Tool Properties (Rectangle, Circle) */}
      {(activeTool === AnnotationType.RECTANGLE || activeTool === AnnotationType.CIRCLE) && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="shape-stroke-width" className="text-foreground text-xs">
              Stroke Width
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                id="shape-stroke-width"
                min={1}
                max={20}
                step={1}
                value={[toolConfig.shapeStrokeWidth || 2]}
                onValueChange={([value]) => updateToolConfig({ shapeStrokeWidth: value })}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {toolConfig.shapeStrokeWidth || 2}px
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="shape-stroke-color" className="text-foreground text-xs">
              Stroke Color
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="shape-stroke-color"
                type="color"
                value={toolConfig.shapeStrokeColor || '#0000FF'}
                onChange={(e) => updateToolConfig({ shapeStrokeColor: e.target.value })}
                className="w-12 h-8 p-1 bg-input border-border"
              />
              <Input
                type="text"
                value={toolConfig.shapeStrokeColor || '#0000FF'}
                onChange={(e) => updateToolConfig({ shapeStrokeColor: e.target.value })}
                className="flex-1 bg-input border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shape-fill-color" className="text-foreground text-xs">
              Fill Color
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="shape-fill-color"
                type="color"
                value={toolConfig.shapeFillColor || '#0000FF'}
                onChange={(e) => updateToolConfig({ shapeFillColor: e.target.value })}
                className="w-12 h-8 p-1 bg-input border-border"
              />
              <Input
                type="text"
                value={toolConfig.shapeFillColor || '#0000FF'}
                onChange={(e) => updateToolConfig({ shapeFillColor: e.target.value })}
                className="flex-1 bg-input border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shape-fill-opacity" className="text-foreground text-xs">
              Fill Opacity
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                id="shape-fill-opacity"
                min={0}
                max={1}
                step={0.1}
                value={[toolConfig.shapeFillOpacity || 0.1]}
                onValueChange={([value]) => updateToolConfig({ shapeFillOpacity: value })}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round((toolConfig.shapeFillOpacity || 0.1) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
