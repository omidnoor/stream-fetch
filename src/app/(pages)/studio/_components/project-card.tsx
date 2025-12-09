"use client"

import { FolderOpen, Edit, Trash2, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string
    thumbnail?: string
    status: "draft" | "processing" | "completed" | "failed"
    duration: number
    createdAt: string
    updatedAt: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()

  const deleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await fetch(`/api/editor/project/${project.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Project deleted successfully")
        router.refresh() // Revalidate server component data
      } else {
        toast.error("Failed to delete project")
      }
    } catch (err) {
      console.error("Error deleting project:", err)
      toast.error("Failed to delete project")
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

  const getStatusColor = (status: ProjectCardProps["project"]["status"]) => {
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
    <div className="rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors group">
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
          <h3 className="font-semibold truncate">{project.name}</h3>
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
          <div className={getStatusColor(project.status)}>{project.status}</div>
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
            onClick={deleteProject}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
