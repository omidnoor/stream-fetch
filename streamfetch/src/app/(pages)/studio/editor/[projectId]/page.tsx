"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowLeft, Save, Download as DownloadIcon, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/editor/video-player"
import { Timeline } from "@/components/editor/timeline"
import { ExportDialog } from "@/components/editor/export-dialog"
import { toast } from "sonner"

interface Clip {
  id: string
  name: string
  startTime: number
  duration: number
  position: number
  sourceUrl: string
}

interface VideoProject {
  id: string
  name: string
  description?: string
  status: "draft" | "processing" | "completed" | "failed"
  duration: number
  timeline: {
    clips: Array<{
      id: string
      sourceUrl: string
      startTime: number
      endTime: number
      duration: number
      position: number
      layer: number
      volume: number
      muted: boolean
      effects: any[]
    }>
    audioTracks: any[]
    textOverlays: any[]
    transitions: any[]
    duration: number
  }
  settings: {
    resolution: {
      width: number
      height: number
    }
    frameRate: number
    backgroundColor?: string
    audioSampleRate?: number
  }
  createdAt: string
  updatedAt: string
}

export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  // State
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<VideoProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [clips, setClips] = useState<Clip[]>([])
  const [saving, setSaving] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Refs for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  // Resolve async params
  useEffect(() => {
    params.then((p) => setProjectId(p.projectId))
  }, [params])

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  // Auto-save when clips change
  useEffect(() => {
    if (project && hasUnsavedChanges.current) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for auto-save (debounced by 2 seconds)
      saveTimeoutRef.current = setTimeout(() => {
        saveProject()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [clips, project])

  const loadProject = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/editor/project/${projectId}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = typeof data.error === 'object'
          ? data.error?.message || "Failed to load project"
          : data.error || "Failed to load project"
        throw new Error(errorMessage)
      }

      const projectData = data.data
      setProject(projectData)
      setDuration(projectData.timeline?.duration || 0)

      // Convert timeline clips to our clip format
      if (projectData.timeline?.clips) {
        const convertedClips: Clip[] = projectData.timeline.clips.map((clip: any) => ({
          id: clip.id,
          name: `Clip ${clip.id.substring(0, 6)}`,
          startTime: clip.startTime,
          duration: clip.duration,
          position: clip.position,
          sourceUrl: clip.sourceUrl,
        }))
        setClips(convertedClips)
      }
    } catch (err) {
      console.error("Error loading project:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load project"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async () => {
    if (!projectId || !project) return

    try {
      setSaving(true)

      // Convert clips back to timeline format
      const updatedTimeline = {
        ...project.timeline,
        clips: clips.map((clip) => ({
          id: clip.id,
          sourceUrl: clip.sourceUrl,
          startTime: clip.startTime,
          endTime: clip.startTime + clip.duration,
          duration: clip.duration,
          position: clip.position,
          layer: 0,
          volume: 1,
          muted: false,
          effects: [],
        })),
      }

      const response = await fetch(`/api/editor/project/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeline: updatedTimeline,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = typeof data.error === 'object'
          ? data.error?.message || "Failed to save project"
          : data.error || "Failed to save project"
        throw new Error(errorMessage)
      }

      hasUnsavedChanges.current = false
      toast.success("Project saved successfully")
    } catch (err) {
      console.error("Error saving project:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save project"
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = () => {
    saveProject()
  }

  const handleVideoProgress = useCallback(
    (progress: { played: number; playedSeconds: number }) => {
      setCurrentTime(progress.playedSeconds)
    },
    []
  )

  const handleVideoDuration = useCallback((dur: number) => {
    setDuration(dur)
  }, [])

  const handleTimelineSeek = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleClipsChange = useCallback((newClips: Clip[]) => {
    setClips(newClips)
    hasUnsavedChanges.current = true
  }, [])

  const handleDeleteClip = useCallback((clipId: string) => {
    setClips((prev) => prev.filter((clip) => clip.id !== clipId))
    hasUnsavedChanges.current = true
    toast.success("Clip removed from timeline")
  }, [])

  const handleExport = () => {
    setExportDialogOpen(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !project) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/studio" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Error Loading Project</h3>
              <p className="text-sm text-destructive/80 mt-1">
                {error || "Project not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get the main video URL from the first clip
  const mainVideoUrl = clips.length > 0 ? clips[0].sourceUrl : undefined

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/studio" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="border-l border-border h-6 mx-2" />
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleManualSave}
                disabled={saving || !hasUnsavedChanges.current}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button size="sm" className="gap-2" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Editor Area - Left (9 columns) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Video Player */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Preview</h2>
              <VideoPlayer
                url={mainVideoUrl}
                onProgress={handleVideoProgress}
                onDuration={handleVideoDuration}
                onSeek={handleTimelineSeek}
                className="w-full"
              />
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Timeline</h2>
              <Timeline
                clips={clips}
                duration={duration}
                currentTime={currentTime}
                onClipsChange={handleClipsChange}
                onSeek={handleTimelineSeek}
                onDeleteClip={handleDeleteClip}
              />
            </div>
          </div>

          {/* Right Sidebar - Controls (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Project Info */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold mb-3 text-sm">Project Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clips:</span>
                  <span className="font-medium">{clips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span className="font-medium">
                    {project.settings.resolution.width}x{project.settings.resolution.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frame Rate:</span>
                  <span className="font-medium">{project.settings.frameRate} fps</span>
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold mb-3 text-sm">Tools</h3>
              <div className="space-y-2">
                <button
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm hover:bg-secondary transition-colors"
                  disabled
                >
                  Media Library
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Coming soon
                  </span>
                </button>
                <button
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm hover:bg-secondary transition-colors"
                  disabled
                >
                  Text Overlay
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Coming soon
                  </span>
                </button>
                <button
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm hover:bg-secondary transition-colors"
                  disabled
                >
                  Effects
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Coming soon
                  </span>
                </button>
                <button
                  className="w-full rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm hover:bg-secondary transition-colors"
                  disabled
                >
                  Transitions
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Coming soon
                  </span>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              className="w-full gap-2"
              size="lg"
              disabled={clips.length === 0}
            >
              <DownloadIcon className="h-5 w-5" />
              Export Video
            </Button>

            {/* Status Info */}
            {hasUnsavedChanges.current && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Auto-save enabled. Changes will be saved automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  )
}
