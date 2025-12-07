/**
 * POST /api/automation/cancel/[jobId]
 * Cancel a running automation job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationService } from '@/services/automation';
import type { CancelJobResponse } from '@/services/automation';

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

    const automationService = getAutomationService();
    await automationService.cancelJob(jobId);

    const response: CancelJobResponse = {
      success: true,
      message: 'Job cancelled successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error cancelling job:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
