/**
 * API Route: Project Transitions
 *
 * GET  /api/editor/project/[id]/transition - List all transitions
 * POST /api/editor/project/[id]/transition - Create a new transition
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { CreateTransitionDto, Transition } from "@/lib/editor/types";
import {
  createTransition,
  TRANSITION_CONFIGS,
  validateTransitionDuration,
} from "@/lib/editor/utils";

/**
 * GET - List all transitions for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Get transitions from project (stored in timeline)
    const transitions: Transition[] = (project.timeline.transitions || []).map(
      (t: any) => ({
        id: t.id,
        projectId,
        fromClipId: t.fromClipId || t.position?.toString() || "",
        toClipId: t.toClipId || "",
        type: t.type,
        duration: t.duration * 1000, // Convert to milliseconds
        params: t.params,
      })
    );

    return NextResponse.json({
      success: true,
      data: transitions,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * POST - Create a new transition between clips
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body: CreateTransitionDto = await request.json();

    // Validate transition type
    if (!body.type || !TRANSITION_CONFIGS[body.type]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TRANSITION_TYPE",
            message: "Invalid transition type",
          },
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.fromClipId || !body.toClipId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CLIP_IDS",
            message: "Both fromClipId and toClipId are required",
          },
        },
        { status: 400 }
      );
    }

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find both clips
    const fromClip = project.timeline.clips.find(
      (c) => c.id === body.fromClipId
    );
    const toClip = project.timeline.clips.find((c) => c.id === body.toClipId);

    if (!fromClip || !toClip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CLIP_NOT_FOUND",
            message: "One or both clips not found",
          },
        },
        { status: 404 }
      );
    }

    // Validate duration against clip durations
    const config = TRANSITION_CONFIGS[body.type];
    const duration = body.duration ?? config.defaultDuration;
    const validation = validateTransitionDuration(
      duration,
      fromClip.duration,
      toClip.duration
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_DURATION",
            message: validation.message,
            maxDuration: validation.maxDuration,
          },
        },
        { status: 400 }
      );
    }

    // Check for existing transition between these clips
    const existingTransitions = project.timeline.transitions || [];
    const existingTransition = existingTransitions.find(
      (t: any) => t.fromClipId === body.fromClipId && t.toClipId === body.toClipId
    );

    if (existingTransition) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSITION_EXISTS",
            message: "A transition already exists between these clips",
          },
        },
        { status: 400 }
      );
    }

    // Create the transition
    const newTransition = createTransition(projectId, body);

    // Convert to backend format and store
    const backendTransition = {
      id: newTransition.id,
      type: newTransition.type,
      duration: newTransition.duration / 1000, // Convert to seconds
      position: fromClip.startTime + fromClip.duration, // Position at end of fromClip
      fromClipId: newTransition.fromClipId,
      toClipId: newTransition.toClipId,
      params: newTransition.params,
    };

    // Add to project
    if (!project.timeline.transitions) {
      project.timeline.transitions = [];
    }
    project.timeline.transitions.push(backendTransition);

    // Update project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(
      `[API] Transition created: ${newTransition.type} between ${body.fromClipId} and ${body.toClipId}`
    );

    return NextResponse.json({
      success: true,
      data: newTransition,
      message: "Transition created successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
