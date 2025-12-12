import { Suspense } from "react"
import { FolderOpen, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProjectGridSkeleton } from "@/components/skeletons/project-card-skeleton"
import { ProjectsList } from "@/components/editor/projects-list"

export default function StudioPage() {
  return (
    <div className="w-full space-y-8">
      {/* Header - renders immediately */}
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

      {/* Projects - streams in from DB */}
      <Suspense fallback={<ProjectGridSkeleton count={6} />}>
        <ProjectsList />
      </Suspense>
    </div>
  )
}
