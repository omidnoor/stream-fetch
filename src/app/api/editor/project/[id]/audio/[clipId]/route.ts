/**
 * API Route: Audio Clip Settings
 *
 * PUT /api/editor/project/[id]/audio/[clipId] - Update audio settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { UpdateAudioDto } from "@/lib/editor/types";
import { validateAudioConfig, clampVolume, clampPan } from "@/lib/editor/utils";

/**
 * PUT - Update audio settings for a clip
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: projectId, clipId } = await params;
    const body: UpdateAudioDto = await request.json();

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

    // Build updated audio config
    const updatedClip = {
      ...clip,
      ...(body.volume !== undefined && { volume: clampVolume(body.volume) }),
      ...(body.fadeIn !== undefined && { fadeIn: Math.max(0, body.fadeIn) }),
      ...(body.fadeOut !== undefined && { fadeOut: Math.max(0, body.fadeOut) }),
      ...(body.muted !== undefined && { muted: body.muted }),
      ...(body.pan !== undefined && { pan: clampPan(body.pan) }),
    };

    // Validate audio config
    const validation = validateAudioConfig({
      clipId,
      volume: updatedClip.volume ?? 1,
      fadeIn: updatedClip.fadeIn ?? 0,
      fadeOut: updatedClip.fadeOut ?? 0,
      muted: updatedClip.muted ?? false,
      pan: updatedClip.pan,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_AUDIO_CONFIG",
            message: validation.errors.join(", "),
            errors: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Validate fade durations against clip duration
    if (updatedClip.fadeIn && updatedClip.fadeOut) {
      if (updatedClip.fadeIn + updatedClip.fadeOut > clip.duration) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_FADE_DURATION",
              message: "Fade in + fade out cannot exceed clip duration",
            },
          },
          { status: 400 }
        );
      }
    }

    // Update the clip
    const clipIndex = project.timeline.clips.findIndex((c) => c.id === clipId);
    project.timeline.clips[clipIndex] = updatedClip;

    // Save project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Audio settings updated for clip: ${clipId}`);

    return NextResponse.json({
      success: true,
      data: {
        clipId,
        volume: updatedClip.volume,
        fadeIn: updatedClip.fadeIn,
        fadeOut: updatedClip.fadeOut,
        muted: updatedClip.muted,
        pan: updatedClip.pan,
      },
      message: "Audio settings updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
