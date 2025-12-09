/**
 * useAudio Hook
 *
 * Manages audio configuration for a clip with CRUD operations
 * and optimistic updates.
 */

"use client";

import { useReducer, useCallback, useEffect } from "react";
import type {
  AudioConfig,
  AudioState,
  AudioAction,
  UpdateAudioDto,
  WaveformData,
} from "@/lib/editor/types";
import { createDefaultAudioConfig, clampVolume, clampPan } from "@/lib/editor/utils";

/**
 * Initial audio state
 */
function createInitialState(clipId: string): AudioState {
  return {
    config: createDefaultAudioConfig(clipId),
    waveform: null,
    loading: false,
    error: null,
  };
}

/**
 * Audio reducer
 */
function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case "SET_CONFIG":
      return {
        ...state,
        config: action.payload,
        loading: false,
        error: null,
      };

    case "SET_VOLUME":
      return {
        ...state,
        config: {
          ...state.config,
          volume: clampVolume(action.payload),
        },
      };

    case "SET_FADE_IN":
      return {
        ...state,
        config: {
          ...state.config,
          fadeIn: Math.max(0, action.payload),
        },
      };

    case "SET_FADE_OUT":
      return {
        ...state,
        config: {
          ...state.config,
          fadeOut: Math.max(0, action.payload),
        },
      };

    case "TOGGLE_MUTE":
      return {
        ...state,
        config: {
          ...state.config,
          muted: !state.config.muted,
        },
      };

    case "SET_PAN":
      return {
        ...state,
        config: {
          ...state.config,
          pan: clampPan(action.payload),
        },
      };

    case "SET_WAVEFORM":
      return {
        ...state,
        waveform: action.payload,
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
interface UseAudioOptions {
  projectId: string;
  clipId: string;
  /** Initial audio config */
  initialConfig?: AudioConfig;
  /** Called when config changes */
  onChange?: (config: AudioConfig) => void;
}

/**
 * Hook return type
 */
interface UseAudioReturn {
  // State
  config: AudioConfig;
  waveform: WaveformData | null;
  loading: boolean;
  error: string | null;

  // Actions
  setVolume: (volume: number) => Promise<boolean>;
  setFadeIn: (fadeIn: number) => Promise<boolean>;
  setFadeOut: (fadeOut: number) => Promise<boolean>;
  toggleMute: () => Promise<boolean>;
  setPan: (pan: number) => Promise<boolean>;
  updateConfig: (updates: Partial<UpdateAudioDto>) => Promise<boolean>;
}

/**
 * useAudio hook
 */
export function useAudio({
  projectId,
  clipId,
  initialConfig,
  onChange,
}: UseAudioOptions): UseAudioReturn {
  const [state, dispatch] = useReducer(audioReducer, clipId, createInitialState);

  // Set initial config if provided
  useEffect(() => {
    if (initialConfig) {
      dispatch({ type: "SET_CONFIG", payload: initialConfig });
    }
  }, [initialConfig]);

  /**
   * Update audio settings on the server
   */
  const updateServer = useCallback(
    async (updates: UpdateAudioDto): Promise<boolean> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/audio/${clipId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );
        const data = await response.json();

        if (data.success) {
          dispatch({ type: "SET_LOADING", payload: false });
          onChange?.(state.config);
          return true;
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: data.error?.message || "Failed to update audio settings",
          });
          return false;
        }
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: "Network error updating audio settings",
        });
        return false;
      }
    },
    [projectId, clipId, state.config, onChange]
  );

  /**
   * Set volume
   */
  const setVolume = useCallback(
    async (volume: number): Promise<boolean> => {
      // Optimistic update
      const originalVolume = state.config.volume;
      dispatch({ type: "SET_VOLUME", payload: volume });

      const success = await updateServer({ volume });

      // Rollback on failure
      if (!success) {
        dispatch({ type: "SET_VOLUME", payload: originalVolume });
      }

      return success;
    },
    [state.config.volume, updateServer]
  );

  /**
   * Set fade in
   */
  const setFadeIn = useCallback(
    async (fadeIn: number): Promise<boolean> => {
      const originalFadeIn = state.config.fadeIn;
      dispatch({ type: "SET_FADE_IN", payload: fadeIn });

      const success = await updateServer({ fadeIn });

      if (!success) {
        dispatch({ type: "SET_FADE_IN", payload: originalFadeIn });
      }

      return success;
    },
    [state.config.fadeIn, updateServer]
  );

  /**
   * Set fade out
   */
  const setFadeOut = useCallback(
    async (fadeOut: number): Promise<boolean> => {
      const originalFadeOut = state.config.fadeOut;
      dispatch({ type: "SET_FADE_OUT", payload: fadeOut });

      const success = await updateServer({ fadeOut });

      if (!success) {
        dispatch({ type: "SET_FADE_OUT", payload: originalFadeOut });
      }

      return success;
    },
    [state.config.fadeOut, updateServer]
  );

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(async (): Promise<boolean> => {
    const originalMuted = state.config.muted;
    dispatch({ type: "TOGGLE_MUTE" });

    const success = await updateServer({ muted: !originalMuted });

    if (!success) {
      dispatch({ type: "TOGGLE_MUTE" }); // Toggle back
    }

    return success;
  }, [state.config.muted, updateServer]);

  /**
   * Set pan
   */
  const setPan = useCallback(
    async (pan: number): Promise<boolean> => {
      const originalPan = state.config.pan ?? 0;
      dispatch({ type: "SET_PAN", payload: pan });

      const success = await updateServer({ pan });

      if (!success) {
        dispatch({ type: "SET_PAN", payload: originalPan });
      }

      return success;
    },
    [state.config.pan, updateServer]
  );

  /**
   * Update multiple config values at once
   */
  const updateConfig = useCallback(
    async (updates: Partial<UpdateAudioDto>): Promise<boolean> => {
      return updateServer(updates);
    },
    [updateServer]
  );

  return {
    // State
    config: state.config,
    waveform: state.waveform,
    loading: state.loading,
    error: state.error,

    // Actions
    setVolume,
    setFadeIn,
    setFadeOut,
    toggleMute,
    setPan,
    updateConfig,
  };
}
