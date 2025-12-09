/**
 * useTransitions Hook
 *
 * Manages transitions between clips with CRUD operations,
 * optimistic updates, and state management.
 */

"use client";

import { useReducer, useCallback, useEffect } from "react";
import type {
  Transition,
  TransitionType,
  TransitionsState,
  TransitionsAction,
  CreateTransitionDto,
  UpdateTransitionDto,
} from "@/lib/editor/types";
import { TRANSITION_CONFIGS } from "@/lib/editor/utils";

/**
 * Initial state for transitions
 */
const initialState: TransitionsState = {
  transitions: [],
  selectedTransitionId: null,
  previewingTransitionId: null,
  loading: false,
  error: null,
};

/**
 * Transitions reducer
 */
function transitionsReducer(
  state: TransitionsState,
  action: TransitionsAction
): TransitionsState {
  switch (action.type) {
    case "SET_TRANSITIONS":
      return {
        ...state,
        transitions: action.payload,
        loading: false,
        error: null,
      };

    case "ADD_TRANSITION":
      return {
        ...state,
        transitions: [...state.transitions, action.payload],
      };

    case "UPDATE_TRANSITION":
      return {
        ...state,
        transitions: state.transitions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case "REMOVE_TRANSITION":
      return {
        ...state,
        transitions: state.transitions.filter((t) => t.id !== action.payload),
        selectedTransitionId:
          state.selectedTransitionId === action.payload
            ? null
            : state.selectedTransitionId,
      };

    case "SELECT_TRANSITION":
      return {
        ...state,
        selectedTransitionId: action.payload,
      };

    case "SET_PREVIEWING":
      return {
        ...state,
        previewingTransitionId: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    default:
      return state;
  }
}

/**
 * Hook options
 */
interface UseTransitionsOptions {
  /** Project ID */
  projectId: string;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Called when transitions change */
  onTransitionsChange?: (transitions: Transition[]) => void;
}

/**
 * Hook return type
 */
interface UseTransitionsReturn {
  // State
  transitions: Transition[];
  selectedTransitionId: string | null;
  previewingTransitionId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTransitions: () => Promise<void>;
  addTransition: (dto: CreateTransitionDto) => Promise<Transition | null>;
  updateTransition: (id: string, updates: UpdateTransitionDto) => Promise<boolean>;
  removeTransition: (id: string) => Promise<boolean>;
  selectTransition: (id: string | null) => void;
  setPreviewingTransition: (id: string | null) => void;

  // Helpers
  getTransition: (id: string) => Transition | undefined;
  getTransitionBetweenClips: (fromClipId: string, toClipId: string) => Transition | undefined;
  hasTransitionBetweenClips: (fromClipId: string, toClipId: string) => boolean;
}

/**
 * useTransitions hook
 */
export function useTransitions({
  projectId,
  autoFetch = true,
  onTransitionsChange,
}: UseTransitionsOptions): UseTransitionsReturn {
  const [state, dispatch] = useReducer(transitionsReducer, initialState);

  /**
   * Fetch transitions from API
   */
  const fetchTransitions = useCallback(async () => {
    if (!projectId) return;

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(
        `/api/editor/project/${projectId}/transition`
      );
      const data = await response.json();

      if (data.success) {
        dispatch({ type: "SET_TRANSITIONS", payload: data.data });
        onTransitionsChange?.(data.data);
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: data.error?.message || "Failed to fetch transitions",
        });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: "Network error fetching transitions",
      });
    }
  }, [projectId, onTransitionsChange]);

  /**
   * Add a new transition
   */
  const addTransition = useCallback(
    async (dto: CreateTransitionDto): Promise<Transition | null> => {
      if (!projectId) return null;

      // Optimistic ID for immediate feedback
      const optimisticId = `temp_${Date.now()}`;
      const config = TRANSITION_CONFIGS[dto.type];

      const optimisticTransition: Transition = {
        id: optimisticId,
        projectId,
        fromClipId: dto.fromClipId,
        toClipId: dto.toClipId,
        type: dto.type,
        duration: dto.duration ?? config.defaultDuration,
        params: dto.params,
      };

      // Optimistic update
      dispatch({ type: "ADD_TRANSITION", payload: optimisticTransition });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/transition`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto),
          }
        );
        const data = await response.json();

        if (data.success) {
          // Replace optimistic transition with real one
          dispatch({ type: "REMOVE_TRANSITION", payload: optimisticId });
          dispatch({ type: "ADD_TRANSITION", payload: data.data });
          onTransitionsChange?.([
            ...state.transitions.filter((t) => t.id !== optimisticId),
            data.data,
          ]);
          return data.data;
        } else {
          // Rollback on error
          dispatch({ type: "REMOVE_TRANSITION", payload: optimisticId });
          dispatch({
            type: "SET_ERROR",
            payload: data.error?.message || "Failed to add transition",
          });
          return null;
        }
      } catch (error) {
        // Rollback on error
        dispatch({ type: "REMOVE_TRANSITION", payload: optimisticId });
        dispatch({
          type: "SET_ERROR",
          payload: "Network error adding transition",
        });
        return null;
      }
    },
    [projectId, state.transitions, onTransitionsChange]
  );

  /**
   * Update a transition
   */
  const updateTransition = useCallback(
    async (id: string, updates: UpdateTransitionDto): Promise<boolean> => {
      if (!projectId) return false;

      // Store original for rollback
      const original = state.transitions.find((t) => t.id === id);
      if (!original) return false;

      // Optimistic update
      dispatch({
        type: "UPDATE_TRANSITION",
        payload: { id, updates: updates as Partial<Transition> },
      });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/transition/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        const data = await response.json();

        if (data.success) {
          dispatch({
            type: "UPDATE_TRANSITION",
            payload: { id, updates: data.data },
          });
          onTransitionsChange?.(
            state.transitions.map((t) => (t.id === id ? data.data : t))
          );
          return true;
        } else {
          // Rollback
          dispatch({
            type: "UPDATE_TRANSITION",
            payload: { id, updates: original },
          });
          dispatch({
            type: "SET_ERROR",
            payload: data.error?.message || "Failed to update transition",
          });
          return false;
        }
      } catch (error) {
        // Rollback
        dispatch({
          type: "UPDATE_TRANSITION",
          payload: { id, updates: original },
        });
        dispatch({
          type: "SET_ERROR",
          payload: "Network error updating transition",
        });
        return false;
      }
    },
    [projectId, state.transitions, onTransitionsChange]
  );

  /**
   * Remove a transition
   */
  const removeTransition = useCallback(
    async (id: string): Promise<boolean> => {
      if (!projectId) return false;

      // Store original for rollback
      const original = state.transitions.find((t) => t.id === id);
      if (!original) return false;

      // Optimistic removal
      dispatch({ type: "REMOVE_TRANSITION", payload: id });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/transition/${id}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();

        if (data.success) {
          onTransitionsChange?.(state.transitions.filter((t) => t.id !== id));
          return true;
        } else {
          // Rollback
          dispatch({ type: "ADD_TRANSITION", payload: original });
          dispatch({
            type: "SET_ERROR",
            payload: data.error?.message || "Failed to remove transition",
          });
          return false;
        }
      } catch (error) {
        // Rollback
        dispatch({ type: "ADD_TRANSITION", payload: original });
        dispatch({
          type: "SET_ERROR",
          payload: "Network error removing transition",
        });
        return false;
      }
    },
    [projectId, state.transitions, onTransitionsChange]
  );

  /**
   * Select a transition
   */
  const selectTransition = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_TRANSITION", payload: id });
  }, []);

  /**
   * Set previewing transition
   */
  const setPreviewingTransition = useCallback((id: string | null) => {
    dispatch({ type: "SET_PREVIEWING", payload: id });
  }, []);

  /**
   * Get a transition by ID
   */
  const getTransition = useCallback(
    (id: string) => {
      return state.transitions.find((t) => t.id === id);
    },
    [state.transitions]
  );

  /**
   * Get transition between two clips
   */
  const getTransitionBetweenClips = useCallback(
    (fromClipId: string, toClipId: string) => {
      return state.transitions.find(
        (t) => t.fromClipId === fromClipId && t.toClipId === toClipId
      );
    },
    [state.transitions]
  );

  /**
   * Check if transition exists between clips
   */
  const hasTransitionBetweenClips = useCallback(
    (fromClipId: string, toClipId: string) => {
      return state.transitions.some(
        (t) => t.fromClipId === fromClipId && t.toClipId === toClipId
      );
    },
    [state.transitions]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && projectId) {
      fetchTransitions();
    }
  }, [autoFetch, projectId, fetchTransitions]);

  return {
    // State
    transitions: state.transitions,
    selectedTransitionId: state.selectedTransitionId,
    previewingTransitionId: state.previewingTransitionId,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchTransitions,
    addTransition,
    updateTransition,
    removeTransition,
    selectTransition,
    setPreviewingTransition,

    // Helpers
    getTransition,
    getTransitionBetweenClips,
    hasTransitionBetweenClips,
  };
}
