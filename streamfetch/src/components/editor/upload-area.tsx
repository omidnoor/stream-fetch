"use client"

import { useState, useCallback } from "react"
import { Upload, File, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadAreaProps {
  onFileSelect: (file: File) => void
  onUploadComplete?: (filePath: string) => void
  maxSizeMB?: number
  accept?: string
}

export function UploadArea({
  onFileSelect,
  onUploadComplete,
  maxSizeMB = 500,
  accept = "video/mp4,video/webm,video/mov,video/avi,video/mkv",
}: UploadAreaProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    const validTypes = accept.split(",").map(t => t.trim())
    const isValidType = validTypes.some(type => {
      if (type.includes("*")) {
        const baseType = type.split("/")[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      return "Invalid file type. Please upload a video file."
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect, accept, maxSizeMB])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/editor/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Upload failed")
      }

      setUploadProgress(100)
      onUploadComplete?.(data.data.filePath)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
            }
          `}
        >
          <input
            type="file"
            id="video-upload"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
          />

          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

          <h3 className="text-lg font-semibold mb-2">
            Drop video file here
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>

          <label htmlFor="video-upload">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("video-upload")?.click()}
            >
              Select Video File
            </Button>
          </label>

          <p className="text-xs text-muted-foreground mt-4">
            Supports MP4, WebM, MOV, AVI, MKV (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <File className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{selectedFile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>

                {uploading && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!uploading && uploadProgress === 0 && (
            <Button
              onClick={handleUpload}
              className="w-full mt-4"
            >
              Upload and Continue
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Upload Error</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
