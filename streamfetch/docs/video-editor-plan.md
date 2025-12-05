# Video Editor Implementation Plan

## Overview

This document tracks the implementation of a professional, scalable video editing feature for the StreamFetch application. The implementation follows a hybrid approach (client + server) and maintains consistency with the existing architecture patterns.

## Architecture Summary

- **Client-side**: Real-time preview, timeline manipulation, UI interactions
- **Server-side**: Heavy processing, rendering, format conversion
- **Pattern**: Service Layer → Repository → Validator → Mapper → Factory (consistent with existing dubbing/youtube services)

---

## Implementation Todo List

### Phase 0: Setup & Infrastructure

- [ ] Install required dependencies
  - [ ] `fluent-ffmpeg` (server-side video processing)
  - [ ] `@ffmpeg/ffmpeg` & `@ffmpeg/util` (client-side preview)
  - [ ] `fabric` (canvas-based timeline/editing)
  - [ ] `wavesurfer.js` (audio waveform visualization)
  - [ ] `react-player` (video playback)
  - [ ] `uuid` (unique ID generation)
  - [ ] `@types/fluent-ffmpeg` (TypeScript types)

- [ ] Verify FFmpeg installation on system
  - [ ] Check FFmpeg is available in PATH
  - [ ] Document FFmpeg installation requirements

- [ ] Create folder structure
  - [ ] `src/app/editor/` - Editor page
  - [ ] `src/app/projects/` - Projects management pages
  - [ ] `src/app/api/editor/` - API routes
  - [ ] `src/components/editor/` - Editor components
  - [ ] `src/services/editor/` - Editor service layer
  - [ ] `src/services/ffmpeg/` - FFmpeg processing service
  - [ ] `src/lib/errors/editor.errors.ts` - Editor error classes

---

### Phase 1: Core Infrastructure (Foundation)

#### 1.1 Type Definitions & Interfaces

- [ ] Create `src/services/editor/editor.types.ts`
  - [ ] `VideoProject` interface
  - [ ] `TimelineData` interface
  - [ ] `VideoClip` interface
  - [ ] `AudioTrack` interface
  - [ ] `TextOverlay` interface
  - [ ] `Effect` interface
  - [ ] `ProjectSettings` interface
  - [ ] `ExportSettings` interface
  - [ ] Status enums (`'draft' | 'processing' | 'completed' | 'failed'`)

#### 1.2 Error Handling

- [ ] Create `src/lib/errors/editor.errors.ts`
  - [ ] `EditorError` base class
  - [ ] `VideoProcessingError`
  - [ ] `RenderError`
  - [ ] `InvalidProjectError`
  - [ ] `ExportError`
  - [ ] `UploadError`

#### 1.3 Validator Layer

- [ ] Create `src/services/editor/editor.validator.ts`
  - [ ] `validateVideoFile()` - Check file type, size, format
  - [ ] `validateProjectData()` - Validate project structure
  - [ ] `validateTimelineData()` - Validate timeline integrity
  - [ ] `validateExportSettings()` - Validate export parameters
  - [ ] `validateTextOverlay()` - Validate text overlay data
  - [ ] Max file size configuration (e.g., 500MB)

#### 1.4 Mapper Layer

- [ ] Create `src/services/editor/editor.mapper.ts`
  - [ ] `toProjectDTO()` - Map internal project to DTO
  - [ ] `fromProjectDTO()` - Map DTO to internal project
  - [ ] `toTimelineDTO()` - Map timeline data
  - [ ] `toExportResponse()` - Map export result

#### 1.5 Repository Layer

- [ ] Create `src/services/editor/editor.repository.ts`
  - [ ] `saveProject()` - Save project to storage
  - [ ] `getProject()` - Retrieve project by ID
  - [ ] `listProjects()` - List all user projects
  - [ ] `deleteProject()` - Delete project
  - [ ] `updateProject()` - Update project data
  - [ ] Implement in-memory storage (Phase 1)
  - [ ] Plan for database integration (Phase 2+)

#### 1.6 FFmpeg Service

- [ ] Create `src/services/ffmpeg/ffmpeg.types.ts`
  - [ ] `FFmpegCommand` interface
  - [ ] `ProcessingOptions` interface
  - [ ] `RenderOptions` interface
  - [ ] `ThumbnailOptions` interface

- [ ] Create `src/services/ffmpeg/ffmpeg.service.ts`
  - [ ] `trimVideo()` - Cut/trim video segments
  - [ ] `concatenateVideos()` - Join multiple clips
  - [ ] `extractThumbnail()` - Generate thumbnail
  - [ ] `addAudioTrack()` - Mix audio
  - [ ] `applyFilter()` - Apply video filters
  - [ ] `renderFinalVideo()` - Export final video
  - [ ] `getVideoMetadata()` - Extract video info
  - [ ] Progress tracking for long operations

- [ ] Create `src/services/ffmpeg/index.ts` - Export barrel file

#### 1.7 Editor Service

- [ ] Create `src/services/editor/editor.service.ts`
  - [ ] `createProject()` - Initialize new project
  - [ ] `loadProject()` - Load existing project
  - [ ] `saveProject()` - Save project state
  - [ ] `addVideoClip()` - Add video to timeline
  - [ ] `removeClip()` - Remove clip from timeline
  - [ ] `updateClipProperties()` - Modify clip (trim, position, etc.)
  - [ ] `addTextOverlay()` - Add text layer
  - [ ] `exportProject()` - Render and export video
  - [ ] Integration with FFmpeg service

- [ ] Create `src/services/editor/editor.factory.ts`
  - [ ] `createEditorService()` - Factory function
  - [ ] Dependency injection setup

- [ ] Create `src/services/editor/index.ts` - Export barrel file

---

### Phase 2: API Routes

#### 2.1 Upload & Import

- [ ] Create `src/app/api/editor/upload/route.ts`
  - [ ] `POST /api/editor/upload` - Upload video file
  - [ ] File validation
  - [ ] Store in temp directory
  - [ ] Return file metadata
  - [ ] Error handling

#### 2.2 Project Management

- [ ] Create `src/app/api/editor/project/route.ts`
  - [ ] `POST /api/editor/project` - Create new project
  - [ ] `GET /api/editor/project` - List all projects
  - [ ] Error handling

- [ ] Create `src/app/api/editor/project/[id]/route.ts`
  - [ ] `GET /api/editor/project/[id]` - Get project by ID
  - [ ] `PUT /api/editor/project/[id]` - Update project
  - [ ] `DELETE /api/editor/project/[id]` - Delete project
  - [ ] Error handling

#### 2.3 Video Processing

- [ ] Create `src/app/api/editor/process/route.ts`
  - [ ] `POST /api/editor/process` - Process video operation
  - [ ] Handle trim, cut, filter operations
  - [ ] Return processed result
  - [ ] Error handling

#### 2.4 Rendering & Export

- [ ] Create `src/app/api/editor/render/route.ts`
  - [ ] `POST /api/editor/render` - Start render job
  - [ ] Queue system for heavy operations
  - [ ] Progress tracking
  - [ ] Error handling

- [ ] Create `src/app/api/editor/export/route.ts`
  - [ ] `GET /api/editor/export/[id]` - Download rendered video
  - [ ] Stream video file
  - [ ] Cleanup temp files
  - [ ] Error handling

#### 2.5 Utilities

- [ ] Create `src/app/api/editor/thumbnail/route.ts`
  - [ ] `POST /api/editor/thumbnail` - Generate video thumbnail
  - [ ] Cache thumbnails
  - [ ] Error handling

- [ ] Implement error middleware for editor routes
  - [ ] Leverage existing `src/middleware/error-handler.ts`
  - [ ] Add editor-specific error handling

---

### Phase 3: UI Components

#### 3.1 Core Editor Components

- [ ] Create `src/components/editor/video-player.tsx`
  - [ ] Video playback controls
  - [ ] Play/pause/seek functionality
  - [ ] Current time display
  - [ ] Volume control
  - [ ] Fullscreen support

- [ ] Create `src/components/editor/timeline.tsx`
  - [ ] Visual timeline representation
  - [ ] Drag-and-drop clip reordering
  - [ ] Clip trimming handles
  - [ ] Zoom in/out timeline
  - [ ] Playhead scrubbing
  - [ ] Multiple track support

- [ ] Create `src/components/editor/media-library.tsx`
  - [ ] Display imported media
  - [ ] Upload new media button
  - [ ] Media thumbnail grid
  - [ ] Drag to timeline functionality
  - [ ] Media info display

- [ ] Create `src/components/editor/effects-panel.tsx`
  - [ ] List available effects/filters
  - [ ] Apply effect to selected clip
  - [ ] Effect parameters controls
  - [ ] Preview effects

- [ ] Create `src/components/editor/text-overlay.tsx`
  - [ ] Add text to video
  - [ ] Font selection
  - [ ] Color picker
  - [ ] Position controls
  - [ ] Animation options

- [ ] Create `src/components/editor/export-modal.tsx`
  - [ ] Export settings form
  - [ ] Resolution selection
  - [ ] Format selection (MP4, WebM, etc.)
  - [ ] Quality settings
  - [ ] Export progress indicator
  - [ ] Download button

#### 3.2 Additional UI Components

- [ ] Create `src/components/editor/toolbar.tsx`
  - [ ] Tool buttons (cut, trim, text, etc.)
  - [ ] Save project button
  - [ ] Export button
  - [ ] Undo/redo functionality

- [ ] Create `src/components/editor/properties-panel.tsx`
  - [ ] Display selected clip properties
  - [ ] Editable properties (duration, position, etc.)
  - [ ] Live preview of changes

- [ ] Create `src/components/project-card.tsx`
  - [ ] Project thumbnail
  - [ ] Project name and metadata
  - [ ] Open/delete actions
  - [ ] Consistent with existing card components

---

### Phase 4: Pages & Routing

#### 4.1 Editor Page

- [ ] Create `src/app/editor/page.tsx`
  - [ ] Main editor layout
  - [ ] Integrate video player
  - [ ] Integrate timeline
  - [ ] Integrate media library
  - [ ] Integrate effects panel
  - [ ] Integrate toolbar
  - [ ] State management for editor
  - [ ] Auto-save functionality

#### 4.2 Projects Page

- [ ] Create `src/app/projects/page.tsx`
  - [ ] List all video projects
  - [ ] Display project cards
  - [ ] Create new project button
  - [ ] Search/filter projects
  - [ ] Delete project functionality

- [ ] Create `src/app/projects/[id]/page.tsx`
  - [ ] Load specific project into editor
  - [ ] Redirect to editor with project data
  - [ ] Error handling for invalid project ID

#### 4.3 Navigation Integration

- [ ] Update `src/components/sidebar.tsx`
  - [ ] Add "Video Editor" navigation link
  - [ ] Add "Projects" navigation link
  - [ ] Maintain consistent styling

---

### Phase 5: Integration & Features

#### 5.1 Integration with Existing Features

- [ ] Import videos from Downloads page
  - [ ] Add "Edit Video" button to downloads page
  - [ ] Pass video URL to editor
  - [ ] Create new project from downloaded video

- [ ] Integrate with ElevenLabs dubbing
  - [ ] Import dubbed audio tracks
  - [ ] Replace audio in timeline
  - [ ] Mix dubbed audio with original

- [ ] Unified UI styling
  - [ ] Match existing Tailwind theme
  - [ ] Use existing UI components (Button, Input)
  - [ ] Consistent color scheme

#### 5.2 Basic Editing Features

- [ ] Trim/Cut functionality
  - [ ] Select clip segment
  - [ ] Trim start/end points
  - [ ] Split clip at playhead

- [ ] Simple transitions
  - [ ] Fade in/out
  - [ ] Cross-dissolve
  - [ ] Transition duration control

- [ ] Audio management
  - [ ] Adjust volume
  - [ ] Mute/unmute tracks
  - [ ] Audio waveform display

- [ ] Text overlays
  - [ ] Add text at specific time
  - [ ] Edit text content
  - [ ] Style customization
  - [ ] Fade in/out animations

---

### Phase 6: Advanced Features (Optional/Future)

- [ ] Multiple video layers
- [ ] Keyframe animations
- [ ] Color grading tools
- [ ] Advanced transitions library
- [ ] Video templates/presets
- [ ] Batch processing
- [ ] Chroma key (green screen)
- [ ] Speed control (slow-mo, time-lapse)
- [ ] Audio effects (noise reduction, EQ)
- [ ] Subtitles/captions support

---

### Phase 7: Performance & Optimization

- [ ] Implement caching
  - [ ] Cache thumbnails (leverage existing cache system)
  - [ ] Cache processed video chunks
  - [ ] Cache project metadata

- [ ] Background job queue
  - [ ] Install Bull/BullMQ for job processing
  - [ ] Queue render jobs
  - [ ] Progress tracking via WebSockets/SSE

- [ ] File cleanup
  - [ ] Automatic temp file deletion
  - [ ] Scheduled cleanup jobs
  - [ ] Storage limit management

- [ ] Performance optimization
  - [ ] Lazy load components
  - [ ] Optimize timeline rendering
  - [ ] Debounce timeline updates
  - [ ] Web Workers for heavy client operations

---

### Phase 8: Testing & Documentation

- [ ] Unit tests
  - [ ] Editor service tests
  - [ ] FFmpeg service tests
  - [ ] Validator tests
  - [ ] Mapper tests

- [ ] Integration tests
  - [ ] API route tests
  - [ ] End-to-end editing workflow

- [ ] Documentation
  - [ ] API documentation
  - [ ] Component documentation
  - [ ] User guide for editor features
  - [ ] FFmpeg installation guide

- [ ] Error handling review
  - [ ] Comprehensive error messages
  - [ ] User-friendly error UI
  - [ ] Logging for debugging

---

### Phase 9: Security & Best Practices

- [ ] Security measures
  - [ ] File type validation (whitelist video formats)
  - [ ] File size limits (e.g., 500MB max)
  - [ ] Sanitize file names
  - [ ] Rate limiting on API routes
  - [ ] CORS configuration for uploads
  - [ ] Prevent path traversal attacks

- [ ] Best practices
  - [ ] Follow existing code patterns
  - [ ] Consistent error handling
  - [ ] Proper TypeScript typing
  - [ ] Code comments where needed
  - [ ] ESLint compliance

---

## Progress Tracking

**Current Phase**: Phase 0 - Setup & Infrastructure
**Status**: Not Started
**Last Updated**: 2025-12-05

---

## Notes & Decisions

- Using hybrid approach (client + server) for best performance
- Following existing service layer pattern for consistency
- FFmpeg for server-side processing (powerful, flexible)
- @ffmpeg/ffmpeg (WebAssembly) for client-side preview
- In-memory storage for Phase 1, plan for DB integration later
- Integrate seamlessly with existing downloads and dubbing features

---

## Dependencies

### Required Packages
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.3",
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1",
    "fabric": "^6.0.2",
    "wavesurfer.js": "^7.7.0",
    "react-player": "^2.16.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.26"
  }
}
```

### System Requirements
- FFmpeg installed on the server/system
- Node.js 18+ (already satisfied)
- Sufficient disk space for temp video files

---

## References

- [Remotion Documentation](https://www.remotion.dev/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [fluent-ffmpeg GitHub](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [Fabric.js Documentation](http://fabricjs.com/)
- Existing project patterns: `src/services/dubbing/`, `src/services/youtube/`
