import { NextRequest, NextResponse } from "next/server";
import { getYouTubeService } from "@/services/youtube";
import { errorHandler } from "@/middleware/error-handler";

/**
 * Download API Endpoint
 *
 * REFACTORED VERSION using Service Layer Pattern
 *
 * EDUCATIONAL NOTE: CORS Bypass - Part 2 (Streaming)
 *
 * This endpoint demonstrates streaming data through a server-side proxy.
 * Instead of downloading the entire video to our server and then sending it,
 * we stream it in chunks:
 *
 * YouTube → (chunk 1) → Our Server → (chunk 1) → Client
 * YouTube → (chunk 2) → Our Server → (chunk 2) → Client
 * ...and so on
 *
 * Benefits:
 * - Memory efficient (don't store entire video in RAM)
 * - Faster start time (client gets data immediately)
 * - Better for large files
 * - Supports progress tracking
 *
 * REFACTORING IMPROVEMENTS:
 * - Business logic moved to YouTubeService
 * - Format selection handled by service
 * - Validation in YouTubeValidator
 * - Cleaner error handling
 * - Reusable service layer
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

    /**
     * EDUCATIONAL NOTE: Service Layer Pattern
     *
     * Before refactoring: Direct calls to youtube-helper functions (224 lines)
     * - Format selection logic inline
     * - URL deciphering inline
     * - Validation inline
     *
     * After refactoring: Use YouTubeService (~80 lines)
     * - Service handles format selection
     * - Service handles URL deciphering
     * - Service handles validation
     * - Route only handles HTTP streaming
     */

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

    /**
     * EDUCATIONAL NOTE: Fetching from Deciphered URL
     *
     * The service has already deciphered the streaming URL.
     * These URLs are time-limited and IP-restricted.
     *
     * The URL contains:
     * - Signature parameter (prevents unauthorized access)
     * - Expiration timestamp (usually 6 hours)
     * - Server routing information
     *
     * We fetch from this URL with browser-like headers to avoid being blocked.
     */
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

    /**
     * EDUCATIONAL NOTE: Using Response Body Directly
     *
     * The fetch Response already has a ReadableStream body that we can use.
     * No need to convert from Node.js streams - it's already a Web Stream!
     */
    if (!videoResponse.body) {
      throw new Error("No response body available");
    }

    const videoStream = videoResponse.body;

    /**
     * EDUCATIONAL NOTE: HTTP Headers for Downloads
     *
     * These headers tell the browser how to handle the response:
     *
     * Content-Type: What kind of data this is (video/mp4, etc.)
     * - Helps browser decide how to process it
     * - Provided by the service
     *
     * Content-Disposition: How to handle the file
     * - attachment: Download as file
     * - filename: Suggested filename for download
     * - Sanitized by the service
     *
     * Cache-Control: Caching behavior
     * - no-cache: Don't cache this (videos are large and URLs expire)
     */

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

    /**
     * EDUCATIONAL NOTE: Web Streams Are Already Compatible!
     *
     * Since we used fetch(), the response.body is already a Web Stream.
     * No conversion needed! This is simpler than the Node.js stream approach.
     *
     * The videoStream (response.body) is a ReadableStream that:
     * - Provides data in chunks as it arrives from YouTube's CDN
     * - Automatically handles backpressure
     * - Is natively supported by Next.js Response
     * - Can be directly piped to the client
     */

    /**
     * EDUCATIONAL NOTE: Response with Streaming Body
     *
     * NextResponse with a ReadableStream body creates a streaming response.
     * The connection stays open and data flows as it arrives.
     *
     * vs. regular Response:
     * - Regular: All data must be ready before sending
     * - Streaming: Data sent progressively as available
     *
     * The flow with refactored service:
     * YouTube CDN → Our Server (streams through) → Client Browser
     * Data flows in real-time without being buffered!
     */
    return new NextResponse(videoStream, {
      headers,
    });

  } catch (error) {
    /**
     * EDUCATIONAL NOTE: Centralized Error Handling
     *
     * The errorHandler middleware:
     * - Converts AppError instances to proper responses
     * - Handles InvalidUrlError, FormatNotFoundError, etc.
     * - Logs errors appropriately
     * - Returns standardized error format
     */
    return errorHandler(error);
  }
}

/**
 * EDUCATIONAL NOTE: Comparing Before and After
 *
 * BEFORE (Old version - 224 lines):
 * ├── Input validation (inline)
 * ├── getVideoInfoWithFallback() call
 * ├── Format selection logic (if/else for itag)
 * ├── chooseFormat() helper call
 * ├── Format validation
 * ├── URL deciphering (already done by youtubei.js)
 * ├── Fetch from YouTube
 * ├── Stream setup
 * ├── Header configuration
 * ├── Filename sanitization
 * └── Error handling
 *
 * AFTER (Refactored - ~80 lines):
 * ├── Get service
 * ├── Parse itag parameter
 * ├── Call service.getDownloadFormat(url, itag)
 * ├── Fetch from deciphered URL (service provides URL)
 * ├── Stream to client with headers (service provides metadata)
 * └── Centralized error handling
 *
 * Benefits of Refactored Version:
 * ================================
 * ✅ 64% less code in API route (224 → ~80 lines)
 * ✅ Business logic is testable (can mock service)
 * ✅ Logic is reusable (service works anywhere)
 * ✅ Better error handling (typed errors)
 * ✅ Service handles all YouTube-specific logic
 * ✅ Route only handles HTTP concerns (streaming, headers)
 * ✅ Easier to maintain (separation of concerns)
 * ✅ Format selection logic centralized in service
 *
 * The complexity didn't disappear - it moved to where it belongs:
 * - Validation → YouTubeValidator
 * - Format selection → YouTubeService.getDownloadFormat()
 * - URL deciphering → YouTubeRepository (with fallbacks)
 * - Streaming → API route (HTTP concern)
 * - Error handling → Error classes + middleware
 *
 * Key Concepts Demonstrated:
 * - CORS bypass through server-side proxy
 * - Streaming vs buffering for large files
 * - Web Streams API compatibility
 * - HTTP headers for downloads
 * - Service layer for business logic
 * - Separation of HTTP concerns from business logic
 */
