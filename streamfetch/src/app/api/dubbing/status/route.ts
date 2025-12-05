/**
 * API Route: Check Dubbing Status
 *
 * GET /api/dubbing/status?dubbingId=xxx
 *
 * Checks the status of a dubbing job
 *
 * REFACTORED VERSION using Service Layer Pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { getDubbingService } from "@/services/dubbing";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dubbingId = searchParams.get("dubbingId");

    if (!dubbingId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'dubbingId is required'
          }
        },
        { status: 400 }
      );
    }

    const dubbingService = getDubbingService();
    const statusDto = await dubbingService.getDubbingStatus(dubbingId);

    console.log('[API] Dubbing status:', {
      dubbingId: statusDto.dubbingId,
      status: statusDto.status,
      progressPercent: statusDto.progressPercent
    });

    return NextResponse.json({
      success: true,
      data: statusDto
    });

  } catch (error) {
    return errorHandler(error);
  }
}
