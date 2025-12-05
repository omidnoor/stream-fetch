/**
 * API Route: Generate Thumbnail
 *
 * POST /api/editor/thumbnail
 *
 * Generates a thumbnail from a video file at a specific timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, timeOffset, projectId } = body;

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

    // Generate thumbnail filename
    const timestamp = Date.now();
    const thumbnailFilename = projectId
      ? `${projectId}_thumbnail_${timestamp}.jpg`
      : `thumbnail_${timestamp}.jpg`;

    // Use the editor repository to get the output path
    const outputPath = path.join(
      process.cwd(),
      ".cache",
      "editor",
      "output",
      thumbnailFilename
    );

    // Generate thumbnail
    await editorService.generateThumbnail(
      videoPath,
      outputPath,
      timeOffset ?? 1
    );

    console.log("[API] Thumbnail generated:", outputPath);

    return NextResponse.json({
      success: true,
      data: {
        thumbnailPath: outputPath,
        filename: thumbnailFilename,
      },
      message: "Thumbnail generated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
