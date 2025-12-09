"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MediaUploaderProps, MediaAsset } from "@/lib/editor/types";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Default accepted file types
 */
const DEFAULT_ACCEPT = "video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,image/jpeg,image/png,image/gif";

/**
 * MediaUploader Component
 *
 * Drag-and-drop file uploader for the media library.
 * Supports multiple file uploads with progress tracking.
 */
export function MediaUploader({
  projectId,
  onUploadComplete,
  onUploadError,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 500,
  className,
}: MediaUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  /**
   * Validate a file
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      const validTypes = accept.split(",").map((t) => t.trim());
      const isValidType = validTypes.some((type) => {
        if (type.includes("*")) {
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        return "Unsupported file type";
      }

      return null;
    },
    [accept, maxSizeBytes, maxSizeMB]
  );

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (uploadingFile: UploadingFile) => {
      const { id, file } = uploadingFile;

      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "uploading" as const } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/editor/project/${projectId}/media`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Upload failed");
        }

        // Update status to complete
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "complete" as const, progress: 100 } : f
          )
        );

        // Create MediaAsset from response
        const asset: MediaAsset = {
          id: data.data.id,
          projectId,
          type: data.data.type,
          filename: data.data.filename,
          originalFilename: data.data.filename,
          path: "",
          size: data.data.size,
          mimeType: data.data.mimeType,
          thumbnail: data.data.thumbnail,
          metadata: {
            duration: data.data.duration,
            width: data.data.width,
            height: data.data.height,
          },
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.createdAt),
        };

        onUploadComplete?.(asset);

        // Remove from list after delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
        }, 2000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "error" as const, error: errorMessage } : f
          )
        );

        onUploadError?.(errorMessage);
      }
    },
    [projectId, onUploadComplete, onUploadError]
  );

  /**
   * Handle file selection
   */
  const handleFiles = useCallback(
    (files: FileList) => {
      const newUploads: UploadingFile[] = [];

      Array.from(files).forEach((file) => {
        const error = validateFile(file);
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (error) {
          newUploads.push({
            id,
            file,
            progress: 0,
            status: "error",
            error,
          });
        } else {
          newUploads.push({
            id,
            file,
            progress: 0,
            status: "pending",
          });
        }
      });

      setUploadingFiles((prev) => [...prev, ...newUploads]);

      // Start uploading valid files
      newUploads
        .filter((f) => f.status === "pending")
        .forEach((f) => uploadFile(f));
    },
    [validateFile, uploadFile]
  );

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(e.target.files);
      }
      // Reset input
      e.target.value = "";
    },
    [handleFiles]
  );

  /**
   * Remove an upload from the list
   */
  const removeUpload = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleInputChange}
        />

        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />

        <p className="text-sm font-medium mb-1">
          Drop files here or{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            browse
          </button>
        </p>

        <p className="text-xs text-muted-foreground">
          Video, audio, or images (max {maxSizeMB}MB)
        </p>
      </div>

      {/* Upload progress list */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border",
                upload.status === "error" && "border-destructive/50 bg-destructive/5",
                upload.status === "complete" && "border-green-500/50 bg-green-500/5"
              )}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {upload.status === "uploading" && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
                {upload.status === "complete" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {upload.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                {upload.status === "pending" && (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {upload.error || formatFileSize(upload.file.size)}
                </p>
              </div>

              {/* Remove button */}
              {(upload.status === "error" || upload.status === "complete") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => removeUpload(upload.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
