"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, Clock, Eye, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoDetails, VideoFormat } from "@/lib/types"

interface VideoInfoCardProps {
  video: VideoDetails
  formats: VideoFormat[]
  onDownload: (itag: number, quality: string) => void
  downloading: boolean
}

export function VideoInfoCard({ video, formats, onDownload, downloading }: VideoInfoCardProps) {
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(formats[0] || null)

  /**
   * EDUCATIONAL NOTE: Time Formatting
   *
   * Converting seconds to a readable format (HH:MM:SS or MM:SS)
   */
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  /**
   * EDUCATIONAL NOTE: Number Formatting
   *
   * Format large numbers with commas for readability
   * e.g., 1000000 → "1,000,000"
   */
  const formatViews = (views: string) => {
    return parseInt(views).toLocaleString()
  }

  /**
   * EDUCATIONAL NOTE: File Size Formatting
   *
   * Convert bytes to human-readable format (MB, GB)
   */
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"

    const mb = bytes / (1024 * 1024)
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`
    }
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Video Preview Card */}
      <div className="rounded-lg border border-gray-800 bg-card overflow-hidden">
        <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
          {/* Thumbnail */}
          <div className="relative aspect-video md:aspect-auto md:h-[200px] rounded-lg overflow-hidden bg-gray-900">
            {video.thumbnail ? (
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span>No thumbnail available</span>
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {video.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{video.author}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{formatViews(video.viewCount)} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Selection Card */}
      <div className="rounded-lg border border-gray-800 bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Select Quality</h3>

        {/**
         * EDUCATIONAL NOTE: Format Selection UI
         *
         * We show all video formats with quality indicators.
         * Formats with audio are ready to play immediately.
         * Video-only formats can be downloaded but need audio merging.
         */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {formats.map((format, index) => (
            <button
              key={`${format.itag}-${index}`}
              onClick={() => setSelectedFormat(format)}
              className={`
                relative rounded-lg border-2 p-4 text-left transition-all
                ${
                  selectedFormat?.itag === format.itag
                    ? "border-primary bg-primary/10"
                    : "border-gray-800 hover:border-gray-700 hover:bg-gray-900/50"
                }
              `}
            >
              <div className="font-semibold text-white">{format.quality}</div>
              <div className="text-xs mt-1">
                {format.hasAudio ? (
                  <span className="text-green-500">+ Audio</span>
                ) : (
                  <span className="text-orange-400">Video only</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format.container.toUpperCase()}
              </div>
              {format.filesize && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(format.filesize)}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Format Details */}
        {selectedFormat && (
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <h4 className="text-sm font-medium text-white">Selected Format Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Quality:</span>{" "}
                <span className="text-white">{selectedFormat.quality}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Format:</span>{" "}
                <span className="text-white">{selectedFormat.container}</span>
              </div>
              {selectedFormat.fps && (
                <div>
                  <span className="text-muted-foreground">FPS:</span>{" "}
                  <span className="text-white">{selectedFormat.fps}</span>
                </div>
              )}
              {selectedFormat.filesize && (
                <div>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  <span className="text-white">{formatFileSize(selectedFormat.filesize)}</span>
                </div>
              )}
              {selectedFormat.codec && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Codec:</span>{" "}
                  <span className="text-white font-mono text-xs">{selectedFormat.codec}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Button */}
        <Button
          onClick={() => selectedFormat && onDownload(selectedFormat.itag, selectedFormat.quality)}
          disabled={!selectedFormat || downloading}
          size="lg"
          className="w-full gap-2"
        >
          <Download className="h-5 w-5" />
          {downloading ? "Downloading..." : "Download Video"}
        </Button>

        {/**
         * EDUCATIONAL NOTE: Why This UI Pattern?
         *
         * We separate fetching metadata from downloading:
         * 1. Show user what's available before committing to download
         * 2. Let user choose quality (save bandwidth)
         * 3. Display file size estimate (user can make informed choice)
         * 4. Better UX - user sees options before waiting for download
         */}
      </div>
    </div>
  )
}
