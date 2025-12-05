"use client"

import { useState } from "react"
import { Search, ArrowRight, AlertCircle, Film, Download } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VideoInfoCard } from "@/components/video-info-card"
import { VideoInfoResponse } from "@/lib/types"

export default function DashboardPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setVideoInfo(null)

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`)
      const data: VideoInfoResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video information")
      }

      if (data.success) {
        setVideoInfo(data)
      } else {
        setError(data.error || "Unknown error occurred")
      }
    } catch (err) {
      console.error("Error fetching video info:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch video information")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (itag: number, quality: string) => {
    setDownloading(true)
    setError(null)

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${itag}`

      // Create a temporary link element to trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `video-${quality}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error downloading video:", err)
      setError("Failed to start download")
    } finally {
      // Give a moment for the download to start
      setTimeout(() => setDownloading(false), 2000)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Heading */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Download{" "}
          <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            YouTube Videos
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Paste a YouTube URL to extract metadata and download high-quality video or audio.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Videos Downloaded</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Active Dubbing Jobs</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Video Projects</div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Page - Video Downloader */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Video Downloader</h3>
              <p className="text-sm text-muted-foreground">
                Download videos from YouTube in high quality.
              </p>
              <p className="text-xs text-primary mt-2 font-medium">Currently on this page</p>
            </div>
          </div>
        </div>

        {/* Video Editor - Link to Editor Page */}
        <Link href="/studio">
          <div className="rounded-lg border bg-card p-6 hover:border-primary hover:bg-card/50 transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Film className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  Video Studio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Edit videos with timeline editor. Trim, add text, apply effects.
                </p>
                <p className="text-xs text-purple-400 mt-2 font-medium flex items-center gap-1">
                  Try it now <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Search Form */}
      <form onSubmit={handleFetch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-14 pl-12 pr-32 text-base"
            disabled={loading}
          />
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 top-1/2 -translate-y-1/2 gap-2"
            disabled={loading || !url.trim()}
          >
            {loading ? "Fetching..." : "Fetch"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground">
          Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
        </p>
      </form>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Error</h3>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Video Info Card */}
      {videoInfo?.success && videoInfo.data && (
        <VideoInfoCard
          video={videoInfo.data.video}
          formats={videoInfo.data.formats}
          onDownload={handleDownload}
          downloading={downloading}
          videoUrl={url}
        />
      )}

      {/* Educational Note */}
      {!videoInfo && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold text-primary mb-2">
            Educational Purpose
          </h3>
          <p className="text-sm text-muted-foreground">
            This application demonstrates how to overcome CORS restrictions through server-side proxying,
            handle streaming data efficiently, and integrate with third-party APIs.
          </p>
        </div>
      )}
    </div>
  )
}
