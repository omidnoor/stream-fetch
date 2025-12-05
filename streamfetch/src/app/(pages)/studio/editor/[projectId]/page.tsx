"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Download as DownloadIcon, Play, Pause } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"

interface Project {
  id: string
  name: string
  description?: string
  status: "draft" | "processing" | "completed" | "failed"
  duration: number
  createdAt: string
  updatedAt: string
}

export default function ProjectEditorPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/editor/project/${projectId}`)
      const data = await response.json()

      if (data.success) {
        setProject(data.data)
      } else {
        setError(data.error || "Failed to load project")
      }
    } catch (err) {
      console.error("Error loading project:", err)
      setError("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/studio" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <h3 className="font-semibold text-red-500">Error</h3>
          <p className="text-sm text-red-400 mt-1">{error || "Project not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/studio" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button size="sm" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Tools */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3">Tools</h3>
            <div className="space-y-2">
              <button className="w-full rounded-lg border bg-muted/50 p-3 text-left text-sm hover:bg-muted transition-colors">
                Media Library
              </button>
              <button className="w-full rounded-lg border bg-muted/50 p-3 text-left text-sm hover:bg-muted transition-colors">
                Text Overlay
              </button>
              <button className="w-full rounded-lg border bg-muted/50 p-3 text-left text-sm hover:bg-muted transition-colors">
                Effects
              </button>
              <button className="w-full rounded-lg border bg-muted/50 p-3 text-left text-sm hover:bg-muted transition-colors">
                Transitions
              </button>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Preview */}
          <div className="rounded-lg border bg-card p-4">
            <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎬</div>
                <div>
                  <h3 className="font-semibold">Video Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview window will appear here
                  </p>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4" />
              </Button>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full w-1/3 bg-primary rounded-full"></div>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">0:00 / 0:00</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3">Timeline</h3>
            <div className="space-y-2">
              <div className="h-16 rounded-lg border bg-muted/20 flex items-center px-4">
                <span className="text-sm text-muted-foreground">Video Track</span>
              </div>
              <div className="h-16 rounded-lg border bg-muted/20 flex items-center px-4">
                <span className="text-sm text-muted-foreground">Audio Track</span>
              </div>
              <div className="h-16 rounded-lg border bg-muted/20 flex items-center px-4">
                <span className="text-sm text-muted-foreground">Text Track</span>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-500">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-500 text-sm">Editor Under Development</h3>
                <p className="text-sm text-yellow-400/80 mt-1">
                  This is a placeholder interface. Full editing functionality is being implemented.
                  The project data is being loaded correctly, but interactive editing tools are coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
