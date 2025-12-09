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

// ============================================================================
// Media Library Types
// ============================================================================

/**
 * Media asset types
 */
export type MediaAssetType = "video" | "audio" | "image";

/**
 * Media asset metadata
 */
export interface MediaAssetMetadata {
  /** Duration in seconds (video/audio) */
  duration?: number;
  /** Width in pixels (video/image) */
  width?: number;
  /** Height in pixels (video/image) */
  height?: number;
  /** Frame rate (video) */
  frameRate?: number;
  /** Bitrate in kbps */
  bitrate?: number;
  /** Codec name */
  codec?: string;
  /** Sample rate in Hz (audio) */
  sampleRate?: number;
  /** Number of audio channels */
  channels?: number;
}

/**
 * A media asset in the library
 */
export interface MediaAsset {
  id: string;
  projectId: string;
  type: MediaAssetType;
  filename: string;
  originalFilename: string;
  path: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  metadata: MediaAssetMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for uploading a media asset
 */
export interface UploadMediaDto {
  projectId: string;
  file: File;
}

/**
 * Response after uploading a media asset
 */
export interface MediaAssetDto {
  id: string;
  type: MediaAssetType;
  filename: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  createdAt: Date;
}

/**
 * Media library state
 */
export interface MediaLibraryState {
  assets: MediaAsset[];
  loading: boolean;
  error: string | null;
  filter: MediaAssetType | "all";
  searchQuery: string;
  viewMode: "grid" | "list";
  selectedAssetIds: string[];
}

/**
 * Media library actions
 */
export type MediaLibraryAction =
  | { type: "SET_ASSETS"; payload: MediaAsset[] }
  | { type: "ADD_ASSET"; payload: MediaAsset }
  | { type: "REMOVE_ASSET"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FILTER"; payload: MediaAssetType | "all" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: "grid" | "list" }
  | { type: "SELECT_ASSET"; payload: string }
  | { type: "DESELECT_ASSET"; payload: string }
  | { type: "CLEAR_SELECTION" };

/**
 * Props for MediaLibrary component
 */
export interface MediaLibraryProps {
  projectId: string;
  onAssetSelect?: (asset: MediaAsset) => void;
  onAssetDragStart?: (asset: MediaAsset) => void;
  className?: string;
}

/**
 * Props for MediaItem component
 */
export interface MediaItemProps {
  asset: MediaAsset;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onDoubleClick?: () => void;
  onDragStart?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Props for MediaGrid component
 */
export interface MediaGridProps {
  assets: MediaAsset[];
  selectedIds: string[];
  viewMode: "grid" | "list";
  onAssetSelect: (assetId: string) => void;
  onAssetDoubleClick?: (asset: MediaAsset) => void;
  onAssetDragStart?: (asset: MediaAsset) => void;
  onAssetDelete?: (assetId: string) => void;
  className?: string;
}

/**
 * Props for MediaUploader component
 */
export interface MediaUploaderProps {
  projectId: string;
  onUploadComplete?: (asset: MediaAsset) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

// ============================================================================
// Text Overlay Types
// ============================================================================

/**
 * Text alignment options
 */
export type TextAlign = "left" | "center" | "right";

/**
 * Vertical alignment options
 */
export type TextVerticalAlign = "top" | "middle" | "bottom";

/**
 * Animation types for text overlays
 */
export type TextAnimationType = "none" | "fade" | "slide" | "typewriter" | "scale" | "blur";

/**
 * Slide direction for slide animation
 */
export type SlideDirection = "left" | "right" | "up" | "down";

/**
 * Text animation configuration
 */
export interface TextAnimation {
  /** Animation type */
  type: TextAnimationType;
  /** Animation duration in seconds */
  duration: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Slide direction (for slide animation) */
  slideDirection?: SlideDirection;
  /** Easing function */
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

/**
 * Text style configuration
 */
export interface TextStyle {
  /** Font family */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font weight */
  fontWeight: "normal" | "bold" | number;
  /** Font color (hex or rgba) */
  color: string;
  /** Background color (hex or rgba) */
  backgroundColor?: string;
  /** Text opacity 0-1 */
  opacity: number;
  /** Horizontal alignment */
  align: TextAlign;
  /** Vertical alignment */
  verticalAlign: TextVerticalAlign;
  /** Bold flag */
  bold: boolean;
  /** Italic flag */
  italic: boolean;
  /** Underline flag */
  underline: boolean;
  /** Letter spacing in pixels */
  letterSpacing?: number;
  /** Line height multiplier */
  lineHeight?: number;
  /** Text shadow */
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  /** Text stroke/outline */
  stroke?: {
    width: number;
    color: string;
  };
  /** Padding inside text box */
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Border radius for background */
  borderRadius?: number;
}

/**
 * Text position on the video canvas
 */
export interface TextPosition {
  /** X position as percentage 0-100 */
  x: number;
  /** Y position as percentage 0-100 */
  y: number;
  /** Width as percentage of canvas (optional, auto-sizes if not set) */
  width?: number;
  /** Height as percentage of canvas (optional) */
  height?: number;
  /** Rotation in degrees */
  rotation?: number;
}

/**
 * Text overlay on the timeline
 */
export interface TextOverlay {
  id: string;
  /** Track ID this text belongs to */
  trackId: string;
  /** Text content */
  content: string;
  /** Start time on timeline in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** Position on video canvas */
  position: TextPosition;
  /** Text styling */
  style: TextStyle;
  /** Entry animation */
  animationIn?: TextAnimation;
  /** Exit animation */
  animationOut?: TextAnimation;
  /** Preset name if using a preset */
  preset?: TextPresetType;
  /** Whether the text is locked from editing */
  locked?: boolean;
  /** Whether the text is visible */
  visible?: boolean;
}

/**
 * Available text presets
 */
export type TextPresetType = "title" | "subtitle" | "lower-third" | "caption" | "watermark" | "custom";

/**
 * Text preset configuration
 */
export interface TextPreset {
  type: TextPresetType;
  name: string;
  description: string;
  position: TextPosition;
  style: TextStyle;
  animationIn?: TextAnimation;
  animationOut?: TextAnimation;
  defaultDuration: number;
}

/**
 * Input for creating a text overlay
 */
export interface CreateTextOverlayDto {
  content: string;
  trackId?: string;
  startTime: number;
  duration?: number;
  position?: Partial<TextPosition>;
  style?: Partial<TextStyle>;
  animationIn?: Partial<TextAnimation>;
  animationOut?: Partial<TextAnimation>;
  preset?: TextPresetType;
}

/**
 * Input for updating a text overlay
 */
export interface UpdateTextOverlayDto {
  content?: string;
  startTime?: number;
  duration?: number;
  position?: Partial<TextPosition>;
  style?: Partial<TextStyle>;
  animationIn?: Partial<TextAnimation>;
  animationOut?: Partial<TextAnimation>;
  locked?: boolean;
  visible?: boolean;
}

/**
 * Text overlay state for the editor
 */
export interface TextOverlayState {
  /** All text overlays in the project */
  overlays: TextOverlay[];
  /** Currently selected text ID */
  selectedTextId: string | null;
  /** Whether text is being edited */
  isEditing: boolean;
  /** Currently dragging text ID */
  draggingTextId: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Text overlay actions for state management
 */
export type TextOverlayAction =
  | { type: "SET_OVERLAYS"; payload: TextOverlay[] }
  | { type: "ADD_OVERLAY"; payload: TextOverlay }
  | { type: "UPDATE_OVERLAY"; payload: { id: string; updates: Partial<TextOverlay> } }
  | { type: "REMOVE_OVERLAY"; payload: string }
  | { type: "SELECT_TEXT"; payload: string | null }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "SET_DRAGGING"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "APPLY_PRESET"; payload: { id: string; preset: TextPresetType } }
  | { type: "DUPLICATE_OVERLAY"; payload: string };

/**
 * Props for TextEditor component
 */
export interface TextEditorProps {
  overlay: TextOverlay | null;
  onUpdate: (updates: UpdateTextOverlayDto) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  className?: string;
}

/**
 * Props for TextPreview component
 */
export interface TextPreviewProps {
  overlays: TextOverlay[];
  currentTime: number;
  canvasWidth: number;
  canvasHeight: number;
  selectedTextId?: string | null;
  onTextSelect?: (id: string) => void;
  onTextMove?: (id: string, position: TextPosition) => void;
  className?: string;
}

/**
 * Props for TextTrack component (timeline)
 */
export interface TextTrackProps {
  track: TimelineTrack;
  overlays: TextOverlay[];
  pixelsPerSecond: number;
  selectedTextId: string | null;
  onTextSelect: (id: string) => void;
  onTextMove: (id: string, startTime: number) => void;
  onTextResize: (id: string, duration: number, fromStart?: boolean) => void;
  className?: string;
}

/**
 * Props for TextItem component (on timeline)
 */
export interface TextItemProps {
  overlay: TextOverlay;
  pixelsPerSecond: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: (newStartTime: number) => void;
  onResizeStart: (edge: "start" | "end") => void;
  onResizeEnd: (newDuration: number, fromStart?: boolean) => void;
  className?: string;
}

/**
 * Props for FontPicker component
 */
export interface FontPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
}

/**
 * Props for ColorPicker component
 */
export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
  presets?: string[];
  className?: string;
}

/**
 * Props for AnimationPicker component
 */
export interface AnimationPickerProps {
  value?: TextAnimation;
  onChange: (animation: TextAnimation | undefined) => void;
  label?: string;
  className?: string;
}

// ============================================================================
// Effects & Filters Types
// ============================================================================

/**
 * Available effect types
 */
export type EffectType =
  | "brightness"
  | "contrast"
  | "saturation"
  | "blur"
  | "sharpen"
  | "grayscale"
  | "sepia"
  | "vignette"
  | "hue"
  | "temperature"
  | "shadows"
  | "highlights"
  | "fade";

/**
 * Effect parameter range configuration
 */
export interface EffectParamConfig {
  /** Parameter key name */
  key: string;
  /** Display label */
  label: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step: number;
  /** Default value */
  default: number;
  /** Unit label (%, px, etc.) */
  unit?: string;
}

/**
 * Effect configuration with metadata
 */
export interface EffectConfig {
  type: EffectType;
  name: string;
  description: string;
  icon?: string;
  params: EffectParamConfig[];
  /** CSS filter function name */
  cssFilter?: string;
  /** FFmpeg filter string template */
  ffmpegFilter: string;
}

/**
 * An effect applied to a clip
 */
export interface ClipEffect {
  id: string;
  /** The clip this effect is applied to */
  clipId: string;
  /** Effect type */
  type: EffectType;
  /** Effect parameters */
  params: Record<string, number>;
  /** Whether the effect is enabled */
  enabled: boolean;
  /** Order in the effect chain (lower = applied first) */
  order: number;
}

/**
 * Input for creating an effect
 */
export interface CreateEffectDto {
  clipId: string;
  type: EffectType;
  params?: Record<string, number>;
  enabled?: boolean;
}

/**
 * Input for updating an effect
 */
export interface UpdateEffectDto {
  params?: Record<string, number>;
  enabled?: boolean;
  order?: number;
}

/**
 * Effect preset configuration
 */
export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  /** Effects to apply */
  effects: Array<{
    type: EffectType;
    params: Record<string, number>;
  }>;
  /** Preview thumbnail or gradient */
  preview?: string;
}

/**
 * Effects state for a clip
 */
export interface EffectsState {
  /** Effects for the current clip */
  effects: ClipEffect[];
  /** Currently selected effect ID */
  selectedEffectId: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Effects actions for state management
 */
export type EffectsAction =
  | { type: "SET_EFFECTS"; payload: ClipEffect[] }
  | { type: "ADD_EFFECT"; payload: ClipEffect }
  | { type: "UPDATE_EFFECT"; payload: { id: string; updates: Partial<ClipEffect> } }
  | { type: "REMOVE_EFFECT"; payload: string }
  | { type: "REORDER_EFFECTS"; payload: string[] }
  | { type: "SELECT_EFFECT"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "TOGGLE_EFFECT"; payload: string }
  | { type: "RESET_EFFECT"; payload: string };

/**
 * Props for EffectsPanel component
 */
export interface EffectsPanelProps {
  clipId: string;
  projectId: string;
  onEffectChange?: (effects: ClipEffect[]) => void;
  className?: string;
}

/**
 * Props for EffectSlider component
 */
export interface EffectSliderProps {
  effect: ClipEffect;
  config: EffectConfig;
  onParamChange: (key: string, value: number) => void;
  onToggle: () => void;
  onRemove: () => void;
  onReset: () => void;
  className?: string;
}

/**
 * Props for EffectPreview component
 */
export interface EffectPreviewProps {
  effects: ClipEffect[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for EffectPresets component
 */
export interface EffectPresetsProps {
  onApplyPreset: (preset: EffectPreset) => void;
  className?: string;
}

// ============================================================================
// Transition Types
// ============================================================================

/**
 * Available transition types
 */
export type TransitionType =
  | "fade"
  | "crossfade"
  | "dissolve"
  | "wipe"
  | "wipeLeft"
  | "wipeRight"
  | "wipeUp"
  | "wipeDown"
  | "slide"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoom"
  | "zoomIn"
  | "zoomOut"
  | "none";

/**
 * Transition between two clips
 */
export interface Transition {
  id: string;
  /** Project ID */
  projectId: string;
  /** Source clip ID (clip before transition) */
  fromClipId: string;
  /** Target clip ID (clip after transition) */
  toClipId: string;
  /** Transition type */
  type: TransitionType;
  /** Transition duration in milliseconds */
  duration: number;
  /** Additional transition parameters */
  params?: Record<string, unknown>;
}

/**
 * Transition configuration with metadata
 */
export interface TransitionConfig {
  type: TransitionType;
  name: string;
  description: string;
  icon?: string;
  /** Default duration in milliseconds */
  defaultDuration: number;
  /** Minimum duration in milliseconds */
  minDuration: number;
  /** Maximum duration in milliseconds */
  maxDuration: number;
  /** FFmpeg xfade transition name */
  ffmpegTransition: string;
  /** CSS animation class for preview */
  cssAnimation?: string;
  /** Whether this transition supports direction parameters */
  hasDirection?: boolean;
}

/**
 * Input for creating a transition
 */
export interface CreateTransitionDto {
  fromClipId: string;
  toClipId: string;
  type: TransitionType;
  duration?: number;
  params?: Record<string, unknown>;
}

/**
 * Input for updating a transition
 */
export interface UpdateTransitionDto {
  type?: TransitionType;
  duration?: number;
  params?: Record<string, unknown>;
}

/**
 * Transitions state for the editor
 */
export interface TransitionsState {
  /** All transitions in the project */
  transitions: Transition[];
  /** Currently selected transition ID */
  selectedTransitionId: string | null;
  /** Transition being previewed */
  previewingTransitionId: string | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Transitions actions for state management
 */
export type TransitionsAction =
  | { type: "SET_TRANSITIONS"; payload: Transition[] }
  | { type: "ADD_TRANSITION"; payload: Transition }
  | { type: "UPDATE_TRANSITION"; payload: { id: string; updates: Partial<Transition> } }
  | { type: "REMOVE_TRANSITION"; payload: string }
  | { type: "SELECT_TRANSITION"; payload: string | null }
  | { type: "SET_PREVIEWING"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Props for TransitionHandle component
 */
export interface TransitionHandleProps {
  /** Position between clips (x coordinate) */
  position: number;
  /** Whether a transition exists at this position */
  hasTransition: boolean;
  /** The transition if it exists */
  transition?: Transition;
  /** Whether this handle is selected */
  isSelected: boolean;
  /** Whether this handle is being previewed */
  isPreviewing: boolean;
  /** Click handler to add/edit transition */
  onClick: () => void;
  /** Double-click handler to remove transition */
  onDoubleClick?: () => void;
  /** Hover handler for preview */
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

/**
 * Props for TransitionPicker component
 */
export interface TransitionPickerProps {
  /** Currently selected transition type */
  selectedType?: TransitionType;
  /** Current duration */
  duration?: number;
  /** Called when a transition type is selected */
  onSelect: (type: TransitionType) => void;
  /** Called when duration changes */
  onDurationChange?: (duration: number) => void;
  /** Called when picker is closed */
  onClose?: () => void;
  className?: string;
}

/**
 * Props for TransitionPreview component
 */
export interface TransitionPreviewProps {
  /** Transition to preview */
  transition: Transition;
  /** First clip thumbnail URL */
  fromThumbnail?: string;
  /** Second clip thumbnail URL */
  toThumbnail?: string;
  /** Preview dimensions */
  width?: number;
  height?: number;
  /** Whether to auto-play the preview */
  autoPlay?: boolean;
  className?: string;
}

// ============================================================================
// Audio System Types
// ============================================================================

/**
 * Audio clip with volume and fade controls
 */
export interface AudioClip extends TimelineClip {
  /** Volume level 0-2 (0=mute, 1=normal, 2=boost) */
  volume: number;
  /** Fade in duration in seconds */
  fadeIn?: number;
  /** Fade out duration in seconds */
  fadeOut?: number;
  /** Whether audio is muted */
  muted: boolean;
  /** Audio waveform data (peaks) */
  waveformData?: WaveformData;
}

/**
 * Waveform visualization data
 */
export interface WaveformData {
  /** Array of peak values (0-1) */
  peaks: number[];
  /** Sample rate used for peaks */
  sampleRate: number;
  /** Duration of the audio in seconds */
  duration: number;
  /** Number of channels */
  channels: number;
}

/**
 * Audio configuration for a clip
 */
export interface AudioConfig {
  /** Clip ID */
  clipId: string;
  /** Volume 0-2 */
  volume: number;
  /** Fade in seconds */
  fadeIn: number;
  /** Fade out seconds */
  fadeOut: number;
  /** Muted state */
  muted: boolean;
  /** Pan (-1 left, 0 center, 1 right) */
  pan?: number;
}

/**
 * Input for updating audio settings
 */
export interface UpdateAudioDto {
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  muted?: boolean;
  pan?: number;
}

/**
 * Audio track mixer state
 */
export interface AudioMixerTrack {
  /** Track ID */
  trackId: string;
  /** Track name */
  name: string;
  /** Volume 0-2 */
  volume: number;
  /** Muted state */
  muted: boolean;
  /** Solo state */
  solo: boolean;
  /** Pan (-1 left, 0 center, 1 right) */
  pan: number;
  /** Whether track is visible */
  visible: boolean;
}

/**
 * Master audio mixer state
 */
export interface AudioMixerState {
  /** All audio tracks */
  tracks: AudioMixerTrack[];
  /** Master volume 0-2 */
  masterVolume: number;
  /** Master mute */
  masterMute: boolean;
  /** Whether any track is soloed */
  hasSolo: boolean;
}

/**
 * Audio state for a clip
 */
export interface AudioState {
  /** Audio configuration */
  config: AudioConfig;
  /** Waveform data */
  waveform: WaveformData | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Audio actions for state management
 */
export type AudioAction =
  | { type: "SET_CONFIG"; payload: AudioConfig }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_FADE_IN"; payload: number }
  | { type: "SET_FADE_OUT"; payload: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_PAN"; payload: number }
  | { type: "SET_WAVEFORM"; payload: WaveformData }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Audio mixer actions
 */
export type AudioMixerAction =
  | { type: "SET_TRACKS"; payload: AudioMixerTrack[] }
  | { type: "SET_TRACK_VOLUME"; payload: { trackId: string; volume: number } }
  | { type: "TOGGLE_TRACK_MUTE"; payload: string }
  | { type: "TOGGLE_TRACK_SOLO"; payload: string }
  | { type: "SET_TRACK_PAN"; payload: { trackId: string; pan: number } }
  | { type: "SET_MASTER_VOLUME"; payload: number }
  | { type: "TOGGLE_MASTER_MUTE" };

/**
 * Props for AudioTrack component
 */
export interface AudioTrackProps {
  track: TimelineTrack;
  clips: AudioClip[];
  pixelsPerSecond: number;
  playheadTime: number;
  selectedClipIds: string[];
  onClipSelect: (clipId: string) => void;
  onVolumeChange: (clipId: string, volume: number) => void;
  onFadeChange: (clipId: string, fadeIn?: number, fadeOut?: number) => void;
  className?: string;
}

/**
 * Props for Waveform component
 */
export interface WaveformProps {
  /** Waveform data to display */
  data: WaveformData | null;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Primary color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show progress bar */
  progress?: number;
  /** Click handler */
  onClick?: (position: number) => void;
  className?: string;
}

/**
 * Props for VolumeSlider component
 */
export interface VolumeSliderProps {
  /** Current volume 0-2 */
  value: number;
  /** Called when volume changes */
  onChange: (volume: number) => void;
  /** Whether muted */
  muted?: boolean;
  /** Called when mute toggled */
  onMuteToggle?: () => void;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  /** Show dB labels */
  showDb?: boolean;
  className?: string;
}

/**
 * Props for AudioMixer component
 */
export interface AudioMixerProps {
  /** Project ID */
  projectId: string;
  /** Mixer state */
  state: AudioMixerState;
  /** Called when state changes */
  onChange: (state: AudioMixerState) => void;
  /** Compact mode */
  compact?: boolean;
  className?: string;
}

/**
 * Props for AudioClipSettings component
 */
export interface AudioClipSettingsProps {
  /** Clip ID */
  clipId: string;
  /** Current audio config */
  config: AudioConfig;
  /** Called when settings change */
  onChange: (config: Partial<AudioConfig>) => void;
  className?: string;
}

/**
 * Props for FadeHandle component
 */
export interface FadeHandleProps {
  /** Fade type */
  type: "in" | "out";
  /** Fade duration in seconds */
  duration: number;
  /** Clip duration in seconds */
  clipDuration: number;
  /** Pixels per second */
  pixelsPerSecond: number;
  /** Called when duration changes */
  onChange: (duration: number) => void;
  className?: string;
}

// ============================================================================
// Transform Types
// ============================================================================

/**
 * Crop configuration
 */
export interface CropConfig {
  /** Top crop in pixels */
  top: number;
  /** Right crop in pixels */
  right: number;
  /** Bottom crop in pixels */
  bottom: number;
  /** Left crop in pixels */
  left: number;
}

/**
 * Position configuration
 */
export interface PositionConfig {
  /** X position */
  x: number;
  /** Y position */
  y: number;
}

/**
 * Transform configuration for a clip
 */
export interface Transform {
  /** Clip ID */
  clipId: string;
  /** Scale factor (0.1 - 3.0) */
  scale: number;
  /** Rotation in degrees (0-360) */
  rotation: number;
  /** Position on canvas */
  position: PositionConfig;
  /** Crop values */
  crop: CropConfig;
  /** Flip horizontally */
  flipH: boolean;
  /** Flip vertically */
  flipV: boolean;
  /** Maintain aspect ratio during scale */
  lockAspectRatio: boolean;
}

/**
 * Input for updating transform
 */
export interface UpdateTransformDto {
  scale?: number;
  rotation?: number;
  position?: Partial<PositionConfig>;
  crop?: Partial<CropConfig>;
  flipH?: boolean;
  flipV?: boolean;
  lockAspectRatio?: boolean;
}

/**
 * Transform state for the editor
 */
export interface TransformState {
  /** Current transform */
  transform: Transform;
  /** Whether transform is being edited */
  isEditing: boolean;
  /** Which handle is being dragged */
  activeHandle: TransformHandle | null;
  /** Original transform before edit */
  originalTransform: Transform | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Transform handle types
 */
export type TransformHandle =
  | "move"
  | "scale-tl"
  | "scale-tr"
  | "scale-bl"
  | "scale-br"
  | "scale-t"
  | "scale-r"
  | "scale-b"
  | "scale-l"
  | "crop-t"
  | "crop-r"
  | "crop-b"
  | "crop-l"
  | "rotate";

/**
 * Transform actions for state management
 */
export type TransformAction =
  | { type: "SET_TRANSFORM"; payload: Transform }
  | { type: "SET_SCALE"; payload: number }
  | { type: "SET_ROTATION"; payload: number }
  | { type: "SET_POSITION"; payload: PositionConfig }
  | { type: "SET_CROP"; payload: CropConfig }
  | { type: "TOGGLE_FLIP_H" }
  | { type: "TOGGLE_FLIP_V" }
  | { type: "TOGGLE_ASPECT_LOCK" }
  | { type: "START_EDIT"; payload: { handle: TransformHandle; original: Transform } }
  | { type: "END_EDIT" }
  | { type: "CANCEL_EDIT" }
  | { type: "RESET_TRANSFORM" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Props for TransformPanel component
 */
export interface TransformPanelProps {
  /** Clip ID */
  clipId: string;
  /** Project ID */
  projectId: string;
  /** Current transform */
  transform: Transform;
  /** Called when transform changes */
  onChange: (transform: Transform) => void;
  /** Video dimensions */
  videoDimensions?: { width: number; height: number };
  className?: string;
}

/**
 * Props for TransformCanvas component
 */
export interface TransformCanvasProps {
  /** Clip ID */
  clipId: string;
  /** Current transform */
  transform: Transform;
  /** Canvas dimensions */
  width: number;
  height: number;
  /** Video dimensions */
  videoWidth: number;
  videoHeight: number;
  /** Called when transform changes */
  onChange: (transform: Partial<Transform>) => void;
  /** Whether to show handles */
  showHandles?: boolean;
  className?: string;
}

/**
 * Props for CropHandles component
 */
export interface CropHandlesProps {
  /** Current crop */
  crop: CropConfig;
  /** Clip dimensions */
  width: number;
  height: number;
  /** Called when crop changes */
  onChange: (crop: CropConfig) => void;
  /** Whether handles are visible */
  visible?: boolean;
  className?: string;
}

/**
 * Props for RotateHandle component
 */
export interface RotateHandleProps {
  /** Current rotation in degrees */
  rotation: number;
  /** Center point */
  centerX: number;
  centerY: number;
  /** Radius from center */
  radius: number;
  /** Called when rotation changes */
  onChange: (rotation: number) => void;
  /** Whether handle is visible */
  visible?: boolean;
  className?: string;
}

/**
 * Props for TransformPreset component
 */
export interface TransformPresetProps {
  /** Preset transforms */
  presets: Array<{
    id: string;
    name: string;
    transform: Partial<Transform>;
  }>;
  /** Called when preset is selected */
  onSelect: (transform: Partial<Transform>) => void;
  className?: string;
}
