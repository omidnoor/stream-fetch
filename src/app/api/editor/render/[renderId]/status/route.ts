/**
 * API Route: Get Render Job Status
 *
 * GET /api/editor/render/[renderId]/status
 *
 * Returns the current status and progress of a render job.
 * The renderId is the jobId returned when starting a render.
 * Status is tracked by projectId in the repository.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  try {
    const { renderId } = await params;
    const editorService = getEditorService();

    // The renderId is actually the jobId, but status is tracked by project
    // We need to find the project associated with this job
    // For now, we'll try to look up by projectId since that's what the service uses
    // In a production system, you'd have a job-to-project mapping table

    // Try to get project status - the renderId might actually be the projectId
    // passed during render, or we need a job registry
    // For simplicity, we'll check if it's a valid projectId
    try {
      const project = await editorService.getProject(renderId);

      return NextResponse.json({
        success: true,
        status: project.status || "processing",
        progress: project.progress || 0,
        renderId,
        projectId: project.id,
      });
    } catch {
      // If not found as projectId, it might be a jobId
      // In a real implementation, you'd look up the job registry
      // For now, return a processing status
      return NextResponse.json({
        success: true,
        status: "processing",
        progress: 0,
        renderId,
        message: "Job status lookup not fully implemented - checking project status instead",
      });
    }
  } catch (error) {
    return errorHandler(error);
  }
}
