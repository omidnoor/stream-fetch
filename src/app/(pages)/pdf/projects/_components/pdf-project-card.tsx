"use client"

import { FileText, FolderOpen, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PDFProjectCardProps {
  project: {
    id: string
    name: string
    status: string
    pageCount: number
    fileSize: number
    annotationCount: number
    createdAt: string
    updatedAt: string
  }
}

export function PDFProjectCard({ project }: PDFProjectCardProps) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await fetch(`/api/pdf/project/${project.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Project deleted successfully")
        router.refresh() // Revalidate server component data
      } else {
        toast.error(data.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error("Failed to delete project")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "processing":
        return "bg-yellow-500/10 text-yellow-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-muted-foreground"
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-6 hover:border-border transition-colors">
      {/* Project Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <span className={`text-xs px-2 py-1 rounded ${getStatusStyles(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Project Info */}
      <h3 className="text-lg font-semibold text-white mb-2 truncate">
        {project.name}
      </h3>

      <div className="space-y-1 mb-4">
        <p className="text-sm text-muted-foreground">
          {project.pageCount} page{project.pageCount !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatFileSize(project.fileSize)}
        </p>
        <p className="text-sm text-muted-foreground">
          {project.annotationCount} annotation
          {project.annotationCount !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(project.updatedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => router.push(`/pdf?projectId=${project.id}`)}
          className="flex-1 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open
        </Button>
        <Button
          onClick={handleDelete}
          variant="outline"
          size="sm"
          className="border-border hover:border-red-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
