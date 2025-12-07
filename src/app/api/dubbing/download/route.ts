/**
 * API Route: Download Dubbed Audio
 *
 * GET /api/dubbing/download?dubbingId=xxx&targetLanguage=es
 *
 * Downloads the dubbed audio file
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
    const targetLanguage = searchParams.get("targetLanguage");

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
    const audioDto = await dubbingService.downloadDubbedAudio(
      dubbingId,
      targetLanguage
    );

    console.log('[API] Downloaded dubbed audio:', {
      dubbingId: audioDto.dubbingId,
      language: audioDto.targetLanguage,
      filename: audioDto.filename,
      size: audioDto.audioBuffer.length
    });

    const uint8Array = new Uint8Array(audioDto.audioBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": audioDto.mimeType,
        "Content-Disposition": `attachment; filename="${audioDto.filename}"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });

  } catch (error) {
    return errorHandler(error);
  }
}

