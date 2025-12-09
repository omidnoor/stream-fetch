/**
 * API Route: Clip Transform
 *
 * PUT /api/editor/project/[id]/clip/[clipId]/transform - Update clip transform
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { UpdateTransformDto } from "@/lib/editor/types";
import { validateTransform, clampScale, normalizeRotation, clampCrop } from "@/lib/editor/utils";

/**
 * PUT - Update transform for a clip
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: projectId, clipId } = await params;
    const body: UpdateTransformDto = await request.json();

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the clip
    const clip = project.timeline.clips.find((c) => c.id === clipId);

    if (!clip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CLIP_NOT_FOUND",
            message: "Clip not found",
          },
        },
        { status: 404 }
      );
    }

    // Get current transform or initialize
    const currentTransform = clip.transform || {
      clipId,
      scale: 1.0,
      rotation: 0,
      position: { x: 0, y: 0 },
      crop: { top: 0, right: 0, bottom: 0, left: 0 },
      flipH: false,
      flipV: false,
      lockAspectRatio: true,
    };

    // Build updated transform
    const updatedTransform = {
      ...currentTransform,
      ...(body.scale !== undefined && { scale: clampScale(body.scale) }),
      ...(body.rotation !== undefined && { rotation: normalizeRotation(body.rotation) }),
      ...(body.position && {
        position: { ...currentTransform.position, ...body.position },
      }),
      ...(body.crop && {
        crop: clampCrop(
          { ...currentTransform.crop, ...body.crop },
          clip.metadata?.width || 1920,
          clip.metadata?.height || 1080
        ),
      }),
      ...(body.flipH !== undefined && { flipH: body.flipH }),
      ...(body.flipV !== undefined && { flipV: body.flipV }),
      ...(body.lockAspectRatio !== undefined && { lockAspectRatio: body.lockAspectRatio }),
    };

    // Validate transform
    const validation = validateTransform(
      updatedTransform,
      clip.metadata?.width,
      clip.metadata?.height
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TRANSFORM",
            message: validation.errors.join(", "),
            errors: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Update the clip
    const clipIndex = project.timeline.clips.findIndex((c) => c.id === clipId);
    project.timeline.clips[clipIndex] = {
      ...clip,
      transform: updatedTransform,
    };

    // Save project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Transform updated for clip: ${clipId}`);

    return NextResponse.json({
      success: true,
      data: updatedTransform,
      message: "Transform updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
