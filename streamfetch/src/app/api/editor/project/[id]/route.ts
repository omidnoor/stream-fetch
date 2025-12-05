/**
 * API Route: Individual Editor Project Operations
 *
 * GET /api/editor/project/[id] - Get specific project
 * PUT /api/editor/project/[id] - Update project
 * DELETE /api/editor/project/[id] - Delete project
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const editorService = getEditorService();

    const project = await editorService.getProject(id);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const editorService = getEditorService();

    const projectDto = await editorService.updateProject(id, body);

    return NextResponse.json({
      success: true,
      data: projectDto,
      message: "Project updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const editorService = getEditorService();

    await editorService.deleteProject(id);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
