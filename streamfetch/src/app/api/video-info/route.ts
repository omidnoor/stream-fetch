import { NextRequest, NextResponse } from "next/server";
import { getYouTubeService } from "@/services/youtube";
import { errorHandler } from "@/middleware/error-handler";

/**
 * Video Info API Endpoint
 *
 * REFACTORED VERSION using Service Layer Pattern
 *
 * EDUCATIONAL NOTE: CORS Bypass - Part 1
 *
 * Why this API route exists:
 * -------------------------
 * 1. Browser CORS Restriction: If we try to fetch YouTube data directly from
 *    the client (browser), we get a CORS error because YouTube doesn't set
 *    the "Access-Control-Allow-Origin" header for our domain.
 *
 * 2. Server-Side Solution: This Next.js API route runs on the SERVER, not in
 *    the browser. Browsers enforce CORS, but servers don't have this restriction.
 *
 * 3. Flow:
 *    Client (Browser) → Our API Route (Server) → YouTube → Back to Client
 *
 *    The client can call our API (same origin, no CORS issue)
 *    Our server can call YouTube (no browser, no CORS enforcement)
 *
 * This is called a "proxy pattern" - we act as a middleman between
 * the client and YouTube.
 *
 * REFACTORING IMPROVEMENTS:
 * - Business logic moved to YouTubeService
 * - Validation handled by YouTubeValidator
 * - Data transformation in YouTubeMapper
 * - Caching implemented in service layer
 * - Cleaner error handling
 * - Easier to test and maintain
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

    /**
     * EDUCATIONAL NOTE: Service Layer Pattern
     *
     * Before refactoring: All logic was here (206 lines)
     * - Validation
     * - Fetching with fallbacks
     * - Data transformation
     * - Error handling
     *
     * After refactoring: Simple orchestration (~50 lines)
     * - Just call the service
     * - Let it handle the complexity
     * - Service can be reused anywhere
     * - Easy to test with mocks
     */

    // Get the YouTube service (singleton)
    const youtubeService = getYouTubeService();

    // Let the service handle everything
    const videoInfo = await youtubeService.getVideoInfo(url);

    console.log('[API] Video info retrieved successfully:', {
      title: videoInfo.video.title,
      formatCount: videoInfo.formats.length
    });

    /**
     * EDUCATIONAL NOTE: Response Format
     *
     * We maintain the same response structure as before,
     * so existing clients don't break. This is called
     * "backward compatibility".
     */
    return NextResponse.json({
      success: true,
      data: videoInfo,
    });

  } catch (error) {
    /**
     * EDUCATIONAL NOTE: Centralized Error Handling
     *
     * The errorHandler middleware:
     * - Converts AppError instances to proper responses
     * - Logs errors appropriately
     * - Returns standardized error format
     * - Doesn't expose internal errors to clients
     */
    return errorHandler(error);
  }
}

/**
 * EDUCATIONAL NOTE: Comparing Before and After
 *
 * BEFORE (Old version - 206 lines):
 * ├── Input validation (inline)
 * ├── Business logic (getVideoInfoWithFallback)
 * ├── Data transformation (mapping formats)
 * ├── Response building
 * └── Error handling (try/catch with console.error)
 *
 * AFTER (Refactored - ~50 lines):
 * ├── Input check (missing URL)
 * ├── Get service (getYouTubeService)
 * ├── Call service method
 * ├── Return response
 * └── Centralized error handling
 *
 * Benefits of Refactored Version:
 * ================================
 * ✅ 4x less code in API route (206 → ~50 lines)
 * ✅ Business logic is testable (can mock service)
 * ✅ Logic is reusable (service works anywhere)
 * ✅ Better error handling (typed errors)
 * ✅ Built-in caching (automatic in service)
 * ✅ Easier to maintain (single responsibility)
 * ✅ Easier to extend (add features in service)
 *
 * The complexity didn't disappear - it moved to where it belongs:
 * - Validation → YouTubeValidator
 * - Fetching → YouTubeRepository
 * - Transformation → YouTubeMapper
 * - Orchestration → YouTubeService
 * - Error handling → Error classes + middleware
 *
 * Each component has ONE job and does it well.
 * This is the "Single Responsibility Principle" in action.
 */
