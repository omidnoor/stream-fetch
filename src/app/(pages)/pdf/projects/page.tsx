import { Suspense } from "react"
import { FileText, Upload } from "lucide-react"
import { PDFProjectGridSkeleton } from "@/components/skeletons/project-card-skeleton"
import { PDFProjectsList } from "./_components/pdf-projects-list"
import { UploadButton } from "./_components/upload-button"

export default function PDFProjectsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - renders immediately */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PDF Projects</h1>
            <p className="text-muted-foreground">
              Manage your PDF editing projects
            </p>
          </div>

          {/* Upload Button - client component */}
          <UploadButton />
        </div>

        {/* Projects Grid - streams in from DB */}
        <Suspense fallback={<PDFProjectGridSkeleton count={6} />}>
          <PDFProjectsList />
        </Suspense>
      </div>
    </div>
  )
}
