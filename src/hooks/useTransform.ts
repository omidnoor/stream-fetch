/**
 * useTransform Hook
 *
 * Manages clip transform with CRUD operations and optimistic updates.
 */

"use client";

import { useReducer, useCallback, useEffect } from "react";
import type {
  Transform,
  TransformState,
  TransformAction,
  UpdateTransformDto,
  TransformHandle,
} from "@/lib/editor/types";
import { createDefaultTransform } from "@/lib/editor/utils";

/**
 * Transform reducer
 */
function transformReducer(state: TransformState, action: TransformAction): TransformState {
  switch (action.type) {
    case "SET_TRANSFORM":
      return {
        ...state,
        transform: action.payload,
        loading: false,
        error: null,
      };

    case "SET_SCALE":
      return {
        ...state,
        transform: { ...state.transform, scale: action.payload },
      };

    case "SET_ROTATION":
      return {
        ...state,
        transform: { ...state.transform, rotation: action.payload },
      };

    case "SET_POSITION":
      return {
        ...state,
        transform: { ...state.transform, position: action.payload },
      };

    case "SET_CROP":
      return {
        ...state,
        transform: { ...state.transform, crop: action.payload },
      };

    case "TOGGLE_FLIP_H":
      return {
        ...state,
        transform: { ...state.transform, flipH: !state.transform.flipH },
      };

    case "TOGGLE_FLIP_V":
      return {
        ...state,
        transform: { ...state.transform, flipV: !state.transform.flipV },
      };

    case "TOGGLE_ASPECT_LOCK":
      return {
        ...state,
        transform: {
          ...state.transform,
          lockAspectRatio: !state.transform.lockAspectRatio,
        },
      };

    case "START_EDIT":
      return {
        ...state,
        isEditing: true,
        activeHandle: action.payload.handle,
        originalTransform: action.payload.original,
      };

    case "END_EDIT":
      return {
        ...state,
        isEditing: false,
        activeHandle: null,
        originalTransform: null,
      };

    case "CANCEL_EDIT":
      return {
        ...state,
        transform: state.originalTransform || state.transform,
        isEditing: false,
        activeHandle: null,
        originalTransform: null,
      };

    case "RESET_TRANSFORM":
      return {
        ...state,
        transform: createDefaultTransform(state.transform.clipId),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}

/**
 * Hook options
 */
interface UseTransformOptions {
  projectId: string;
  clipId: string;
  initialTransform?: Transform;
  onChange?: (transform: Transform) => void;
}

/**
 * useTransform hook
 */
export function useTransform({
  projectId,
  clipId,
  initialTransform,
  onChange,
}: UseTransformOptions) {
  const [state, dispatch] = useReducer(transformReducer, {
    transform: initialTransform || createDefaultTransform(clipId),
    isEditing: false,
    activeHandle: null,
    originalTransform: null,
    loading: false,
    error: null,
  });

  // Update transform on server
  const updateServer = useCallback(
    async (updates: UpdateTransformDto): Promise<boolean> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/clip/${clipId}/transform`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        const data = await response.json();

        if (data.success) {
          dispatch({ type: "SET_LOADING", payload: false });
          onChange?.(state.transform);
          return true;
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: data.error?.message || "Failed to update transform",
          });
          return false;
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "Network error updating transform",
        });
        return false;
      }
    },
    [projectId, clipId, state.transform, onChange]
  );

  // Set initial transform
  useEffect(() => {
    if (initialTransform) {
      dispatch({ type: "SET_TRANSFORM", payload: initialTransform });
    }
  }, [initialTransform]);

  return {
    transform: state.transform,
    isEditing: state.isEditing,
    activeHandle: state.activeHandle,
    loading: state.loading,
    error: state.error,

    setScale: (scale: number) => {
      dispatch({ type: "SET_SCALE", payload: scale });
      updateServer({ scale });
    },
    setRotation: (rotation: number) => {
      dispatch({ type: "SET_ROTATION", payload: rotation });
      updateServer({ rotation });
    },
    setPosition: (position: typeof state.transform.position) => {
      dispatch({ type: "SET_POSITION", payload: position });
      updateServer({ position });
    },
    setCrop: (crop: typeof state.transform.crop) => {
      dispatch({ type: "SET_CROP", payload: crop });
      updateServer({ crop });
    },
    toggleFlipH: () => {
      dispatch({ type: "TOGGLE_FLIP_H" });
      updateServer({ flipH: !state.transform.flipH });
    },
    toggleFlipV: () => {
      dispatch({ type: "TOGGLE_FLIP_V" });
      updateServer({ flipV: !state.transform.flipV });
    },
    toggleAspectLock: () => {
      dispatch({ type: "TOGGLE_ASPECT_LOCK" });
    },
    startEdit: (handle: TransformHandle) => {
      dispatch({
        type: "START_EDIT",
        payload: { handle, original: state.transform },
      });
    },
    endEdit: () => {
      dispatch({ type: "END_EDIT" });
    },
    cancelEdit: () => {
      dispatch({ type: "CANCEL_EDIT" });
    },
    resetTransform: () => {
      dispatch({ type: "RESET_TRANSFORM" });
      updateServer(createDefaultTransform(clipId));
    },
  };
}
