/**
 * API Route: Project Text Overlays
 *
 * GET  /api/editor/project/[id]/text - List all text overlays
 * POST /api/editor/project/[id]/text - Add new text overlay
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService, AddTextDto, TextOverlay } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type {
  TextOverlay as FrontendTextOverlay,
  CreateTextOverlayDto,
  TextPresetType,
} from "@/lib/editor/types";
import {
  TEXT_PRESETS,
  DEFAULT_TEXT_STYLE,
  DEFAULT_TEXT_POSITION,
  generateTextId,
} from "@/lib/editor/utils";

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
 * Convert frontend CreateTextOverlayDto to backend AddTextDto
 */
function toBackendAddTextDto(dto: CreateTextOverlayDto): AddTextDto {
  const preset = dto.preset ? TEXT_PRESETS[dto.preset] : TEXT_PRESETS.custom;

  return {
    text: dto.content,
    startTime: dto.startTime,
    endTime: dto.startTime + (dto.duration ?? preset.defaultDuration),
    position: {
      x: dto.position?.x ?? preset.position.x,
      y: dto.position?.y ?? preset.position.y,
    },
    style: {
      fontFamily: dto.style?.fontFamily ?? preset.style.fontFamily,
      fontSize: dto.style?.fontSize ?? preset.style.fontSize,
      color: dto.style?.color ?? preset.style.color,
      backgroundColor: dto.style?.backgroundColor ?? preset.style.backgroundColor,
      opacity: dto.style?.opacity ?? preset.style.opacity,
      bold: dto.style?.bold ?? preset.style.bold,
      italic: dto.style?.italic ?? preset.style.italic,
      underline: dto.style?.underline ?? preset.style.underline,
    },
  };
}

/**
 * GET - List all text overlays for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Convert backend text overlays to frontend format
    // Use a default text track ID for now
    const textTrackId = `text-track-${projectId}`;
    const overlays = project.timeline.textOverlays.map((overlay) =>
      toFrontendTextOverlay(overlay, textTrackId)
    );

    return NextResponse.json({
      success: true,
      data: overlays,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * POST - Add a new text overlay
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CONTENT",
            message: "Text content is required",
          },
        },
        { status: 400 }
      );
    }

    if (body.startTime === undefined || body.startTime < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_START_TIME",
            message: "Valid start time is required",
          },
        },
        { status: 400 }
      );
    }

    const createDto: CreateTextOverlayDto = {
      content: body.content,
      trackId: body.trackId,
      startTime: body.startTime,
      duration: body.duration,
      position: body.position,
      style: body.style,
      animationIn: body.animationIn,
      animationOut: body.animationOut,
      preset: body.preset as TextPresetType,
    };

    // Convert to backend format and add
    const addTextDto = toBackendAddTextDto(createDto);

    const editorService = await getEditorService();
    const project = await editorService.addTextOverlay(projectId, addTextDto);

    // Get the newly added overlay (last one)
    const newOverlay =
      project.timeline.textOverlays[project.timeline.textOverlays.length - 1];

    // Convert to frontend format
    const textTrackId = createDto.trackId ?? `text-track-${projectId}`;
    const frontendOverlay = toFrontendTextOverlay(newOverlay, textTrackId);

    console.log(`[API] Text overlay added: ${frontendOverlay.id}`);

    return NextResponse.json({
      success: true,
      data: frontendOverlay,
      message: "Text overlay added successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
