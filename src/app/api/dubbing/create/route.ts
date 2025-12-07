/**
 * API Route: Create Dubbing Job
 *
 * POST /api/dubbing/create
 *
 * Creates a new dubbing job using ElevenLabs API
 *
 * REFACTORED VERSION using Service Layer Pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { getDubbingService } from "@/services/dubbing";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, targetLanguage, sourceLanguage, numSpeakers, watermark } = body;

    if (!sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'sourceUrl is required'
          }
        },
        { status: 400 }
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'targetLanguage is required'
          }
        },
        { status: 400 }
      );
    }

    const dubbingService = getDubbingService();

    const jobDto = await dubbingService.createDubbingJob({
      sourceUrl,
      targetLanguage,
      sourceLanguage,
      numSpeakers,
      watermark: watermark ?? true,
    });

    console.log('[API] Dubbing job created:', jobDto.dubbingId);

    return NextResponse.json({
      success: true,
      data: jobDto,
      message: "Dubbing job created successfully"
    });

  } catch (error) {
    return errorHandler(error);
  }
}
