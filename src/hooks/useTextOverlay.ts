/**
 * useTextOverlay Hook
 *
 * Manages text overlay state and CRUD operations for the video editor.
 * Provides optimistic updates and API synchronization.
 */

"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import type {
  TextOverlay,
  TextOverlayState,
  TextOverlayAction,
  CreateTextOverlayDto,
  UpdateTextOverlayDto,
  TextPresetType,
} from "@/lib/editor/types";
import { createTextOverlay, TEXT_PRESETS, generateTextId } from "@/lib/editor/utils";

/**
 * Initial state for text overlays
 */
function createInitialState(): TextOverlayState {
  return {
    overlays: [],
    selectedTextId: null,
    isEditing: false,
    draggingTextId: null,
    loading: false,
    error: null,
  };
}

/**
 * Reducer for text overlay state
 */
function textOverlayReducer(
  state: TextOverlayState,
  action: TextOverlayAction
): TextOverlayState {
  switch (action.type) {
    case "SET_OVERLAYS":
      return { ...state, overlays: action.payload, loading: false, error: null };

    case "ADD_OVERLAY":
      return {
        ...state,
        overlays: [...state.overlays, action.payload],
        selectedTextId: action.payload.id,
      };

    case "UPDATE_OVERLAY":
      return {
        ...state,
        overlays: state.overlays.map((overlay) =>
          overlay.id === action.payload.id
            ? { ...overlay, ...action.payload.updates }
            : overlay
        ),
      };

    case "REMOVE_OVERLAY":
      return {
        ...state,
        overlays: state.overlays.filter((overlay) => overlay.id !== action.payload),
        selectedTextId:
          state.selectedTextId === action.payload ? null : state.selectedTextId,
      };

    case "SELECT_TEXT":
      return {
        ...state,
        selectedTextId: action.payload,
        isEditing: action.payload !== null ? state.isEditing : false,
      };

    case "SET_EDITING":
      return { ...state, isEditing: action.payload };

    case "SET_DRAGGING":
      return { ...state, draggingTextId: action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "APPLY_PRESET": {
      const preset = TEXT_PRESETS[action.payload.preset];
      return {
        ...state,
        overlays: state.overlays.map((overlay) =>
          overlay.id === action.payload.id
            ? {
                ...overlay,
                position: { ...preset.position },
                style: { ...preset.style },
                animationIn: preset.animationIn,
                animationOut: preset.animationOut,
                preset: action.payload.preset,
              }
            : overlay
        ),
      };
    }

    case "DUPLICATE_OVERLAY": {
      const original = state.overlays.find((o) => o.id === action.payload);
      if (!original) return state;

      const duplicate: TextOverlay = {
        ...original,
        id: generateTextId(),
        startTime: original.startTime + original.duration + 0.5, // Place after original
      };

      return {
        ...state,
        overlays: [...state.overlays, duplicate],
        selectedTextId: duplicate.id,
      };
    }

    default:
      return state;
  }
}

/**
 * Hook for managing text overlays in the video editor
 */
export function useTextOverlay(projectId: string, defaultTrackId?: string) {
  const [state, dispatch] = useReducer(textOverlayReducer, undefined, createInitialState);

  const trackId = defaultTrackId ?? `text-track-${projectId}`;

  /**
   * Fetch text overlays from API
   */
  const fetchOverlays = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(`/api/editor/project/${projectId}/text`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch text overlays");
      }

      dispatch({ type: "SET_OVERLAYS", payload: data.data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch text overlays";
      dispatch({ type: "SET_ERROR", payload: message });
    }
  }, [projectId]);

  /**
   * Add a new text overlay
   */
  const addOverlay = useCallback(
    async (
      content: string,
      startTime: number,
      options?: {
        duration?: number;
        preset?: TextPresetType;
        position?: { x: number; y: number };
        style?: Partial<TextOverlay["style"]>;
      }
    ) => {
      // Create optimistic overlay
      const optimisticOverlay = createTextOverlay(
        content,
        trackId,
        startTime,
        options?.preset ?? "custom",
        {
          position: options?.position,
          style: options?.style,
          duration: options?.duration,
        }
      );

      // Optimistically add to state
      dispatch({ type: "ADD_OVERLAY", payload: optimisticOverlay });

      try {
        const createDto: CreateTextOverlayDto = {
          content,
          trackId,
          startTime,
          duration: options?.duration,
          preset: options?.preset,
          position: options?.position,
          style: options?.style,
        };

        const response = await fetch(`/api/editor/project/${projectId}/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createDto),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to add text overlay");
        }

        // Replace optimistic overlay with server response
        dispatch({ type: "REMOVE_OVERLAY", payload: optimisticOverlay.id });
        dispatch({ type: "ADD_OVERLAY", payload: data.data });

        return data.data as TextOverlay;
      } catch (error) {
        // Rollback optimistic update
        dispatch({ type: "REMOVE_OVERLAY", payload: optimisticOverlay.id });
        const message = error instanceof Error ? error.message : "Failed to add text overlay";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, trackId]
  );

  /**
   * Update an existing text overlay
   */
  const updateOverlay = useCallback(
    async (id: string, updates: UpdateTextOverlayDto) => {
      // Get original for rollback
      const original = state.overlays.find((o) => o.id === id);
      if (!original) return;

      // Convert UpdateTextOverlayDto to Partial<TextOverlay> for optimistic update
      const overlayUpdates: Partial<TextOverlay> = {
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.startTime !== undefined && { startTime: updates.startTime }),
        ...(updates.duration !== undefined && { duration: updates.duration }),
        ...(updates.locked !== undefined && { locked: updates.locked }),
        ...(updates.visible !== undefined && { visible: updates.visible }),
        ...(updates.position && {
          position: { ...original.position, ...updates.position },
        }),
        ...(updates.style && {
          style: { ...original.style, ...updates.style },
        }),
        ...(updates.animationIn !== undefined && {
          animationIn: updates.animationIn
            ? { ...updates.animationIn, type: updates.animationIn.type ?? "none", duration: updates.animationIn.duration ?? 0.5 }
            : undefined,
        }),
        ...(updates.animationOut !== undefined && {
          animationOut: updates.animationOut
            ? { ...updates.animationOut, type: updates.animationOut.type ?? "none", duration: updates.animationOut.duration ?? 0.5 }
            : undefined,
        }),
      };

      // Optimistically update
      dispatch({ type: "UPDATE_OVERLAY", payload: { id, updates: overlayUpdates } });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/text/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to update text overlay");
        }

        // Update with server response
        dispatch({
          type: "UPDATE_OVERLAY",
          payload: { id, updates: data.data },
        });

        return data.data as TextOverlay;
      } catch (error) {
        // Rollback to original
        dispatch({ type: "UPDATE_OVERLAY", payload: { id, updates: original } });
        const message = error instanceof Error ? error.message : "Failed to update text overlay";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, state.overlays]
  );

  /**
   * Delete a text overlay
   */
  const deleteOverlay = useCallback(
    async (id: string) => {
      // Get original for rollback
      const original = state.overlays.find((o) => o.id === id);
      if (!original) return;

      // Optimistically remove
      dispatch({ type: "REMOVE_OVERLAY", payload: id });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/text/${id}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to delete text overlay");
        }
      } catch (error) {
        // Rollback - add back
        dispatch({ type: "ADD_OVERLAY", payload: original });
        const message = error instanceof Error ? error.message : "Failed to delete text overlay";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, state.overlays]
  );

  /**
   * Duplicate a text overlay
   */
  const duplicateOverlay = useCallback(
    async (id: string) => {
      const original = state.overlays.find((o) => o.id === id);
      if (!original) return;

      // Create duplicate with new position
      return addOverlay(original.content, original.startTime + original.duration + 0.5, {
        duration: original.duration,
        position: original.position,
        style: original.style,
        preset: original.preset,
      });
    },
    [state.overlays, addOverlay]
  );

  /**
   * Apply a preset to an existing overlay
   */
  const applyPreset = useCallback(
    async (id: string, preset: TextPresetType) => {
      const presetConfig = TEXT_PRESETS[preset];

      return updateOverlay(id, {
        position: presetConfig.position,
        style: presetConfig.style,
        animationIn: presetConfig.animationIn,
        animationOut: presetConfig.animationOut,
      });
    },
    [updateOverlay]
  );

  /**
   * Select a text overlay
   */
  const selectOverlay = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_TEXT", payload: id });
  }, []);

  /**
   * Start editing the selected text
   */
  const startEditing = useCallback(() => {
    dispatch({ type: "SET_EDITING", payload: true });
  }, []);

  /**
   * Stop editing
   */
  const stopEditing = useCallback(() => {
    dispatch({ type: "SET_EDITING", payload: false });
  }, []);

  /**
   * Set dragging state
   */
  const setDragging = useCallback((id: string | null) => {
    dispatch({ type: "SET_DRAGGING", payload: id });
  }, []);

  /**
   * Clear any error
   */
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  /**
   * Get the currently selected overlay
   */
  const selectedOverlay = useMemo(() => {
    return state.overlays.find((o) => o.id === state.selectedTextId) ?? null;
  }, [state.overlays, state.selectedTextId]);

  /**
   * Get overlays visible at a specific time
   */
  const getOverlaysAtTime = useCallback(
    (time: number) => {
      return state.overlays.filter(
        (overlay) =>
          overlay.visible !== false &&
          time >= overlay.startTime &&
          time < overlay.startTime + overlay.duration
      );
    },
    [state.overlays]
  );

  /**
   * Fetch overlays on mount
   */
  useEffect(() => {
    fetchOverlays();
  }, [fetchOverlays]);

  return {
    // State
    overlays: state.overlays,
    selectedTextId: state.selectedTextId,
    selectedOverlay,
    isEditing: state.isEditing,
    draggingTextId: state.draggingTextId,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchOverlays,
    addOverlay,
    updateOverlay,
    deleteOverlay,
    duplicateOverlay,
    applyPreset,
    selectOverlay,
    startEditing,
    stopEditing,
    setDragging,
    clearError,
    getOverlaysAtTime,

    // Direct dispatch for advanced use cases
    dispatch,
  };
}
