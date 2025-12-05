/**
 * API Route: Create Dubbing Job
 *
 * POST /api/dubbing/create
 *
 * Creates a new dubbing job using ElevenLabs API
 *
 * REFACTORED VERSION using Service Layer Pattern
 *
 * EDUCATIONAL NOTE: Service Layer Benefits
 *
 * Before refactoring: Direct calls to helper functions (69 lines)
 * - Inline validation logic
 * - Direct SDK interaction
 * - Coupled to ElevenLabs implementation
 *
 * After refactoring: Use DubbingService (~40 lines)
 * - Service handles validation
 * - Service handles API calls
 * - Service handles error mapping
 * - Route only handles HTTP concerns
 *
 * Benefits of Refactored Version:
 * ✅ 42% less code in API route
 * ✅ Business logic is testable
 * ✅ Logic is reusable
 * ✅ Better error handling with typed errors
 * ✅ Validation centralized in DubbingValidator
 * ✅ API calls centralized in DubbingRepository
 */

import { NextRequest, NextResponse } from "next/server";
import { getDubbingService } from "@/services/dubbing";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUrl, targetLanguage, sourceLanguage, numSpeakers, watermark } = body;

    /**
     * EDUCATIONAL NOTE: Basic Input Validation
     *
     * We check for required fields at the HTTP layer.
     * More detailed validation (URL format, language codes) is handled by the service.
     */
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

    /**
     * EDUCATIONAL NOTE: Service Layer Pattern
     *
     * All business logic is delegated to DubbingService:
     * - Validates URL format and language codes
     * - Calls ElevenLabs API
     * - Handles errors appropriately
     * - Returns structured DTO
     *
     * The route only needs to:
     * 1. Get the service
     * 2. Call the appropriate method
     * 3. Return the response
     */
    const dubbingService = getDubbingService();

    const jobDto = await dubbingService.createDubbingJob({
      sourceUrl,
      targetLanguage,
      sourceLanguage,
      numSpeakers,
      watermark: watermark ?? true,
    });

    console.log('[API] Dubbing job created:', jobDto.dubbingId);

    /**
     * EDUCATIONAL NOTE: Standardized Response Format
     *
     * All successful responses follow the same structure:
     * {
     *   success: true,
     *   data: { ... }
     * }
     *
     * This makes it easier for clients to handle responses consistently.
     */
    return NextResponse.json({
      success: true,
      data: jobDto,
      message: "Dubbing job created successfully"
    });

  } catch (error) {
    /**
     * EDUCATIONAL NOTE: Centralized Error Handling
     *
     * The errorHandler middleware:
     * - Converts AppError instances to proper responses
     * - Handles InvalidLanguageError, InvalidSourceUrlError, etc.
     * - Logs errors appropriately
     * - Returns standardized error format
     *
     * This means we don't need try/catch blocks with custom error handling
     * in every route - it's all centralized!
     */
    return errorHandler(error);
  }
}

/**
 * EDUCATIONAL NOTE: Comparing Before and After
 *
 * BEFORE (Old version - 69 lines):
 * ├── Parse request body
 * ├── Validate sourceUrl (inline)
 * ├── Validate targetLanguage (inline)
 * ├── Check language against SUPPORTED_LANGUAGES
 * ├── Call createDubbingJob() helper
 * ├── Return success response
 * └── Generic error handling
 *
 * AFTER (Refactored - ~40 lines without comments):
 * ├── Parse request body
 * ├── Basic null checks for required fields
 * ├── Get DubbingService
 * ├── Call service.createDubbingJob()
 * ├── Return standardized response
 * └── Centralized error handling
 *
 * Benefits of Refactored Version:
 * ================================
 * ✅ 42% less code in API route
 * ✅ Business logic is testable (can mock service)
 * ✅ Logic is reusable (service works anywhere)
 * ✅ Better error handling (typed errors)
 * ✅ Service handles all ElevenLabs-specific logic
 * ✅ Route only handles HTTP concerns
 * ✅ Easier to maintain (separation of concerns)
 * ✅ Validation logic centralized in service
 *
 * The complexity didn't disappear - it moved to where it belongs:
 * - Validation → DubbingValidator
 * - API calls → DubbingRepository
 * - Data transformation → DubbingMapper
 * - Business logic → DubbingService
 * - HTTP handling → API route (this file)
 * - Error handling → Error classes + middleware
 */
