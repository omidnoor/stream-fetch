# Phase 7: Transform Tools

## Goal
Crop, resize, rotate, position clips.

## Backend

### Types
```ts
Transform {
  clipId: string,
  scale: number,      // 0.1 - 3
  rotation: number,   // degrees
  position: { x: number, y: number },
  crop: { top, right, bottom, left },
  flipH: boolean,
  flipV: boolean
}
```

### Services
- `TransformService.update(clipId, transform)`
- FFmpeg transform filter builder

### API Routes
- `PUT /api/editor/project/[id]/clip/[clipId]/transform`

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `TransformPanel` | Controls sidebar |
| `TransformCanvas` | Interactive overlay |
| `CropHandles` | Drag to crop |
| `RotateHandle` | Rotation control |

### Features
- Drag to reposition
- Corner handles to scale
- Edge handles to crop
- Rotation wheel/input
- Flip H/V buttons
- Reset to original
- Aspect ratio lock

### Hooks
- `useTransform(clipId)` - Transform state
- `useTransformGestures()` - Mouse/touch handlers

## FFmpeg Filters
```bash
# Scale
scale=1280:720

# Crop
crop=w:h:x:y

# Rotate
rotate=45*PI/180

# Position (overlay on canvas)
overlay=x=100:y=50

# Flip
hflip / vflip
```

## Picture-in-Picture
Combine transform + overlay for PiP:
```bash
[0:v][1:v]overlay=W-w-10:H-h-10:enable='between(t,0,5)'
```
