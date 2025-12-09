# Phase 1: Timeline Engine

## Goal
Core engine that all features depend on.

## Backend

### Types (`src/lib/editor/types.ts`)
```ts
TimelineTrack { id, type: 'video'|'audio'|'text', clips[] }
TimelineClip { id, trackId, startTime, duration, sourceStart, sourceEnd }
PlayheadState { currentTime, isPlaying, playbackRate }
```

### Services
- `TimelineService` - CRUD for tracks/clips
- Extend `EditorService` with track operations

### API Routes
- `PUT /api/editor/project/[id]/timeline` - Update timeline
- `POST /api/editor/project/[id]/clip` - Add clip
- `DELETE /api/editor/project/[id]/clip/[clipId]` - Remove clip

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `TimelineEngine` | Core state machine |
| `Track` | Single track row |
| `ClipHandle` | Draggable clip |
| `Playhead` | Current position indicator |
| `TimeRuler` | Time markers |

### Hooks
- `useTimeline()` - Timeline state & actions
- `usePlayback()` - Play/pause/seek
- `useDragClip()` - Clip drag-drop logic

### Key Operations
- Cut clip at playhead
- Trim clip edges (drag handles)
- Split clip
- Move clip (drag)
- Snap to grid/other clips

## Data Flow
```
User drags clip → useDragClip updates local state
              → Debounced save to server
              → Timeline re-renders
```

## Reusable Utils
- `timeToPixels(time, zoom)` / `pixelsToTime(px, zoom)`
- `snapToGrid(time, gridSize)`
- `getClipAtTime(clips, time)`
- `detectOverlap(clip, otherClips)`
