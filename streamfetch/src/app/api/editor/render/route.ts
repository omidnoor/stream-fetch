/**
 * API Route: Render Video Project
 *
 * POST /api/editor/render
 *
 * Starts rendering a video project
 * Returns a job ID that can be used to track progress
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, settings } = body;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETER",
            message: "projectId is required",
          },
        },
        { status: 400 }
      );
    }

    const editorService = getEditorService();

    // Default export settings if not provided
    const exportSettings = {
      format: settings?.format || "mp4",
      quality: settings?.quality || "high",
      resolution: settings?.resolution,
      frameRate: settings?.frameRate,
      bitrate: settings?.bitrate,
    };

    // Start export job
    const jobDto = await editorService.exportProject({
      projectId,
      settings: exportSettings,
    });

    console.log("[API] Render job started:", jobDto.jobId);

    return NextResponse.json({
      success: true,
      data: jobDto,
      message: "Render job started successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
