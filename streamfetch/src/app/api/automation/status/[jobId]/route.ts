/**
 * GET /api/automation/status/[jobId]
 * Get current status of an automation job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationService } from '@/services/automation';
import type { JobStatusResponse } from '@/services/automation';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const automationService = getAutomationService();
    const job = await automationService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const response: JobStatusResponse = {
      job,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting job status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
