"use client"

import { useState } from "react"
import { Languages, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Dubbing Card Component
 *
 * Provides UI for dubbing videos to different languages using ElevenLabs API
 */

interface DubbingCardProps {
  videoUrl: string
  videoDuration?: number
}

export function DubbingCard({ videoUrl, videoDuration }: DubbingCardProps) {
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [dubbingId, setDubbingId] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  // Popular language options
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ]

  // Estimate cost based on duration
  const estimatedCost = videoDuration
    ? ((videoDuration / 60) * 0.42).toFixed(2)
    : "Unknown"

  /**
   * Create a dubbing job
   */
  const createDubbing = async () => {
    setLoading(true)
    setError("")
    setStatus("Creating dubbing job...")

    try {
      const response = await fetch("/api/dubbing/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: videoUrl,
          targetLanguage,
          watermark: true, // Use watermark to save credits
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDubbingId(data.dubbingId)
        setStatus("Dubbing job created. Processing...")
        // Start polling for status
        pollStatus(data.dubbingId)
      } else {
        setError(data.error || "Failed to create dubbing job")
        setLoading(false)
      }
    } catch (err) {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  /**
   * Poll for dubbing status
   */
  const pollStatus = async (id: string) => {
    const maxAttempts = 60 // 5 minutes max (5 seconds * 60)
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(`/api/dubbing/status?dubbingId=${id}`)
        const data = await response.json()

        if (data.status === "dubbed") {
          setStatus("Dubbing complete!")
          setLoading(false)
          clearInterval(interval)
        } else if (data.status === "failed") {
          setError(data.error || "Dubbing failed")
          setStatus("")
          setLoading(false)
          clearInterval(interval)
        } else {
          setStatus(`Processing... (${Math.floor(attempts * 5 / 60)}m ${(attempts * 5) % 60}s)`)
        }

        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          setError("Dubbing is taking longer than expected. Check status later.")
          setLoading(false)
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Error checking status:", err)
        // Continue polling even on error
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Download dubbed audio
   */
  const downloadDubbing = () => {
    if (!dubbingId) return

    const url = `/api/dubbing/download?dubbingId=${dubbingId}&targetLanguage=${targetLanguage}`
    window.open(url, "_blank")
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">AI Video Dubbing</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Dub this video to another language using AI voice synthesis
      </p>

      {/* Language Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Target Language</label>
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          disabled={loading}
          className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cost Estimate */}
      {videoDuration && (
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Estimated cost:</span>{" "}
          <span className="text-white font-semibold">${estimatedCost}</span>
          <span className="text-muted-foreground"> (with watermark)</span>
        </div>
      )}

      {/* Status/Error Messages */}
      {status && (
        <div className="rounded-lg bg-info/10 border border-info/20 p-3 text-sm text-info">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!dubbingId ? (
          <Button
            onClick={createDubbing}
            disabled={loading || !videoUrl}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Create Dubbing
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={downloadDubbing}
            disabled={loading || status !== "Dubbing complete!"}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Download Dubbed Audio
          </Button>
        )}
      </div>

      {/* Info Note */}
      <p className="text-xs text-muted-foreground">
        Note: Dubbing typically takes 1-2 minutes per minute of video. The dubbed audio will include a watermark.
      </p>
    </div>
  )
}
