/**
 * API Route: Get Render Job Status
 *
 * GET /api/editor/render/[renderId]/status
 *
 * Returns the current status and progress of a render job.
 *
 * NOTE: The URL parameter is named [renderId] for semantic reasons,
 * but the frontend passes the projectId here since render status
 * is tracked at the project level in the current implementation.
 *
 * In a production system, you would have a job registry that maps
 * jobId (renderId) to projectId, but for simplicity, we accept
 * projectId directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  try {
    // Note: renderId parameter is actually the projectId from frontend
    const { renderId: projectIdOrRenderId } = await params;
    const editorService = getEditorService();

    // Try to get project status using the ID
    // This works because frontend passes projectId as renderId parameter
    const project = await editorService.getProject(projectIdOrRenderId);

    return NextResponse.json({
      success: true,
      status: project.status || "draft",
      progress: project.progress || 0,
      projectId: project.id,
      message: project.status === "failed" ? "Render failed" : undefined,
    });
  } catch (error) {
    // If project not found, return appropriate error
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROJECT_NOT_FOUND",
            message: "Project or render job not found",
          },
        },
        { status: 404 }
      );
    }

    return errorHandler(error);
  }
}
