"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Download,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

type ExportFormat = "mp4" | "webm" | "avi"
type ExportQuality = "low" | "medium" | "high" | "ultra"
type ExportResolution = "original" | "1080p" | "720p" | "480p"
type ExportFrameRate = "original" | "24" | "30" | "60"

type ExportStage = "settings" | "rendering" | "complete" | "error"

interface ExportSettings {
  format: ExportFormat
  quality: ExportQuality
  resolution: ExportResolution
  frameRate: ExportFrameRate
}

interface RenderResponse {
  success: boolean
  renderId?: string
  message?: string
  error?: string
}

export function ExportDialog({
  open,
  onClose,
  projectId,
  projectName,
}: ExportDialogProps) {
  // Export settings state
  const [settings, setSettings] = useState<ExportSettings>({
    format: "mp4",
    quality: "high",
    resolution: "original",
    frameRate: "original",
  })

  // Export flow state
  const [stage, setStage] = useState<ExportStage>("settings")
  const [renderId, setRenderId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStage("settings")
      setRenderId(null)
      setErrorMessage("")
      setIsProcessing(false)
      setProgress(0)
    }
  }, [open])

  // Poll for render completion using projectId (status is tracked by project)
  useEffect(() => {
    if (stage !== "rendering" || !renderId) return

    const pollInterval = setInterval(async () => {
      try {
        // Poll using projectId since that's how status is tracked in the backend
        const response = await fetch(`/api/editor/render/${projectId}/status`)
        if (!response.ok) {
          throw new Error("Failed to check render status")
        }

        const data = await response.json()

        if (data.status === "completed") {
          clearInterval(pollInterval)
          setStage("complete")
          setProgress(100)
        } else if (data.status === "failed") {
          clearInterval(pollInterval)
          setStage("error")
          setErrorMessage(data.error || "Rendering failed")
        } else if (data.progress !== undefined) {
          setProgress(Math.min(data.progress, 99))
        }
      } catch (error) {
        clearInterval(pollInterval)
        setStage("error")
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to check render status"
        )
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [stage, renderId, projectId])

  // Handle export start
  const handleStartExport = useCallback(async () => {
    setIsProcessing(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/editor/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          settings,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to start render: ${response.statusText}`)
      }

      const data: RenderResponse = await response.json()

      if (data.success && data.renderId) {
        setRenderId(data.renderId)
        setStage("rendering")
        setProgress(0)
      } else {
        throw new Error(data.error || data.message || "Failed to start render")
      }
    } catch (error) {
      setStage("error")
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      )
    } finally {
      setIsProcessing(false)
    }
  }, [projectId, settings])

  // Handle download
  const handleDownload = useCallback(() => {
    if (!renderId) return

    // Create a temporary anchor element to trigger download
    const link = document.createElement("a")
    link.href = `/api/editor/export/${renderId}`
    link.download = `${projectName}.${settings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [renderId, projectName, settings.format])

  // Handle close with confirmation if rendering
  const handleClose = useCallback(() => {
    if (stage === "rendering") {
      const confirm = window.confirm(
        "Export is in progress. Are you sure you want to close? This will not cancel the render."
      )
      if (!confirm) return
    }
    onClose()
  }, [stage, onClose])

  // Update setting helper
  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {stage === "settings" && <Settings className="w-5 h-5 text-primary" />}
              {stage === "rendering" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {stage === "complete" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {stage === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Export Video</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Settings Stage */}
          {stage === "settings" && (
            <div className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["mp4", "webm", "avi"] as ExportFormat[]).map((format) => (
                    <button
                      key={format}
                      onClick={() => updateSetting("format", format)}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
                        settings.format === format
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quality</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["low", "medium", "high", "ultra"] as ExportQuality[]).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => updateSetting("quality", quality)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors border capitalize",
                        settings.quality === quality
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Selection */}
              <div className="space-y-2">
                <label htmlFor="resolution" className="text-sm font-medium">
                  Resolution
                </label>
                <select
                  id="resolution"
                  value={settings.resolution}
                  onChange={(e) => updateSetting("resolution", e.target.value as ExportResolution)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="original">Keep Original</option>
                  <option value="1080p">1080p (1920x1080)</option>
                  <option value="720p">720p (1280x720)</option>
                  <option value="480p">480p (854x480)</option>
                </select>
              </div>

              {/* Frame Rate Selection */}
              <div className="space-y-2">
                <label htmlFor="frameRate" className="text-sm font-medium">
                  Frame Rate
                </label>
                <select
                  id="frameRate"
                  value={settings.frameRate}
                  onChange={(e) => updateSetting("frameRate", e.target.value as ExportFrameRate)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="original">Keep Original</option>
                  <option value="24">24 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </select>
              </div>

              {/* Settings Summary */}
              <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Export Summary
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Format:</span>{" "}
                    <span className="font-medium">{settings.format.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality:</span>{" "}
                    <span className="font-medium capitalize">{settings.quality}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolution:</span>{" "}
                    <span className="font-medium">{settings.resolution === "original" ? "Original" : settings.resolution}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frame Rate:</span>{" "}
                    <span className="font-medium">{settings.frameRate === "original" ? "Original" : `${settings.frameRate} fps`}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rendering Stage */}
          {stage === "rendering" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Rendering Video...</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few minutes depending on video length
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You can close this dialog. The render will continue in the background.
              </p>
            </div>
          )}

          {/* Complete Stage */}
          {stage === "complete" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Export Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    Your video is ready to download
                  </p>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Format:</span>{" "}
                    <span className="font-medium">{settings.format.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality:</span>{" "}
                    <span className="font-medium capitalize">{settings.quality}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Stage */}
          {stage === "error" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Export Failed</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {errorMessage || "An error occurred during export"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/30">
          {stage === "settings" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartExport}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Start Export
                  </>
                )}
              </Button>
            </>
          )}

          {stage === "rendering" && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}

          {stage === "complete" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download Video
              </Button>
            </>
          )}

          {stage === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setStage("settings")
                  setErrorMessage("")
                }}
                variant="default"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
