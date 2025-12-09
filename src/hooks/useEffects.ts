/**
 * useEffects Hook
 *
 * Manages video clip effects state and CRUD operations.
 * Provides optimistic updates and API synchronization.
 */

"use client";

import { useReducer, useCallback, useEffect, useMemo } from "react";
import type {
  ClipEffect,
  EffectsState,
  EffectsAction,
  EffectType,
  EffectPreset,
} from "@/lib/editor/types";
import {
  createEffect,
  resetEffectParams,
  applyEffectPreset,
  EFFECT_CONFIGS,
  EFFECT_PRESETS,
} from "@/lib/editor/utils";

/**
 * Initial state for effects
 */
function createInitialState(): EffectsState {
  return {
    effects: [],
    selectedEffectId: null,
    loading: false,
    error: null,
  };
}

/**
 * Reducer for effects state
 */
function effectsReducer(state: EffectsState, action: EffectsAction): EffectsState {
  switch (action.type) {
    case "SET_EFFECTS":
      return { ...state, effects: action.payload, loading: false, error: null };

    case "ADD_EFFECT":
      return {
        ...state,
        effects: [...state.effects, action.payload],
        selectedEffectId: action.payload.id,
      };

    case "UPDATE_EFFECT":
      return {
        ...state,
        effects: state.effects.map((effect) =>
          effect.id === action.payload.id
            ? { ...effect, ...action.payload.updates }
            : effect
        ),
      };

    case "REMOVE_EFFECT":
      return {
        ...state,
        effects: state.effects.filter((effect) => effect.id !== action.payload),
        selectedEffectId:
          state.selectedEffectId === action.payload ? null : state.selectedEffectId,
      };

    case "REORDER_EFFECTS": {
      const orderMap = new Map(action.payload.map((id, index) => [id, index]));
      return {
        ...state,
        effects: [...state.effects]
          .map((e) => ({ ...e, order: orderMap.get(e.id) ?? e.order }))
          .sort((a, b) => a.order - b.order),
      };
    }

    case "SELECT_EFFECT":
      return { ...state, selectedEffectId: action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "TOGGLE_EFFECT":
      return {
        ...state,
        effects: state.effects.map((effect) =>
          effect.id === action.payload
            ? { ...effect, enabled: !effect.enabled }
            : effect
        ),
      };

    case "RESET_EFFECT": {
      const effectToReset = state.effects.find((e) => e.id === action.payload);
      if (!effectToReset) return state;

      const resetEffect = resetEffectParams(effectToReset);
      return {
        ...state,
        effects: state.effects.map((effect) =>
          effect.id === action.payload ? resetEffect : effect
        ),
      };
    }

    default:
      return state;
  }
}

/**
 * Hook for managing clip effects
 */
export function useEffects(projectId: string, clipId: string) {
  const [state, dispatch] = useReducer(effectsReducer, undefined, createInitialState);

  /**
   * Fetch effects for the clip
   */
  const fetchEffects = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch(
        `/api/editor/project/${projectId}/clip/${clipId}/effect`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch effects");
      }

      dispatch({ type: "SET_EFFECTS", payload: data.data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch effects";
      dispatch({ type: "SET_ERROR", payload: message });
    }
  }, [projectId, clipId]);

  /**
   * Add a new effect
   */
  const addEffect = useCallback(
    async (type: EffectType, params?: Record<string, number>) => {
      const order = state.effects.length;
      const newEffect = createEffect(clipId, type, order, params);

      // Optimistically add
      dispatch({ type: "ADD_EFFECT", payload: newEffect });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/clip/${clipId}/effect`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clipId, type, params }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to add effect");
        }

        // Replace optimistic with server response
        dispatch({ type: "REMOVE_EFFECT", payload: newEffect.id });
        dispatch({ type: "ADD_EFFECT", payload: data.data });

        return data.data as ClipEffect;
      } catch (error) {
        // Rollback
        dispatch({ type: "REMOVE_EFFECT", payload: newEffect.id });
        const message = error instanceof Error ? error.message : "Failed to add effect";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, clipId, state.effects.length]
  );

  /**
   * Update effect parameters
   */
  const updateEffect = useCallback(
    async (effectId: string, updates: { params?: Record<string, number>; enabled?: boolean }) => {
      const original = state.effects.find((e) => e.id === effectId);
      if (!original) return;

      // Optimistically update
      dispatch({
        type: "UPDATE_EFFECT",
        payload: { id: effectId, updates: { ...updates } },
      });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/effect/${effectId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to update effect");
        }

        // Update with server response
        dispatch({
          type: "UPDATE_EFFECT",
          payload: { id: effectId, updates: data.data },
        });

        return data.data as ClipEffect;
      } catch (error) {
        // Rollback
        dispatch({
          type: "UPDATE_EFFECT",
          payload: { id: effectId, updates: original },
        });
        const message = error instanceof Error ? error.message : "Failed to update effect";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, state.effects]
  );

  /**
   * Update single parameter (convenience method)
   */
  const updateParam = useCallback(
    async (effectId: string, key: string, value: number) => {
      const effect = state.effects.find((e) => e.id === effectId);
      if (!effect) return;

      return updateEffect(effectId, {
        params: { ...effect.params, [key]: value },
      });
    },
    [state.effects, updateEffect]
  );

  /**
   * Toggle effect enabled state
   */
  const toggleEffect = useCallback(
    async (effectId: string) => {
      const effect = state.effects.find((e) => e.id === effectId);
      if (!effect) return;

      return updateEffect(effectId, { enabled: !effect.enabled });
    },
    [state.effects, updateEffect]
  );

  /**
   * Reset effect to defaults
   */
  const resetEffect = useCallback(
    async (effectId: string) => {
      const effect = state.effects.find((e) => e.id === effectId);
      if (!effect) return;

      const config = EFFECT_CONFIGS[effect.type];
      const defaultParams: Record<string, number> = {};
      for (const param of config.params) {
        defaultParams[param.key] = param.default;
      }

      return updateEffect(effectId, { params: defaultParams });
    },
    [state.effects, updateEffect]
  );

  /**
   * Remove an effect
   */
  const removeEffect = useCallback(
    async (effectId: string) => {
      const original = state.effects.find((e) => e.id === effectId);
      if (!original) return;

      // Optimistically remove
      dispatch({ type: "REMOVE_EFFECT", payload: effectId });

      try {
        const response = await fetch(
          `/api/editor/project/${projectId}/effect/${effectId}`,
          { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to remove effect");
        }
      } catch (error) {
        // Rollback
        dispatch({ type: "ADD_EFFECT", payload: original });
        const message = error instanceof Error ? error.message : "Failed to remove effect";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    [projectId, state.effects]
  );

  /**
   * Apply a preset
   */
  const applyPreset = useCallback(
    async (preset: EffectPreset) => {
      // Clear existing effects first
      for (const effect of state.effects) {
        await removeEffect(effect.id);
      }

      // Add new effects from preset
      const newEffects: ClipEffect[] = [];
      for (let i = 0; i < preset.effects.length; i++) {
        const effectDef = preset.effects[i];
        const effect = await addEffect(effectDef.type, effectDef.params);
        if (effect) {
          newEffects.push(effect);
        }
      }

      return newEffects;
    },
    [state.effects, removeEffect, addEffect]
  );

  /**
   * Clear all effects
   */
  const clearEffects = useCallback(async () => {
    for (const effect of state.effects) {
      await removeEffect(effect.id);
    }
  }, [state.effects, removeEffect]);

  /**
   * Select an effect
   */
  const selectEffect = useCallback((effectId: string | null) => {
    dispatch({ type: "SELECT_EFFECT", payload: effectId });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  /**
   * Get selected effect
   */
  const selectedEffect = useMemo(() => {
    return state.effects.find((e) => e.id === state.selectedEffectId) ?? null;
  }, [state.effects, state.selectedEffectId]);

  /**
   * Fetch effects on mount
   */
  useEffect(() => {
    if (clipId) {
      fetchEffects();
    }
  }, [fetchEffects, clipId]);

  return {
    // State
    effects: state.effects,
    selectedEffectId: state.selectedEffectId,
    selectedEffect,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchEffects,
    addEffect,
    updateEffect,
    updateParam,
    toggleEffect,
    resetEffect,
    removeEffect,
    applyPreset,
    clearEffects,
    selectEffect,
    clearError,

    // Presets
    presets: EFFECT_PRESETS,
    effectConfigs: EFFECT_CONFIGS,

    // Direct dispatch
    dispatch,
  };
}
