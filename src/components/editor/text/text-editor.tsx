"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Copy,
  Trash2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  TextEditorProps,
  TextOverlay,
  UpdateTextOverlayDto,
  TextPresetType,
  TextAlign,
} from "@/lib/editor/types";
import { AVAILABLE_FONTS, COLOR_PRESETS, TEXT_PRESETS } from "@/lib/editor/utils";

/**
 * TextEditor Component
 *
 * Panel for editing text overlay properties including content,
 * font, color, alignment, and animations.
 */
export function TextEditor({
  overlay,
  onUpdate,
  onDelete,
  onDuplicate,
  className,
}: TextEditorProps) {
  const [localContent, setLocalContent] = useState(overlay?.content ?? "");

  // Sync local content with overlay changes
  useEffect(() => {
    setLocalContent(overlay?.content ?? "");
  }, [overlay?.content]);

  /**
   * Handle content change with debounce
   */
  const handleContentChange = useCallback(
    (value: string) => {
      setLocalContent(value);
    },
    []
  );

  /**
   * Commit content change
   */
  const commitContentChange = useCallback(() => {
    if (localContent !== overlay?.content) {
      onUpdate({ content: localContent });
    }
  }, [localContent, overlay?.content, onUpdate]);

  /**
   * Handle style update
   */
  const handleStyleUpdate = useCallback(
    (updates: Partial<TextOverlay["style"]>) => {
      onUpdate({ style: updates });
    },
    [onUpdate]
  );

  /**
   * Toggle bold
   */
  const toggleBold = useCallback(() => {
    handleStyleUpdate({ bold: !overlay?.style.bold });
  }, [overlay?.style.bold, handleStyleUpdate]);

  /**
   * Toggle italic
   */
  const toggleItalic = useCallback(() => {
    handleStyleUpdate({ italic: !overlay?.style.italic });
  }, [overlay?.style.italic, handleStyleUpdate]);

  /**
   * Toggle underline
   */
  const toggleUnderline = useCallback(() => {
    handleStyleUpdate({ underline: !overlay?.style.underline });
  }, [overlay?.style.underline, handleStyleUpdate]);

  /**
   * Set alignment
   */
  const setAlignment = useCallback(
    (align: TextAlign) => {
      handleStyleUpdate({ align });
    },
    [handleStyleUpdate]
  );

  if (!overlay) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a text overlay to edit</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Type className="w-4 h-4" />
          Text Properties
        </h3>
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDuplicate}
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="text-content">Text</Label>
        <Input
          id="text-content"
          value={localContent}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={commitContentChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitContentChange();
            }
          }}
          placeholder="Enter text..."
        />
      </div>

      {/* Preset Selection */}
      <div className="space-y-2">
        <Label>Style Preset</Label>
        <Select
          value={overlay.preset ?? "custom"}
          onValueChange={(value) => {
            const preset = TEXT_PRESETS[value as TextPresetType];
            onUpdate({
              position: preset.position,
              style: preset.style,
              animationIn: preset.animationIn,
              animationOut: preset.animationOut,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEXT_PRESETS).map(([key, preset]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  {preset.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label>Font</Label>
        <Select
          value={overlay.style.fontFamily}
          onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_FONTS.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Font Size</Label>
          <span className="text-xs text-muted-foreground">
            {overlay.style.fontSize}px
          </span>
        </div>
        <Slider
          value={[overlay.style.fontSize]}
          min={12}
          max={144}
          step={1}
          onValueChange={([value]) => handleStyleUpdate({ fontSize: value })}
        />
      </div>

      {/* Text Formatting */}
      <div className="space-y-2">
        <Label>Formatting</Label>
        <div className="flex items-center gap-1">
          <Button
            variant={overlay.style.bold ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={toggleBold}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={overlay.style.italic ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={toggleItalic}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={overlay.style.underline ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={toggleUnderline}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={overlay.style.align === "left" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setAlignment("left")}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={overlay.style.align === "center" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setAlignment("center")}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={overlay.style.align === "right" ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setAlignment("right")}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        {/* Text Color */}
        <div className="space-y-2">
          <Label>Text Color</Label>
          <ColorPicker
            value={overlay.style.color}
            onChange={(color) => handleStyleUpdate({ color })}
          />
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label>Background</Label>
          <ColorPicker
            value={overlay.style.backgroundColor ?? "transparent"}
            onChange={(color) =>
              handleStyleUpdate({
                backgroundColor: color === "transparent" ? undefined : color,
              })
            }
            showTransparent
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Opacity</Label>
          <span className="text-xs text-muted-foreground">
            {Math.round(overlay.style.opacity * 100)}%
          </span>
        </div>
        <Slider
          value={[overlay.style.opacity * 100]}
          min={0}
          max={100}
          step={5}
          onValueChange={([value]) =>
            handleStyleUpdate({ opacity: value / 100 })
          }
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">X: {overlay.position.x.toFixed(0)}%</span>
            <Slider
              value={[overlay.position.x]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) =>
                onUpdate({ position: { ...overlay.position, x: value } })
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Y: {overlay.position.y.toFixed(0)}%</span>
            <Slider
              value={[overlay.position.y]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) =>
                onUpdate({ position: { ...overlay.position, y: value } })
              }
            />
          </div>
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-2">
        <Label>Timing</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Start (s)</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={overlay.startTime}
              onChange={(e) =>
                onUpdate({ startTime: parseFloat(e.target.value) || 0 })
              }
              className="h-8"
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Duration (s)</span>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={overlay.duration}
              onChange={(e) =>
                onUpdate({ duration: parseFloat(e.target.value) || 1 })
              }
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* Animation */}
      <div className="space-y-2">
        <Label>Animation</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Entry</span>
            <Select
              value={overlay.animationIn?.type ?? "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onUpdate({ animationIn: undefined });
                } else {
                  onUpdate({
                    animationIn: {
                      type: value as any,
                      duration: overlay.animationIn?.duration ?? 0.5,
                    },
                  });
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="typewriter">Typewriter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">Exit</span>
            <Select
              value={overlay.animationOut?.type ?? "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onUpdate({ animationOut: undefined });
                } else {
                  onUpdate({
                    animationOut: {
                      type: value as any,
                      duration: overlay.animationOut?.duration ?? 0.5,
                    },
                  });
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Color Picker Component
 */
function ColorPicker({
  value,
  onChange,
  showTransparent = false,
}: {
  value: string;
  onChange: (color: string) => void;
  showTransparent?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-8 justify-start gap-2">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{
              backgroundColor: value === "transparent" ? "transparent" : value,
              backgroundImage:
                value === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
          <span className="text-xs truncate">
            {value === "transparent" ? "None" : value}
          </span>
          <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="grid grid-cols-7 gap-1">
          {showTransparent && (
            <button
              className={cn(
                "w-5 h-5 rounded border border-border",
                value === "transparent" && "ring-2 ring-primary"
              )}
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "6px 6px",
                backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
              }}
              onClick={() => onChange("transparent")}
              title="Transparent"
            />
          )}
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              className={cn(
                "w-5 h-5 rounded border border-border",
                value === color && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <Input
            type="color"
            value={value === "transparent" ? "#ffffff" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
