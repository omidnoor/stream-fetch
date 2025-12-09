# Phase 5: Transitions

## Goal
Smooth transitions between clips.

## Backend

### Types
```ts
Transition {
  id, fromClipId, toClipId,
  type: TransitionType,
  duration: number, // ms
  params?: Record<string, unknown>
}

TransitionType = 'fade'|'crossfade'|'dissolve'|'wipe'|'slide'|'zoom'
```

### Services
- `TransitionService.add(fromClip, toClip, type)`
- `TransitionService.update(id, params)`
- `TransitionService.remove(id)`
- FFmpeg transition filter builder

### API Routes
- `POST /api/editor/project/[id]/transition`
- `PUT /api/editor/project/[id]/transition/[id]`
- `DELETE /api/editor/project/[id]/transition/[id]`

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `TransitionHandle` | Between-clip indicator |
| `TransitionPicker` | Select transition type |
| `TransitionPreview` | Animated preview |

### Features
- Click between clips to add
- Drag edges to adjust duration
- Preview on hover
- Double-click to remove

### Hooks
- `useTransitions(projectId)` - Transition state
- `useTransitionPreview()` - CSS animation

## FFmpeg Transitions
```bash
# Crossfade
xfade=transition=fade:duration=0.5:offset=4.5

# Wipe
xfade=transition=wipeleft:duration=1:offset=4

# Dissolve
xfade=transition=dissolve:duration=0.5:offset=4.5
```

## Constraints
- Transition duration <= shorter clip duration
- Auto-adjust if clip trimmed
- Handle overlapping audio
