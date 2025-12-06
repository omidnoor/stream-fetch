/**
 * API Route: Editor Project Operations
 *
 * GET /api/editor/project - List all projects
 * POST /api/editor/project - Create new project
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

// GET /api/editor/project - List all projects
export async function GET(request: NextRequest) {
  try {
    const editorService = getEditorService();
    const projects = await editorService.listProjects();

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

// POST /api/editor/project - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const editorService = getEditorService();

    const project = await editorService.createProject({
      name: body.name || "Untitled Project",
      description: body.description || "",
      sourceVideoUrl: body.sourceVideoUrl,
      settings: body.settings,
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return errorHandler(error);
  }
}
