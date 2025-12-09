import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PDFProjectGridSkeleton } from "@/components/skeletons/project-card-skeleton"

export default function PDFProjectsLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PDF Projects</h1>
            <p className="text-muted-foreground">
              Manage your PDF editing projects
            </p>
          </div>

          <Button disabled className="bg-primary hover:bg-primary/90">
            <Upload className="h-5 w-5 mr-2" />
            Upload PDF
          </Button>
        </div>

        {/* Projects Skeleton */}
        <PDFProjectGridSkeleton count={6} />
      </div>
    </div>
  )
}
