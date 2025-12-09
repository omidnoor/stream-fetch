/**
 * API Route: Individual Text Overlay
 *
 * GET    /api/editor/project/[id]/text/[textId] - Get text overlay
 * PUT    /api/editor/project/[id]/text/[textId] - Update text overlay
 * DELETE /api/editor/project/[id]/text/[textId] - Delete text overlay
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService, TextOverlay } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type {
  TextOverlay as FrontendTextOverlay,
  UpdateTextOverlayDto,
} from "@/lib/editor/types";

/**
 * Convert backend TextOverlay to frontend format
 */
function toFrontendTextOverlay(
  overlay: TextOverlay,
  trackId: string
): FrontendTextOverlay {
  return {
    id: overlay.id,
    trackId,
    content: overlay.text,
    startTime: overlay.startTime,
    duration: overlay.endTime - overlay.startTime,
    position: {
      x: overlay.position.x,
      y: overlay.position.y,
    },
    style: {
      fontFamily: overlay.style.fontFamily,
      fontSize: overlay.style.fontSize,
      fontWeight: overlay.style.bold ? "bold" : "normal",
      color: overlay.style.color,
      backgroundColor: overlay.style.backgroundColor,
      opacity: overlay.style.opacity,
      align: "center",
      verticalAlign: "middle",
      bold: overlay.style.bold,
      italic: overlay.style.italic,
      underline: overlay.style.underline,
    },
    animationIn: overlay.animation?.fadeIn
      ? { type: "fade", duration: overlay.animation.fadeIn }
      : undefined,
    animationOut: overlay.animation?.fadeOut
      ? { type: "fade", duration: overlay.animation.fadeOut }
      : undefined,
    visible: true,
    locked: false,
  };
}

/**
 * GET - Get a specific text overlay
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; textId: string }> }
) {
  try {
    const { id: projectId, textId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the text overlay
    const overlay = project.timeline.textOverlays.find((t) => t.id === textId);

    if (!overlay) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TEXT_NOT_FOUND",
            message: "Text overlay not found",
          },
        },
        { status: 404 }
      );
    }

    const textTrackId = `text-track-${projectId}`;
    const frontendOverlay = toFrontendTextOverlay(overlay, textTrackId);

    return NextResponse.json({
      success: true,
      data: frontendOverlay,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * PUT - Update a text overlay
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; textId: string }> }
) {
  try {
    const { id: projectId, textId } = await params;
    const body: UpdateTextOverlayDto = await request.json();

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the text overlay index
    const overlayIndex = project.timeline.textOverlays.findIndex(
      (t) => t.id === textId
    );

    if (overlayIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TEXT_NOT_FOUND",
            message: "Text overlay not found",
          },
        },
        { status: 404 }
      );
    }

    // Get existing overlay
    const existingOverlay = project.timeline.textOverlays[overlayIndex];

    // Apply updates
    const updatedOverlay: TextOverlay = {
      ...existingOverlay,
      text: body.content ?? existingOverlay.text,
      startTime: body.startTime ?? existingOverlay.startTime,
      endTime:
        body.duration !== undefined
          ? (body.startTime ?? existingOverlay.startTime) + body.duration
          : body.startTime !== undefined
            ? body.startTime + (existingOverlay.endTime - existingOverlay.startTime)
            : existingOverlay.endTime,
      position: body.position
        ? {
            x: body.position.x ?? existingOverlay.position.x,
            y: body.position.y ?? existingOverlay.position.y,
          }
        : existingOverlay.position,
      style: body.style
        ? {
            fontFamily: body.style.fontFamily ?? existingOverlay.style.fontFamily,
            fontSize: body.style.fontSize ?? existingOverlay.style.fontSize,
            color: body.style.color ?? existingOverlay.style.color,
            backgroundColor:
              body.style.backgroundColor ?? existingOverlay.style.backgroundColor,
            opacity: body.style.opacity ?? existingOverlay.style.opacity,
            bold: body.style.bold ?? existingOverlay.style.bold,
            italic: body.style.italic ?? existingOverlay.style.italic,
            underline: body.style.underline ?? existingOverlay.style.underline,
          }
        : existingOverlay.style,
      animation:
        body.animationIn || body.animationOut
          ? {
              fadeIn:
                body.animationIn?.type === "fade"
                  ? body.animationIn.duration
                  : existingOverlay.animation?.fadeIn,
              fadeOut:
                body.animationOut?.type === "fade"
                  ? body.animationOut.duration
                  : existingOverlay.animation?.fadeOut,
            }
          : existingOverlay.animation,
    };

    // Update in timeline
    project.timeline.textOverlays[overlayIndex] = updatedOverlay;

    // Update the project timeline
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    // Convert to frontend format
    const textTrackId = `text-track-${projectId}`;
    const frontendOverlay = toFrontendTextOverlay(updatedOverlay, textTrackId);

    console.log(`[API] Text overlay updated: ${textId}`);

    return NextResponse.json({
      success: true,
      data: frontendOverlay,
      message: "Text overlay updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE - Delete a text overlay
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; textId: string }> }
) {
  try {
    const { id: projectId, textId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the text overlay
    const overlayIndex = project.timeline.textOverlays.findIndex(
      (t) => t.id === textId
    );

    if (overlayIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TEXT_NOT_FOUND",
            message: "Text overlay not found",
          },
        },
        { status: 404 }
      );
    }

    // Remove from timeline
    project.timeline.textOverlays.splice(overlayIndex, 1);

    // Update the project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Text overlay deleted: ${textId}`);

    return NextResponse.json({
      success: true,
      message: "Text overlay deleted successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
