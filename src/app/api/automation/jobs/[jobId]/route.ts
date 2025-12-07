/**
 * DELETE /api/automation/jobs/[jobId]
 * Delete an automation job and its associated files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobStore } from '@/lib/automation/job-store';
import { getTempManager } from '@/lib/automation/temp-manager';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const jobStore = getJobStore();
    const tempManager = getTempManager();

    // Get job to verify it exists
    const job = await jobStore.get(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Don't allow deletion of running jobs
    if (
      job.status === 'downloading' ||
      job.status === 'chunking' ||
      job.status === 'dubbing' ||
      job.status === 'merging' ||
      job.status === 'finalizing'
    ) {
      return NextResponse.json(
        { error: 'Cannot delete a job that is currently running. Please cancel it first.' },
        { status: 400 }
      );
    }

    // Clean up all temp files associated with the job
    await tempManager.cleanupJobFiles(jobId);

    // Delete the job record
    await jobStore.delete(jobId);

    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
