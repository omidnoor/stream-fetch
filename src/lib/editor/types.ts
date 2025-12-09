/**
 * Timeline Engine Types
 *
 * Core types for the video editor timeline engine.
 * These types power the frontend timeline state and interactions.
 */

/**
 * Track types available in the timeline
 */
export type TrackType = "video" | "audio" | "text";

/**
 * A clip on the timeline with source reference and position info
 */
export interface TimelineClip {
  id: string;
  trackId: string;
  /** Start time on the timeline (seconds) */
  startTime: number;
  /** Duration on the timeline (seconds) */
  duration: number;
  /** Start time in the source media (seconds) */
  sourceStart: number;
  /** End time in the source media (seconds) */
  sourceEnd: number;
  /** Source file URL or path */
  sourceUrl: string;
  /** Display name for the clip */
  name: string;
  /** Volume level 0-1 (for video/audio tracks) */
  volume?: number;
  /** Whether audio is muted */
  muted?: boolean;
  /** Z-index for layering */
  layer?: number;
}

/**
 * A track containing clips of the same type
 */
export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  clips: TimelineClip[];
  /** Whether the track is muted */
  muted: boolean;
  /** Whether the track is locked (no edits) */
  locked: boolean;
  /** Whether the track is visible in preview */
  visible: boolean;
  /** Track height in pixels */
  height: number;
}

/**
 * Playhead state for timeline navigation
 */
export interface PlayheadState {
  /** Current playhead position in seconds */
  currentTime: number;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Playback speed multiplier (0.5, 1, 1.5, 2, etc.) */
  playbackRate: number;
}

/**
 * Timeline zoom and view state
 */
export interface TimelineViewState {
  /** Zoom level (1 = 100%, 0.5 = 50%, 2 = 200%) */
  zoom: number;
  /** Horizontal scroll offset in pixels */
  scrollLeft: number;
  /** Pixels per second at zoom level 1 */
  basePixelsPerSecond: number;
}

/**
 * Selection state for timeline items
 */
export interface TimelineSelection {
  /** Selected clip IDs */
  clipIds: string[];
  /** Selected track IDs */
  trackIds: string[];
  /** Time range selection (for multi-select) */
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Snap configuration for timeline operations
 */
export interface SnapConfig {
  /** Whether snapping is enabled */
  enabled: boolean;
  /** Snap to playhead */
  toPlayhead: boolean;
  /** Snap to clip edges */
  toClips: boolean;
  /** Snap to grid */
  toGrid: boolean;
  /** Grid size in seconds */
  gridSize: number;
  /** Snap threshold in pixels */
  threshold: number;
}

/**
 * Drag state for clip manipulation
 */
export interface DragState {
  /** Whether a drag is in progress */
  isDragging: boolean;
  /** The clip being dragged */
  clipId: string | null;
  /** The track the clip is being dragged over */
  targetTrackId: string | null;
  /** Original clip position before drag */
  originalStartTime: number;
  /** Current drag offset in seconds */
  deltaTime: number;
  /** Type of drag operation */
  dragType: "move" | "trim-start" | "trim-end" | null;
}

/**
 * Complete timeline state
 */
export interface TimelineState {
  tracks: TimelineTrack[];
  playhead: PlayheadState;
  view: TimelineViewState;
  selection: TimelineSelection;
  snap: SnapConfig;
  drag: DragState;
  /** Total duration of the timeline in seconds */
  duration: number;
}

/**
 * Timeline action types for state management
 */
export type TimelineAction =
  | { type: "SET_TRACKS"; payload: TimelineTrack[] }
  | { type: "ADD_TRACK"; payload: TimelineTrack }
  | { type: "REMOVE_TRACK"; payload: string }
  | { type: "UPDATE_TRACK"; payload: { id: string; updates: Partial<TimelineTrack> } }
  | { type: "ADD_CLIP"; payload: { trackId: string; clip: TimelineClip } }
  | { type: "REMOVE_CLIP"; payload: { trackId: string; clipId: string } }
  | { type: "UPDATE_CLIP"; payload: { trackId: string; clipId: string; updates: Partial<TimelineClip> } }
  | { type: "MOVE_CLIP"; payload: { clipId: string; fromTrackId: string; toTrackId: string; newStartTime: number } }
  | { type: "SET_PLAYHEAD"; payload: Partial<PlayheadState> }
  | { type: "SEEK"; payload: number }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SET_PLAYBACK_RATE"; payload: number }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_SCROLL"; payload: number }
  | { type: "SET_SELECTION"; payload: Partial<TimelineSelection> }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_SNAP_CONFIG"; payload: Partial<SnapConfig> }
  | { type: "SET_DRAG_STATE"; payload: Partial<DragState> }
  | { type: "SPLIT_CLIP"; payload: { trackId: string; clipId: string; splitTime: number } }
  | { type: "CUT_AT_PLAYHEAD"; payload: { trackId: string; clipId: string } };

/**
 * Props for timeline components
 */
export interface TimelineProps {
  state: TimelineState;
  dispatch: (action: TimelineAction) => void;
  onSave?: () => void;
  className?: string;
}

/**
 * Props for individual track components
 */
export interface TrackProps {
  track: TimelineTrack;
  pixelsPerSecond: number;
  playheadTime: number;
  selectedClipIds: string[];
  onClipSelect: (clipId: string, multiSelect?: boolean) => void;
  onClipDragStart: (clipId: string, dragType: DragState["dragType"]) => void;
  onClipDragEnd: () => void;
  className?: string;
}

/**
 * Props for clip handle components
 */
export interface ClipHandleProps {
  clip: TimelineClip;
  pixelsPerSecond: number;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (multiSelect?: boolean) => void;
  onDragStart: (dragType: DragState["dragType"]) => void;
  onDragEnd: () => void;
  className?: string;
}

/**
 * Props for playhead component
 */
export interface PlayheadProps {
  time: number;
  pixelsPerSecond: number;
  height: number;
  onSeek?: (time: number) => void;
  className?: string;
}

/**
 * Props for time ruler component
 */
export interface TimeRulerProps {
  duration: number;
  pixelsPerSecond: number;
  scrollLeft: number;
  width: number;
  onSeek?: (time: number) => void;
  className?: string;
}
