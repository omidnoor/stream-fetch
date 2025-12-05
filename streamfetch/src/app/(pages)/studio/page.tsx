"use client"

import { useState, useEffect } from "react"
import { FolderOpen, Plus, Trash2, Edit, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string
  status: "draft" | "processing" | "completed" | "failed"
  duration: number
  createdAt: string
  updatedAt: string
}

export default function StudioPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/editor/project")
      const data = await response.json()

      if (data.success) {
        setProjects(data.data)
      } else {
        setError(data.error || "Failed to load projects")
      }
    } catch (err) {
      console.error("Error loading projects:", err)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await fetch(`/api/editor/project/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProjects(projects.filter((p) => p.id !== projectId))
      } else {
        alert("Failed to delete project")
      }
    } catch (err) {
      console.error("Error deleting project:", err)
      alert("Failed to delete project")
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "draft":
        return "text-gray-400"
      case "processing":
        return "text-blue-400"
      case "completed":
        return "text-green-400"
      case "failed":
        return "text-red-400"
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-purple-400" />
            Video Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your video editing projects
          </p>
        </div>
        <Link href="/studio/editor">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading projects...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-6 text-xl font-semibold">
            No projects yet
          </h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Create your first video editing project to get started
          </p>
          <Link href="/studio/editor">
            <Button className="gap-2 mt-6">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FolderOpen className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(project.duration)}
                  </div>
                  <div className={getStatusColor(project.status)}>
                    {project.status}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Updated {formatDate(project.updatedAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/studio/editor/${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Edit className="h-3 w-3" />
                      Open
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:border-red-400"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
