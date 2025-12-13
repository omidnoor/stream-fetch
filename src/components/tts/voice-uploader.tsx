"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Link2, X, Mic, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaveformPlayer } from "./waveform-player";
import { cn } from "@/lib/utils";

interface VoiceUploaderProps {
  onVoiceChange: (url: string | null, blob: Blob | null) => void;
  maxDuration?: number;
  className?: string;
}

type UploadMode = "upload" | "url";

export function VoiceUploader({
  onVoiceChange,
  maxDuration = 15,
  className,
}: VoiceUploaderProps) {
  const [mode, setMode] = useState<UploadMode>("upload");
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetAudio = useCallback(
    async (file: File) => {
      setError(null);

      // Check file type
      if (!file.type.startsWith("audio/")) {
        setError("Please upload an audio file (WAV, MP3, FLAC, etc.)");
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }

      // Check duration
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration > maxDuration) {
          setError(`Audio must be ${maxDuration} seconds or less`);
          URL.revokeObjectURL(url);
          return;
        }

        setVoiceBlob(file);
        setVoiceUrl(url);
        setFileName(file.name);
        onVoiceChange(url, file);
      });

      audio.addEventListener("error", () => {
        setError("Failed to load audio file");
        URL.revokeObjectURL(url);
      });

      audio.src = url;
    },
    [maxDuration, onVoiceChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndSetAudio(file);
      }
    },
    [validateAndSetAudio]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndSetAudio(file);
      }
    },
    [validateAndSetAudio]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!urlInput.trim()) {
        setError("Please enter a URL");
        return;
      }

      try {
        new URL(urlInput);
      } catch {
        setError("Please enter a valid URL");
        return;
      }

      setVoiceUrl(urlInput);
      setVoiceBlob(null);
      setFileName(null);
      onVoiceChange(urlInput, null);
    },
    [urlInput, onVoiceChange]
  );

  const handleClear = useCallback(() => {
    if (voiceUrl && voiceBlob) {
      URL.revokeObjectURL(voiceUrl);
    }
    setVoiceUrl(null);
    setVoiceBlob(null);
    setFileName(null);
    setUrlInput("");
    setError(null);
    onVoiceChange(null, null);
  }, [voiceUrl, voiceBlob, onVoiceChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <Button
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("url")}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          From URL
        </Button>
      </div>

      {/* Upload Area or URL Input */}
      {!voiceUrl ? (
        mode === "upload" ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-surface-3 flex items-center justify-center">
                <Mic className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  Drop your voice reference here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  WAV, MP3, FLAC up to 50MB • Max {maxDuration} seconds
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/voice-reference.wav"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!urlInput.trim()}>
                Load
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter a direct URL to an audio file (WAV, MP3, etc.)
            </p>
          </form>
        )
      ) : (
        /* Preview Area */
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {fileName || "Voice Reference"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "upload" ? "Uploaded file" : "From URL"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <WaveformPlayer
            audioUrl={voiceUrl}
            audioBlob={voiceBlob}
            height={60}
            showVolume={false}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Tips */}
      {!voiceUrl && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Use 10-15 seconds of clear speech</li>
            <li>Avoid background noise or music</li>
            <li>Include varied tones and emotions</li>
          </ul>
        </div>
      )}
    </div>
  );
}
