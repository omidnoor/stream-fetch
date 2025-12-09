import { Skeleton } from "@/components/ui/skeleton"

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>

        {/* Metadata skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>

        <Skeleton className="h-3 w-24" />

        {/* Actions skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PDFProjectCardSkeleton() {
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-6">
      {/* Icon and status */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-2" />

      {/* Info lines */}
      <div className="space-y-1 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-10" />
      </div>
    </div>
  )
}

export function PDFProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PDFProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}
