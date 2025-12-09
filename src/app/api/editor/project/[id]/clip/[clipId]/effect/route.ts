/**
 * API Route: Clip Effects
 *
 * GET  /api/editor/project/[id]/clip/[clipId]/effect - List effects for clip
 * POST /api/editor/project/[id]/clip/[clipId]/effect - Add effect to clip
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { CreateEffectDto, ClipEffect, EffectType } from "@/lib/editor/types";
import { createEffect, EFFECT_CONFIGS, generateEffectId } from "@/lib/editor/utils";

/**
 * GET - List all effects for a clip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: projectId, clipId } = await params;

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

    // Convert clip effects to ClipEffect format
    const effects: ClipEffect[] = (clip.effects || []).map((effect, index) => ({
      id: effect.id,
      clipId,
      type: effect.type as EffectType,
      params: effect.parameters || {},
      enabled: true,
      order: index,
    }));

    return NextResponse.json({
      success: true,
      data: effects,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * POST - Add a new effect to a clip
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: projectId, clipId } = await params;
    const body: CreateEffectDto = await request.json();

    // Validate effect type
    if (!body.type || !EFFECT_CONFIGS[body.type]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_EFFECT_TYPE",
            message: "Invalid effect type",
          },
        },
        { status: 400 }
      );
    }

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the clip index
    const clipIndex = project.timeline.clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) {
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

    // Get current effects count for order
    const existingEffects = project.timeline.clips[clipIndex].effects || [];
    const order = existingEffects.length;

    // Create the effect using utility
    const newEffect = createEffect(clipId, body.type, order, body.params);

    // Convert to backend format and add to clip
    const backendEffect = {
      id: newEffect.id,
      type: newEffect.type,
      parameters: newEffect.params,
      startTime: undefined,
      endTime: undefined,
    };

    // Add effect to clip
    if (!project.timeline.clips[clipIndex].effects) {
      project.timeline.clips[clipIndex].effects = [];
    }
    project.timeline.clips[clipIndex].effects.push(backendEffect);

    // Update the project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Effect added to clip ${clipId}: ${newEffect.type}`);

    return NextResponse.json({
      success: true,
      data: newEffect,
      message: "Effect added successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
