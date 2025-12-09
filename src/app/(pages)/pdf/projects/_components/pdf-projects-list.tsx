import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPDFProjectRepository } from "@/lib/database/repositories/pdf-project.repository"
import { PDFProject } from "@/services/pdf/pdf.types"
import { PDFProjectCard } from "./pdf-project-card"

// Server Component - fetches data directly from DB
export async function PDFProjectsList() {
  const repository = getPDFProjectRepository()

  let projects: PDFProject[] = []
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
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-lg">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No PDF projects yet
        </h2>
        <p className="text-muted-foreground mb-6">
          Upload a PDF to get started with editing
        </p>
        <label htmlFor="pdf-upload-empty">
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <span className="cursor-pointer">
              <Upload className="h-5 w-5 mr-2" />
              Upload Your First PDF
            </span>
          </Button>
          <input
            id="pdf-upload-empty"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
          />
        </label>
      </div>
    )
  }

  // Projects Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <PDFProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            status: project.status,
            pageCount: project.metadata?.pageCount ?? 0,
            fileSize: project.metadata?.fileSize ?? 0,
            annotationCount: project.annotations?.length ?? 0,
            createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : String(project.createdAt),
            updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : String(project.updatedAt),
          }}
        />
      ))}
    </div>
  )
}
