/**
 * API Route: Download Dubbed Audio
 *
 * GET /api/dubbing/download?dubbingId=xxx&targetLanguage=es
 *
 * Downloads the dubbed audio file
 *
 * REFACTORED VERSION using Service Layer Pattern
 *
 * EDUCATIONAL NOTE: Service Layer Benefits
 *
 * Before refactoring: Direct calls to helper functions (69 lines)
 * - Inline validation logic
 * - Direct API interaction
 * - Manual filename generation
 * - Generic error handling
 *
 * After refactoring: Use DubbingService (~50 lines)
 * - Service handles validation
 * - Service checks job completion status
 * - Service provides proper filenames
 * - Better error handling (job not complete, job failed, etc.)
 *
 * Benefits of Refactored Version:
 * ✅ 28% less code in API route
 * ✅ Automatic status checking before download
 * ✅ Better error messages
 * ✅ Proper filename generation
 * ✅ Testable business logic
 */

import { NextRequest, NextResponse } from "next/server";
import { getDubbingService } from "@/services/dubbing";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dubbingId = searchParams.get("dubbingId");
    const targetLanguage = searchParams.get("targetLanguage");

    /**
     * EDUCATIONAL NOTE: Basic Input Validation
     *
     * We check for required parameters at the HTTP layer.
     * More detailed validation is handled by the service:
     * - Dubbing ID format validation
     * - Language code validation
     * - Job completion status check
     */
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

    /**
     * EDUCATIONAL NOTE: Service Layer Pattern
     *
     * The DubbingService handles the complete download workflow:
     * 1. Validates dubbing ID format
     * 2. Validates language code
     * 3. Checks if job is complete (throws DubbingNotCompleteError if not)
     * 4. Checks if job failed (throws DubbingJobFailedError if failed)
     * 5. Downloads audio from ElevenLabs API
     * 6. Generates proper filename
     * 7. Returns structured DTO with all metadata
     *
     * All of this is handled by one service call!
     */
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

    /**
     * EDUCATIONAL NOTE: Buffer to Uint8Array Conversion
     *
     * Node.js Buffer objects need to be converted to Uint8Array
     * for compatibility with NextResponse.
     *
     * This is a Web Standards API requirement.
     */
    const uint8Array = new Uint8Array(audioDto.audioBuffer);

    /**
     * EDUCATIONAL NOTE: HTTP Headers for Audio Downloads
     *
     * Content-Type: Tells the browser this is audio data
     * - Service provides the correct MIME type (audio/mpeg)
     *
     * Content-Disposition: How to handle the file
     * - attachment: Download as file (not play inline)
     * - filename: Proper filename from service
     *   (includes dubbing ID and language, sanitized)
     */
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": audioDto.mimeType,
        "Content-Disposition": `attachment; filename="${audioDto.filename}"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });

  } catch (error) {
    /**
     * EDUCATIONAL NOTE: Centralized Error Handling
     *
     * The errorHandler middleware handles specific errors:
     * - DubbingNotCompleteError (409 Conflict)
     *   → "Job is still processing, try again later"
     * - DubbingJobFailedError (500)
     *   → "Job failed with reason: X"
     * - DubbingJobNotFoundError (404)
     *   → "Job not found"
     * - InvalidLanguageError (400)
     *   → "Invalid language code"
     * - AudioDownloadError (500)
     *   → "Failed to download audio"
     *
     * Each error has the appropriate HTTP status code!
     */
    return errorHandler(error);
  }
}

/**
 * EDUCATIONAL NOTE: Comparing Before and After
 *
 * BEFORE (Old version - 69 lines):
 * ├── Get query parameters
 * ├── Validate dubbingId (inline)
 * ├── Validate targetLanguage (inline)
 * ├── Check language against SUPPORTED_LANGUAGES
 * ├── Call downloadDubbedAudio() helper
 * ├── Convert Buffer to Uint8Array
 * ├── Generate filename manually
 * ├── Return response
 * └── Generic error handling
 *
 * AFTER (Refactored - ~50 lines without comments):
 * ├── Get query parameters
 * ├── Basic null checks
 * ├── Get DubbingService
 * ├── Call service.downloadDubbedAudio()
 *     ├── (Service validates inputs)
 *     ├── (Service checks job status)
 *     ├── (Service downloads audio)
 *     └── (Service generates filename)
 * ├── Convert Buffer to Uint8Array
 * ├── Return response with proper headers
 * └── Centralized error handling
 *
 * Benefits of Refactored Version:
 * ================================
 * ✅ 28% less code in API route
 * ✅ Automatic job completion check
 * ✅ Better error handling with specific error types
 * ✅ Proper filename generation by service
 * ✅ Business logic is testable
 * ✅ Logic is reusable
 * ✅ Service handles all ElevenLabs-specific logic
 * ✅ Route only handles HTTP concerns
 *
 * Error Handling Improvements:
 * - Before: Generic 500 error for everything
 * - After: Specific errors with proper status codes
 *   - 400: Invalid language
 *   - 404: Job not found
 *   - 409: Job not complete yet
 *   - 500: Job failed or download error
 */
