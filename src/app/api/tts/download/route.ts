/**
 * API Route: Download TTS Audio
 *
 * GET /api/tts/download?jobId=xxx
 *
 * Download the generated audio for a completed TTS job
 *
 * Query Parameters:
 * - jobId: The job ID from /api/tts/generate
 *
 * Response:
 * - Audio file download (WAV/MP3)
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
    const audioDto = await ttsService.downloadAudio(jobId);

    console.log('[API] TTS download:', {
      jobId,
      size: audioDto.audioBuffer.length,
      filename: audioDto.filename,
    });

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const audioData = new Uint8Array(audioDto.audioBuffer);

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': audioDto.mimeType,
        'Content-Disposition': `attachment; filename="${audioDto.filename}"`,
        'Content-Length': audioDto.audioBuffer.length.toString(),
        'X-TTS-Job-Id': audioDto.jobId,
        'X-TTS-Duration': audioDto.duration.toString(),
        'X-TTS-Sample-Rate': audioDto.sampleRate.toString(),
      },
    });

  } catch (error) {
    return errorHandler(error);
  }
}
