# Phase 3: Text & Titles

## Goal
Add text overlays with styling and animation.

## Backend

### Types
```ts
TextOverlay {
  id, trackId, startTime, duration,
  content, position: {x, y},
  style: { fontFamily, fontSize, color, bgColor, align },
  animation?: { type: 'fade'|'slide'|'typewriter', duration }
}
```

### Services
- Extend `EditorService` with text CRUD
- FFmpeg text filter generation for export

### API Routes
- `POST /api/editor/project/[id]/text` - Add text
- `PUT /api/editor/project/[id]/text/[textId]` - Update
- `DELETE /api/editor/project/[id]/text/[textId]` - Delete

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `TextTrack` | Text items on timeline |
| `TextEditor` | Edit text properties |
| `TextPreview` | Overlay on video player |
| `FontPicker` | Font selection |
| `ColorPicker` | Color selection |

### Features
- Add text at playhead
- Drag to position on video
- Resize text box
- Style panel (font, size, color, bg)
- Animation presets
- Duration on timeline

### Hooks
- `useTextOverlay(projectId)` - Text CRUD
- `useTextDrag()` - Position text on canvas

## FFmpeg Integration
```bash
# Text filter example
drawtext=text='Hello':fontsize=48:fontcolor=white:x=100:y=100
```

## Presets
- Title (centered, large)
- Lower third (bottom left, with bg)
- Caption (bottom center)
- Watermark (corner, small)
