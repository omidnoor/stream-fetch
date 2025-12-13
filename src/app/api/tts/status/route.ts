/**
 * API Route: TTS Job Status
 *
 * GET /api/tts/status?jobId=xxx
 *
 * Get the status of an async TTS job
 *
 * Query Parameters:
 * - jobId: The job ID from /api/tts/generate (async mode)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     jobId: string,
 *     status: 'pending' | 'processing' | 'completed' | 'failed',
 *     progress: number,      // 0-100
 *     audioUrl?: string,     // Only when completed
 *     error?: string,        // Only when failed
 *     completedAt?: string,  // Only when completed
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getTTSService } from "@/services/tts";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'jobId query parameter is required'
          }
        },
        { status: 400 }
      );
    }

    const ttsService = getTTSService();
    const statusDto = await ttsService.getJobStatus(jobId);

    console.log('[API] TTS status:', {
      jobId,
      status: statusDto.status,
      progress: statusDto.progress,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: statusDto.jobId,
        status: statusDto.status,
        progress: statusDto.progress,
        audioUrl: statusDto.audioUrl,
        error: statusDto.error,
        audioDuration: statusDto.audioDuration,
        completedAt: statusDto.completedAt?.toISOString(),
      },
    });

  } catch (error) {
    return errorHandler(error);
  }
}
