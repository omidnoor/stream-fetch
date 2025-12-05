"use client"

import { ArrowLeft, Plus, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DubbingJobsPage() {
  // Placeholder data - in a real app, this would come from a backend API
  const dubbingJobs: any[] = [
    // Empty for now - will be populated when users create dubbing jobs
  ]

  // Example job statuses: 'processing', 'completed', 'failed', 'pending'
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"

    switch (status) {
      case 'processing':
        return `${baseClasses} bg-blue-500/10 text-blue-500`
      case 'completed':
        return `${baseClasses} bg-green-500/10 text-green-500`
      case 'failed':
        return `${baseClasses} bg-red-500/10 text-red-500`
      case 'pending':
        return `${baseClasses} bg-yellow-500/10 text-yellow-500`
      default:
        return baseClasses
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dubbing" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Dubbing Jobs</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and track your AI dubbing jobs
          </p>
        </div>
        <Button asChild>
          <Link href="/dubbing" className="gap-2">
            <Plus className="h-4 w-4" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Total Jobs</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-blue-500">0</div>
          <div className="text-sm text-muted-foreground">Processing</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-green-500">0</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-500">0</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Empty State */}
      {dubbingJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="mt-6 text-xl font-semibold">No dubbing jobs yet</h3>
          <p className="mt-2 max-w-md text-muted-foreground">
            Create your first dubbing job to translate and dub videos into different languages.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/dubbing">Create Dubbing Job</Link>
          </Button>
        </div>
      )}

      {/* Jobs List - Will be populated when users create jobs */}
      {dubbingJobs.length > 0 && (
        <div className="space-y-4">
          {dubbingJobs.map((job: any, index: number) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border bg-card p-6 transition-colors hover:bg-card/80"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 pt-1">
                {getStatusIcon(job.status)}
              </div>

              {/* Job Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.sourceLanguage} → {job.targetLanguage}
                    </p>
                  </div>
                  <span className={getStatusBadge(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>

                {/* Progress Bar (for processing jobs) */}
                {job.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{job.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Job Details */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Duration: {job.duration}</span>
                  <span>Created: {job.createdAt}</span>
                  {job.completedAt && <span>Completed: {job.completedAt}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {job.status === 'completed' && (
                    <Button size="sm">Download Audio</Button>
                  )}
                  {job.status === 'failed' && (
                    <Button size="sm" variant="outline">Retry</Button>
                  )}
                  <Button size="sm" variant="ghost">View Details</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold mb-2">Job Management</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Jobs are processed in the order they are created</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Completed jobs are stored for 30 days</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>You can cancel processing jobs at any time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Failed jobs can be retried without additional charges</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
