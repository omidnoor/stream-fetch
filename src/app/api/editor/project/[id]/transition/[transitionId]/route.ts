/**
 * API Route: Individual Transition Operations
 *
 * GET    /api/editor/project/[id]/transition/[transitionId] - Get transition details
 * PUT    /api/editor/project/[id]/transition/[transitionId] - Update transition
 * DELETE /api/editor/project/[id]/transition/[transitionId] - Remove transition
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import type { UpdateTransitionDto, Transition } from "@/lib/editor/types";
import { TRANSITION_CONFIGS, validateTransitionDuration } from "@/lib/editor/utils";

/**
 * GET - Get a specific transition
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transitionId: string }> }
) {
  try {
    const { id: projectId, transitionId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the transition
    const transitions = project.timeline.transitions || [];
    const transition = transitions.find((t: any) => t.id === transitionId);

    if (!transition) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSITION_NOT_FOUND",
            message: "Transition not found",
          },
        },
        { status: 404 }
      );
    }

    // Convert to frontend format
    const frontendTransition: Transition = {
      id: transition.id,
      projectId,
      fromClipId: transition.fromClipId || "",
      toClipId: transition.toClipId || "",
      type: transition.type,
      duration: transition.duration * 1000, // Convert to milliseconds
      params: transition.params,
    };

    return NextResponse.json({
      success: true,
      data: frontendTransition,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * PUT - Update a transition
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transitionId: string }> }
) {
  try {
    const { id: projectId, transitionId } = await params;
    const body: UpdateTransitionDto = await request.json();

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the transition index
    const transitions = project.timeline.transitions || [];
    const transitionIndex = transitions.findIndex(
      (t: any) => t.id === transitionId
    );

    if (transitionIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSITION_NOT_FOUND",
            message: "Transition not found",
          },
        },
        { status: 404 }
      );
    }

    const existingTransition = transitions[transitionIndex];

    // Validate new type if provided
    if (body.type && !TRANSITION_CONFIGS[body.type]) {
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

    // Validate duration if provided
    if (body.duration !== undefined) {
      // Find the clips to validate duration
      const fromClip = project.timeline.clips.find(
        (c) => c.id === existingTransition.fromClipId
      );
      const toClip = project.timeline.clips.find(
        (c) => c.id === existingTransition.toClipId
      );

      if (fromClip && toClip) {
        const validation = validateTransitionDuration(
          body.duration,
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
      }
    }

    // Update the transition
    const updatedTransition = {
      ...existingTransition,
      ...(body.type && { type: body.type }),
      ...(body.duration !== undefined && { duration: body.duration / 1000 }), // Convert to seconds
      ...(body.params && { params: { ...existingTransition.params, ...body.params } }),
    };

    project.timeline.transitions[transitionIndex] = updatedTransition;

    // Update project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    // Convert to frontend format for response
    const frontendTransition: Transition = {
      id: updatedTransition.id,
      projectId,
      fromClipId: updatedTransition.fromClipId || "",
      toClipId: updatedTransition.toClipId || "",
      type: updatedTransition.type,
      duration: updatedTransition.duration * 1000,
      params: updatedTransition.params,
    };

    console.log(`[API] Transition updated: ${transitionId}`);

    return NextResponse.json({
      success: true,
      data: frontendTransition,
      message: "Transition updated successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE - Remove a transition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transitionId: string }> }
) {
  try {
    const { id: projectId, transitionId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the transition index
    const transitions = project.timeline.transitions || [];
    const transitionIndex = transitions.findIndex(
      (t: any) => t.id === transitionId
    );

    if (transitionIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSITION_NOT_FOUND",
            message: "Transition not found",
          },
        },
        { status: 404 }
      );
    }

    // Remove the transition
    project.timeline.transitions.splice(transitionIndex, 1);

    // Update project
    await editorService.updateProject(projectId, {
      timeline: project.timeline,
    });

    console.log(`[API] Transition deleted: ${transitionId}`);

    return NextResponse.json({
      success: true,
      message: "Transition deleted successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
