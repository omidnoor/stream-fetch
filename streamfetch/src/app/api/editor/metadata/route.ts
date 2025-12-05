/**
 * API Route: Get Video Metadata
 *
 * POST /api/editor/metadata
 *
 * Retrieves metadata (duration, resolution, etc.) for a video file
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath } = body;

    if (!videoPath) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETER",
            message: "videoPath is required",
          },
        },
        { status: 400 }
      );
    }

    const editorService = getEditorService();

    // Get video metadata
    const metadata = await editorService.getVideoMetadata(videoPath);

    console.log("[API] Video metadata retrieved:", videoPath);

    return NextResponse.json({
      success: true,
      data: metadata,
      message: "Metadata retrieved successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
