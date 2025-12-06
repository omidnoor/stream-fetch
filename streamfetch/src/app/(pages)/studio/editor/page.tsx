"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Film, Upload, Plus, FolderOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { UploadArea } from "@/components/editor/upload-area"

export default function EditorPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const handleCreateProject = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/editor/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `New Project ${new Date().toLocaleDateString()}`,
          description: "Created from video editor",
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        toast.success("Project created successfully!")
        router.push(`/studio/editor/${data.data.id}`)
      } else {
        toast.error("Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project")
    } finally {
      setCreating(false)
    }
  }

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name)
  }

  const handleUploadComplete = async (filePath: string) => {
    try {
      // Get video metadata
      const metadataResponse = await fetch("/api/editor/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath: filePath }),
      })

      const metadataData = await metadataResponse.json()

      if (!metadataData.success) {
        toast.error("Failed to get video metadata")
        return
      }

      // Create project with the uploaded video
      const response = await fetch("/api/editor/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Video Project ${new Date().toLocaleDateString()}`,
          description: "Created from uploaded video",
          sourceVideoUrl: filePath,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        toast.success("Project created successfully!")
        router.push(`/studio/editor/${data.data.id}`)
      } else {
        toast.error("Failed to create project")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project")
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-purple-400" />
            Video Editor
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and edit professional videos with our timeline editor
          </p>
        </div>
        <Link href="/studio">
          <Button variant="outline" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            View Projects
          </Button>
        </Link>
      </div>

      {/* Quick Actions or Upload Area */}
      {!showUpload ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Project */}
          <button
            onClick={handleCreateProject}
            disabled={creating}
            className="rounded-lg border bg-card p-8 hover:border-primary hover:bg-card/80 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {creating ? "Creating..." : "Create New Project"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start a new video editing project from scratch
                </p>
              </div>
            </div>
          </button>

          {/* Upload Video */}
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg border bg-card p-8 hover:border-purple-500 hover:bg-card/80 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Upload Video
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload a video file to start editing
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upload Video</h2>
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
          </div>
          <UploadArea
            onFileSelect={handleFileSelect}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Features Overview */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Features</h3>
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
      <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-2xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-500">Status Update</h3>
            <p className="text-sm text-blue-400/80 mt-2">
              <strong>Phase 2 Complete!</strong> All API routes and core infrastructure are ready.
              You can now create projects and upload videos. The editor workspace is in active development.
            </p>
            <p className="text-xs text-blue-400/60 mt-3">
              <strong>FFmpeg Required:</strong> Video processing features require FFmpeg to be installed on the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
