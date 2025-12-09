# Phase 2: Media Library

## Goal
Manage uploaded assets, drag to timeline.

## Backend

### Types
```ts
MediaAsset { id, projectId, type, filename, path, duration?, thumbnail?, metadata }
```

### Services
- `MediaService.upload()` - Handle file upload
- `MediaService.list(projectId)` - Get project assets
- `MediaService.delete(assetId)` - Remove asset
- `MediaService.generateThumbnail()` - Create preview

### API Routes
- `GET /api/editor/project/[id]/media` - List assets
- `POST /api/editor/project/[id]/media` - Upload
- `DELETE /api/editor/project/[id]/media/[assetId]` - Delete

### Storage
- Upload to `.cache/editor/media/[projectId]/`
- Generate thumbnails on upload
- Clean up on project delete

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `MediaLibrary` | Main panel |
| `MediaGrid` | Asset thumbnails |
| `MediaItem` | Single asset card |
| `MediaUploader` | Upload dropzone |

### Features
- Grid/list view toggle
- Filter by type (video/audio/image)
- Search by filename
- Drag asset to timeline
- Preview on hover
- Delete with confirmation

### Hooks
- `useMediaLibrary(projectId)` - Fetch/manage assets
- `useDragToTimeline()` - Drag from library to track

## Data Flow
```
Upload file → API validates → Store file → Extract metadata
           → Generate thumbnail → Save to DB → Return asset
```
