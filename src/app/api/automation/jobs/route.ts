/**
 * GET /api/automation/jobs
 * List all automation jobs with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobStore } from '@/lib/automation/job-store';
import type { ListJobsResponse, JobStatus } from '@/services/automation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as JobStatus | null;

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    const jobStore = getJobStore();

    // Get jobs with filter
    const jobs = await jobStore.list({
      limit,
      offset,
      status: status || undefined,
    });

    // Get total count
    const total = await jobStore.count({
      status: status || undefined,
    });

    const response: ListJobsResponse = {
      jobs,
      total,
      hasMore: offset + jobs.length < total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing jobs:', error);

    return NextResponse.json(
      {
        error: 'Failed to list jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
