/**
 * API Route: Individual Effect
 *
 * GET    /api/editor/project/[id]/effect/[effectId] - Get effect details
 * PUT    /api/editor/project/[id]/effect/[effectId] - Update effect
 * DELETE /api/editor/project/[id]/effect/[effectId] - Delete effect
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { UpdateEffectDto, ClipEffect, EffectType } from "@/lib/editor/types";

/**
 * Find effect in project timeline
 */
function findEffectInProject(
  project: { timeline: { clips: Array<{ id: string; effects?: Array<{ id: string; type: string; parameters: Record<string, any> }> }> } },
  effectId: string
): { clipIndex: number; effectIndex: number; clip: any; effect: any } | null {
  for (let clipIndex = 0; clipIndex < project.timeline.clips.length; clipIndex++) {
    const clip = project.timeline.clips[clipIndex];
    const effects = clip.effects || [];
    const effectIndex = effects.findIndex((e) => e.id === effectId);
    if (effectIndex !== -1) {
      return {
        clipIndex,
        effectIndex,
        clip,
        effect: effects[effectIndex],
      };
    }
  }
  return null;
}

/**
 * GET - Get effect details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; effectId: string }> }
) {
  try {
    const { id: projectId, effectId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    const found = findEffectInProject(project, effectId);
    if (!found) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EFFECT_NOT_FOUND",
            message: "Effect not found",
          },
        },
        { status: 404 }
      );
    }

    // Convert to ClipEffect format
    const clipEffect: ClipEffect = {
      id: found.effect.id,
      clipId: found.clip.id,
      type: found.effect.type as EffectType,
      params: found.effect.parameters || {},
      enabled: true,
      order: found.effectIndex,
    };

    return NextResponse.json({
      success: true,
      data: clipEffect,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * PUT - Update effect parameters
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; effectId: string }> }
) {
  try {
    const { id: projectId, effectId } = await params;
    const body: UpdateEffectDto = await request.json();

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    const found = findEffectInProject(project, effectId);
    if (!found) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EFFECT_NOT_FOUND",
            message: "Effect not found",
          },
        },
        { status: 404 }
      );
    }

    // Update effect parameters
    if (body.params) {
      project.timeline.clips[found.clipIndex].effects![found.effectIndex].parameters = {
        ...found.effect.parameters,
        ...body.params,
      };
    }

    // Handle reordering if specified
    if (body.order !== undefined && body.order !== found.effectIndex) {
      const effects = project.timeline.clips[found.clipIndex].effects!;
      const [removed] = effects.splice(found.effectIndex, 1);
      effects.splice(body.order, 0, removed);
    }

    // Update the project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    // Get updated effect
    const updatedEffect = project.timeline.clips[found.clipIndex].effects![
      body.order !== undefined ? body.order : found.effectIndex
    ];

    const clipEffect: ClipEffect = {
      id: updatedEffect.id,
      clipId: found.clip.id,
      type: updatedEffect.type as EffectType,
      params: updatedEffect.parameters || {},
      enabled: body.enabled !== undefined ? body.enabled : true,
      order: body.order !== undefined ? body.order : found.effectIndex,
    };

    console.log(`[API] Effect updated: ${effectId}`);

    return NextResponse.json({
      success: true,
      data: clipEffect,
      message: "Effect updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE - Remove effect from clip
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; effectId: string }> }
) {
  try {
    const { id: projectId, effectId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    const found = findEffectInProject(project, effectId);
    if (!found) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EFFECT_NOT_FOUND",
            message: "Effect not found",
          },
        },
        { status: 404 }
      );
    }

    // Remove effect from clip
    project.timeline.clips[found.clipIndex].effects!.splice(found.effectIndex, 1);

    // Update the project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Effect deleted: ${effectId}`);

    return NextResponse.json({
      success: true,
      message: "Effect deleted successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
