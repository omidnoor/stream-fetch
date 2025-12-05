"use client"

import { useState } from "react"
import { Search, ArrowRight, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VideoInfoCard } from "@/components/video-info-card"
import { VideoInfoResponse } from "@/lib/types"

export default function Home() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * EDUCATIONAL NOTE: Fetching Video Info
   *
   * This function demonstrates:
   * 1. Making API calls from the client to our backend
   * 2. Error handling for network requests
   * 3. State management (loading, data, errors)
   */
  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setVideoInfo(null)

    try {
      /**
       * EDUCATIONAL NOTE: API Communication
       *
       * We're calling our own API route (/api/video-info), not YouTube directly.
       * This is the CORS bypass in action:
       *
       * Client → Our API (same origin, no CORS) → YouTube
       */
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

  /**
   * EDUCATIONAL NOTE: Downloading Videos
   *
   * This function demonstrates:
   * 1. Triggering a download through our streaming API
   * 2. Using the browser's download mechanism
   * 3. Handling the download URL
   */
  const handleDownload = async (itag: number, quality: string) => {
    setDownloading(true)
    setError(null)

    try {
      /**
       * EDUCATIONAL NOTE: Download Flow
       *
       * We construct a download URL that points to our API route.
       * When the user clicks, the browser:
       * 1. Requests from our API
       * 2. Our API streams from YouTube
       * 3. Browser receives chunks and saves to disk
       *
       * The Content-Disposition header tells the browser to download,
       * not display the video.
       */
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${itag}`

      // Create a temporary link element to trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `video-${quality}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      /**
       * EDUCATIONAL NOTE: Download Feedback
       *
       * Since downloads happen in the background through the browser's
       * download manager, we don't get real-time progress here.
       *
       * For advanced progress tracking, you would need to:
       * 1. Use the Fetch API with streaming
       * 2. Read the response stream chunk by chunk
       * 3. Track bytes received vs Content-Length
       * 4. Manually create and save the file using Blob
       */
    } catch (err) {
      console.error("Error downloading video:", err)
      setError("Failed to start download")
    } finally {
      // Give a moment for the download to start
      setTimeout(() => setDownloading(false), 2000)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Heading */}
        <div className="text-center space-y-4 pt-12">
          <h1 className="text-5xl font-bold tracking-tight">
            Universal{" "}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Media Saver
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste a link from your favorite platform to extract metadata and download high-quality video or audio.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleFetch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Paste video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 pl-12 pr-32 text-base bg-card/50 border-gray-800 focus:border-primary transition-colors"
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
          <p className="text-center text-sm text-muted-foreground">
            * Paste a YouTube URL to test. Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
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
          />
        )}

        {/* Educational Note */}
        {!videoInfo && (
          <div className="mt-12 rounded-lg border border-gray-800 bg-card/30 p-6">
            <h3 className="text-sm font-semibold text-primary mb-2">
              📚 Educational Purpose
            </h3>
            <p className="text-sm text-muted-foreground">
              This application demonstrates how to overcome CORS restrictions through server-side proxying,
              handle streaming data efficiently, and integrate with third-party APIs. Built for educational purposes only.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
