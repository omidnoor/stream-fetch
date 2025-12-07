"use client"

import { useState } from "react"
import { Search, ArrowRight, AlertCircle, History } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VideoInfoCard } from "@/components/video-info-card"
import { DubbingCard } from "@/components/dubbing-card"
import { VideoInfoResponse } from "@/lib/types"

export default function YouTubePage() {
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
      setTimeout(() => setDownloading(false), 2000)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">YouTube Downloader</h1>
          <p className="text-muted-foreground">
            Download videos in high quality. Choose from multiple formats and resolutions.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/youtube/history" className="gap-2">
            <History className="h-4 w-4" />
            View History
          </Link>
        </Button>
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
            {loading ? "Fetching..." : "Fetch Video"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
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
        <div className="space-y-6">
          <VideoInfoCard
            video={videoInfo.data.video}
            formats={videoInfo.data.formats}
            onDownload={handleDownload}
            downloading={downloading}
            videoUrl={url}
            showCrossFeatureButtons={false}
          />

          {/* Dubbing Card */}
          <DubbingCard videoUrl={url} />
        </div>
      )}

      {/* Info Box */}
      {!videoInfo && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold mb-2">How to use</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>Copy a YouTube video URL from your browser</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>Paste it in the search box above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>Click "Fetch Video" to load video information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <span>Select your preferred quality and click "Download"</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
