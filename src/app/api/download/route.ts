import { NextRequest, NextResponse } from "next/server";
import { getYouTubeService } from "@/services/youtube";
import { errorHandler } from "@/middleware/error-handler";

/**
 * Download API Endpoint
 *
 * REFACTORED VERSION using Service Layer Pattern
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const itagParam = searchParams.get("itag");

    // Input validation
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

    // Get the YouTube service
    const youtubeService = getYouTubeService();

    // Parse itag if provided
    const itag = itagParam ? parseInt(itagParam) : undefined;

    // Get the download format from service
    // Service will validate URL, find format, and decipher URL
    const format = await youtubeService.getDownloadFormat(url, itag);

    console.log('[API] Download format retrieved:', {
      itag: format.itag,
      quality: format.quality,
      filename: format.filename
    });

    const videoResponse = await fetch(format.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'Range': 'bytes=0-', // Important: Request full range
      }
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`);
    }

    if (!videoResponse.body) {
      throw new Error("No response body available");
    }

    const videoStream = videoResponse.body;

    // Extract content type from format's mimeType
    const contentType = format.mimeType.split(';')[0] || 'video/mp4';

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${format.filename}"`,
      "Cache-Control": "no-cache",
    });

    // If we have content length, include it
    if (format.contentLength) {
      headers.set("Content-Length", format.contentLength);
    }

    return new NextResponse(videoStream, {
      headers,
    });

  } catch (error) {
    return errorHandler(error);
  }
}
