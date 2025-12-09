"use client";

import { useReducer, useCallback, useMemo } from "react";
import type {
  TimelineState,
  TimelineAction,
  TimelineTrack,
  TimelineClip,
  SnapConfig,
} from "@/lib/editor/types";
import {
  createDefaultTimelineState,
  calculateTimelineDuration,
  splitClip as splitClipUtil,
  generateClipId,
} from "@/lib/editor/utils";

/**
 * Timeline state reducer
 */
function timelineReducer(
  state: TimelineState,
  action: TimelineAction
): TimelineState {
  switch (action.type) {
    case "SET_TRACKS":
      return {
        ...state,
        tracks: action.payload,
        duration: calculateTimelineDuration(action.payload),
      };

    case "ADD_TRACK":
      return {
        ...state,
        tracks: [...state.tracks, action.payload],
      };

    case "REMOVE_TRACK":
      return {
        ...state,
        tracks: state.tracks.filter((t) => t.id !== action.payload),
        duration: calculateTimelineDuration(
          state.tracks.filter((t) => t.id !== action.payload)
        ),
      };

    case "UPDATE_TRACK": {
      const { id, updates } = action.payload;
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      };
    }

    case "ADD_CLIP": {
      const { trackId, clip } = action.payload;
      const newTracks = state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      );
      return {
        ...state,
        tracks: newTracks,
        duration: calculateTimelineDuration(newTracks),
      };
    }

    case "REMOVE_CLIP": {
      const { trackId, clipId } = action.payload;
      const newTracks = state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t
      );
      return {
        ...state,
        tracks: newTracks,
        duration: calculateTimelineDuration(newTracks),
        selection: {
          ...state.selection,
          clipIds: state.selection.clipIds.filter((id) => id !== clipId),
        },
      };
    }

    case "UPDATE_CLIP": {
      const { trackId, clipId, updates } = action.payload;
      const newTracks = state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) =>
                c.id === clipId ? { ...c, ...updates } : c
              ),
            }
          : t
      );
      return {
        ...state,
        tracks: newTracks,
        duration: calculateTimelineDuration(newTracks),
      };
    }

    case "MOVE_CLIP": {
      const { clipId, fromTrackId, toTrackId, newStartTime } = action.payload;

      // Find the clip
      const fromTrack = state.tracks.find((t) => t.id === fromTrackId);
      const clip = fromTrack?.clips.find((c) => c.id === clipId);
      if (!clip) return state;

      const movedClip = { ...clip, startTime: newStartTime, trackId: toTrackId };

      const newTracks = state.tracks.map((t) => {
        if (t.id === fromTrackId && fromTrackId !== toTrackId) {
          // Remove from source track
          return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
        }
        if (t.id === toTrackId) {
          if (fromTrackId === toTrackId) {
            // Same track - update position
            return {
              ...t,
              clips: t.clips.map((c) => (c.id === clipId ? movedClip : c)),
            };
          }
          // Different track - add to target
          return { ...t, clips: [...t.clips, movedClip] };
        }
        return t;
      });

      return {
        ...state,
        tracks: newTracks,
        duration: calculateTimelineDuration(newTracks),
      };
    }

    case "SET_PLAYHEAD":
      return {
        ...state,
        playhead: { ...state.playhead, ...action.payload },
      };

    case "SEEK":
      return {
        ...state,
        playhead: { ...state.playhead, currentTime: Math.max(0, action.payload) },
      };

    case "PLAY":
      return {
        ...state,
        playhead: { ...state.playhead, isPlaying: true },
      };

    case "PAUSE":
      return {
        ...state,
        playhead: { ...state.playhead, isPlaying: false },
      };

    case "SET_PLAYBACK_RATE":
      return {
        ...state,
        playhead: { ...state.playhead, playbackRate: action.payload },
      };

    case "SET_ZOOM":
      return {
        ...state,
        view: { ...state.view, zoom: Math.max(0.1, Math.min(5, action.payload)) },
      };

    case "SET_SCROLL":
      return {
        ...state,
        view: { ...state.view, scrollLeft: Math.max(0, action.payload) },
      };

    case "SET_SELECTION":
      return {
        ...state,
        selection: { ...state.selection, ...action.payload },
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selection: { clipIds: [], trackIds: [], timeRange: undefined },
      };

    case "SET_SNAP_CONFIG":
      return {
        ...state,
        snap: { ...state.snap, ...action.payload },
      };

    case "SET_DRAG_STATE":
      return {
        ...state,
        drag: { ...state.drag, ...action.payload },
      };

    case "SPLIT_CLIP": {
      const { trackId, clipId, splitTime } = action.payload;
      const track = state.tracks.find((t) => t.id === trackId);
      const clip = track?.clips.find((c) => c.id === clipId);

      if (!clip) return state;

      const result = splitClipUtil(clip, splitTime);
      if (!result) return state;

      const [firstClip, secondClip] = result;
      // Generate new unique IDs
      firstClip.id = generateClipId();
      secondClip.id = generateClipId();

      const newTracks = state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips
                .filter((c) => c.id !== clipId)
                .concat([firstClip, secondClip]),
            }
          : t
      );

      return {
        ...state,
        tracks: newTracks,
        selection: {
          ...state.selection,
          clipIds: state.selection.clipIds.includes(clipId)
            ? [firstClip.id, secondClip.id]
            : state.selection.clipIds,
        },
      };
    }

    case "CUT_AT_PLAYHEAD": {
      const { trackId, clipId } = action.payload;
      return timelineReducer(state, {
        type: "SPLIT_CLIP",
        payload: { trackId, clipId, splitTime: state.playhead.currentTime },
      });
    }

    default:
      return state;
  }
}

/**
 * Initial state factory
 */
function createInitialState(
  initialTracks?: TimelineTrack[]
): TimelineState {
  const defaultState = createDefaultTimelineState();

  if (initialTracks) {
    return {
      ...defaultState,
      tracks: initialTracks,
      duration: calculateTimelineDuration(initialTracks),
    };
  }

  return defaultState;
}

/**
 * useTimeline Hook
 *
 * Manages the complete timeline state including tracks, clips,
 * playhead position, selection, zoom, and drag operations.
 */
export function useTimeline(initialTracks?: TimelineTrack[]) {
  const [state, dispatch] = useReducer(
    timelineReducer,
    initialTracks,
    createInitialState
  );

  // Track operations
  const addTrack = useCallback((track: TimelineTrack) => {
    dispatch({ type: "ADD_TRACK", payload: track });
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    dispatch({ type: "REMOVE_TRACK", payload: trackId });
  }, []);

  const updateTrack = useCallback(
    (trackId: string, updates: Partial<TimelineTrack>) => {
      dispatch({ type: "UPDATE_TRACK", payload: { id: trackId, updates } });
    },
    []
  );

  // Clip operations
  const addClip = useCallback((trackId: string, clip: TimelineClip) => {
    dispatch({ type: "ADD_CLIP", payload: { trackId, clip } });
  }, []);

  const removeClip = useCallback((trackId: string, clipId: string) => {
    dispatch({ type: "REMOVE_CLIP", payload: { trackId, clipId } });
  }, []);

  const updateClip = useCallback(
    (trackId: string, clipId: string, updates: Partial<TimelineClip>) => {
      dispatch({ type: "UPDATE_CLIP", payload: { trackId, clipId, updates } });
    },
    []
  );

  const moveClip = useCallback(
    (
      clipId: string,
      fromTrackId: string,
      toTrackId: string,
      newStartTime: number
    ) => {
      dispatch({
        type: "MOVE_CLIP",
        payload: { clipId, fromTrackId, toTrackId, newStartTime },
      });
    },
    []
  );

  const splitClip = useCallback(
    (trackId: string, clipId: string, splitTime: number) => {
      dispatch({
        type: "SPLIT_CLIP",
        payload: { trackId, clipId, splitTime },
      });
    },
    []
  );

  const cutAtPlayhead = useCallback((trackId: string, clipId: string) => {
    dispatch({ type: "CUT_AT_PLAYHEAD", payload: { trackId, clipId } });
  }, []);

  // Playhead operations
  const seek = useCallback((time: number) => {
    dispatch({ type: "SEEK", payload: time });
  }, []);

  const play = useCallback(() => {
    dispatch({ type: "PLAY" });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const togglePlayback = useCallback(() => {
    if (state.playhead.isPlaying) {
      dispatch({ type: "PAUSE" });
    } else {
      dispatch({ type: "PLAY" });
    }
  }, [state.playhead.isPlaying]);

  const setPlaybackRate = useCallback((rate: number) => {
    dispatch({ type: "SET_PLAYBACK_RATE", payload: rate });
  }, []);

  // View operations
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const zoomIn = useCallback(() => {
    dispatch({ type: "SET_ZOOM", payload: state.view.zoom * 1.25 });
  }, [state.view.zoom]);

  const zoomOut = useCallback(() => {
    dispatch({ type: "SET_ZOOM", payload: state.view.zoom / 1.25 });
  }, [state.view.zoom]);

  const setScroll = useCallback((scrollLeft: number) => {
    dispatch({ type: "SET_SCROLL", payload: scrollLeft });
  }, []);

  // Selection operations
  const selectClip = useCallback(
    (clipId: string, multiSelect: boolean = false) => {
      if (multiSelect) {
        const newSelection = state.selection.clipIds.includes(clipId)
          ? state.selection.clipIds.filter((id) => id !== clipId)
          : [...state.selection.clipIds, clipId];
        dispatch({ type: "SET_SELECTION", payload: { clipIds: newSelection } });
      } else {
        dispatch({ type: "SET_SELECTION", payload: { clipIds: [clipId] } });
      }
    },
    [state.selection.clipIds]
  );

  const selectTrack = useCallback(
    (trackId: string, multiSelect: boolean = false) => {
      if (multiSelect) {
        const newSelection = state.selection.trackIds.includes(trackId)
          ? state.selection.trackIds.filter((id) => id !== trackId)
          : [...state.selection.trackIds, trackId];
        dispatch({ type: "SET_SELECTION", payload: { trackIds: newSelection } });
      } else {
        dispatch({ type: "SET_SELECTION", payload: { trackIds: [trackId] } });
      }
    },
    [state.selection.trackIds]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  // Snap config
  const setSnapConfig = useCallback((config: Partial<SnapConfig>) => {
    dispatch({ type: "SET_SNAP_CONFIG", payload: config });
  }, []);

  // Bulk operations
  const setTracks = useCallback((tracks: TimelineTrack[]) => {
    dispatch({ type: "SET_TRACKS", payload: tracks });
  }, []);

  // Computed values
  const pixelsPerSecond = useMemo(
    () => state.view.basePixelsPerSecond * state.view.zoom,
    [state.view.basePixelsPerSecond, state.view.zoom]
  );

  const selectedClips = useMemo(() => {
    const clips: TimelineClip[] = [];
    state.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (state.selection.clipIds.includes(clip.id)) {
          clips.push(clip);
        }
      });
    });
    return clips;
  }, [state.tracks, state.selection.clipIds]);

  return {
    // State
    state,
    dispatch,

    // Computed
    pixelsPerSecond,
    selectedClips,

    // Track operations
    addTrack,
    removeTrack,
    updateTrack,
    setTracks,

    // Clip operations
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    cutAtPlayhead,

    // Playhead operations
    seek,
    play,
    pause,
    togglePlayback,
    setPlaybackRate,

    // View operations
    setZoom,
    zoomIn,
    zoomOut,
    setScroll,

    // Selection operations
    selectClip,
    selectTrack,
    clearSelection,

    // Snap config
    setSnapConfig,
  };
}

export type UseTimelineReturn = ReturnType<typeof useTimeline>;
