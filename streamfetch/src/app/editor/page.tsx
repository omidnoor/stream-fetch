"use client"

import { Film, Upload, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditorPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Film className="h-10 w-10 text-purple-400" />
              Video Editor
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and edit professional videos with our timeline editor
            </p>
          </div>
          <Link href="/projects">
            <Button variant="outline" className="gap-2">
              View Projects
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Project */}
          <div className="rounded-lg border border-gray-800 bg-card/30 p-8 hover:border-primary hover:bg-card/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Create New Project
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start a new video editing project from scratch
                </p>
              </div>
            </div>
          </div>

          {/* Upload Video */}
          <div className="rounded-lg border border-gray-800 bg-card/30 p-8 hover:border-purple-500 hover:bg-card/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Upload Video
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload a video file to start editing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="rounded-lg border border-gray-800 bg-card/30 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-primary font-medium">Timeline Editing</div>
              <p className="text-sm text-muted-foreground">
                Drag and drop clips, trim, and arrange your video timeline
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-medium">Text Overlays</div>
              <p className="text-sm text-muted-foreground">
                Add custom text overlays with styling and animations
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-medium">Effects & Filters</div>
              <p className="text-sm text-muted-foreground">
                Apply professional effects and filters to your videos
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-medium">Audio Mixing</div>
              <p className="text-sm text-muted-foreground">
                Mix multiple audio tracks and adjust volume levels
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-medium">Export Options</div>
              <p className="text-sm text-muted-foreground">
                Export in multiple formats and quality settings
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-primary font-medium">Cloud Storage</div>
              <p className="text-sm text-muted-foreground">
                Save and manage your projects in the cloud
              </p>
            </div>
          </div>
        </div>

        {/* Status Notice */}
        <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-500 text-sm">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-500 text-sm">Development Notice</h3>
              <p className="text-sm text-yellow-400/80 mt-1">
                The video editor is currently under development. Core infrastructure is complete,
                and UI components are being built. Check back soon for the full editing experience!
              </p>
              <p className="text-xs text-yellow-400/60 mt-2">
                <strong>FFmpeg Required:</strong> Video processing features require FFmpeg to be installed on the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
