/**
 * POST /api/automation/retry/[jobId]
 * Retry failed chunks for a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationService } from '@/services/automation';
import type { RetryJobRequest, RetryJobResponse } from '@/services/automation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Parse request body (optional chunk indices to retry)
    let body: RetryJobRequest = {};
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON, retry all failed chunks
    }

    const automationService = getAutomationService();
    const chunksToRetry = await automationService.retryFailedChunks(
      jobId,
      body.chunksToRetry
    );

    const response: RetryJobResponse = {
      success: true,
      chunksToRetry,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrying job:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retry job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
