"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Send, Loader2, Sparkles, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  base64: string;
  name: string;
  preview: string;
}

interface PromptInputProps {
  onSubmit: (prompt: string, images: string[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function PromptInput({ onSubmit, isLoading, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading || disabled) return;
    const imageBase64s = uploadedImages.map((img) => img.base64);
    onSubmit(prompt.trim(), imageBase64s);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (uploadedImages.length + newImages.length >= 4) break; // Max 4 images

      const base64 = await fileToBase64(file);
      newImages.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        base64: base64.split(",")[1], // Remove data:image/...;base64, prefix
        name: file.name,
        preview: base64,
      });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (uploadedImages.length + newImages.length >= 4) break;

      const base64 = await fileToBase64(file);
      newImages.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        base64: base64.split(",")[1],
        name: file.name,
        preview: base64,
      });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="relative rounded-lg border border-border bg-surface-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="flex gap-2 p-3 pb-0 flex-wrap">
          {uploadedImages.map((img) => (
            <div
              key={img.id}
              className="relative group"
            >
              <img
                src={img.preview}
                alt={img.name}
                className="w-16 h-16 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          ))}
          {uploadedImages.length < 4 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary flex items-center justify-center transition-colors"
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedImages.length > 0
              ? "Describe how to edit or transform this image..."
              : "Describe the image you want to generate..."
          }
          className="flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px] text-base leading-relaxed"
          disabled={isLoading || disabled}
          rows={2}
        />
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2 bg-surface-1 rounded-b-lg">
        <div className="flex items-center gap-1">
          {/* Upload Button - Subtle Icon */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || disabled || uploadedImages.length >= 4}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
            title="Add image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          {uploadedImages.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              {uploadedImages.length}/4
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:block">
            <kbd className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px]">Ctrl+Enter</kbd>
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading || disabled}
            size="sm"
            className="gap-2 rounded-full px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Stop
              </>
            ) : (
              <>
                Run
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
