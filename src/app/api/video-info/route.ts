import { NextRequest, NextResponse } from "next/server";
import { getYouTubeService } from "@/services/youtube";
import { errorHandler } from "@/middleware/error-handler";

/**
 * Video Info API Endpoint
 *
 * REFACTORED VERSION using Service Layer Pattern
 */

export async function GET(request: NextRequest) {
  try {
    // Extract URL parameter
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'URL parameter is required'
          }
        },
        { status: 400 }
      );
    }

    // Get the YouTube service (singleton)
    const youtubeService = getYouTubeService();

    // Let the service handle everything
    const videoInfo = await youtubeService.getVideoInfo(url);

    console.log('[API] Video info retrieved successfully:', {
      title: videoInfo.video.title,
      formatCount: videoInfo.formats.length
    });

    return NextResponse.json({
      success: true,
      data: videoInfo,
    });

  } catch (error) {
    return errorHandler(error);
  }
}
