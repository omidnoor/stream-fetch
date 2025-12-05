"use client"

import { ArrowLeft, Download, Calendar, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function YouTubeHistoryPage() {
  // Placeholder data - in a real app, this would come from a database or local storage
  const downloadHistory = [
    // Empty for now - this will be implemented when we add persistence
  ]

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/youtube" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Download History</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage your downloaded videos
          </p>
        </div>
      </div>

      {/* Empty State */}
      {downloadHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Download className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">No downloads yet</h3>
          <p className="mt-2 max-w-md text-muted-foreground">
            Your download history will appear here once you start downloading videos.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/youtube">Download Your First Video</Link>
          </Button>
        </div>
      )}

      {/* History List - Will be populated when we add download tracking */}
      {downloadHistory.length > 0 && (
        <div className="space-y-4">
          {downloadHistory.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-card/80"
            >
              {/* Thumbnail */}
              <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{item.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>{item.quality}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Re-download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold mb-2">About Download History</h3>
        <p className="text-sm text-muted-foreground">
          Download history is stored locally in your browser. Clearing your browser data will remove this history.
          In a future update, we'll add cloud sync so you can access your history from any device.
        </p>
      </div>
    </div>
  )
}
