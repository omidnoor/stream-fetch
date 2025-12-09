import { FolderOpen, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getVideoProjectRepository } from "@/lib/database/repositories/video-project.repository"
import { VideoProject } from "@/services/editor/editor.types"
import { ProjectCard } from "./project-card"

// Server Component - fetches data directly from DB
export async function ProjectsList() {
  const repository = getVideoProjectRepository()

  let projects: VideoProject[] = []
  let error: string | null = null

  try {
    projects = await repository.listProjects()
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects"
    projects = []
  }

  // Error State
  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  // Empty State
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-6 text-xl font-semibold">No projects yet</h3>
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
    )
  }

  // Projects Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            thumbnail: project.thumbnail,
            status: project.status,
            duration: project.timeline?.duration ?? 0,
            createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : String(project.createdAt),
            updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : String(project.updatedAt),
          }}
        />
      ))}
    </div>
  )
}
