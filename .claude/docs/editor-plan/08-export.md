# Phase 8: Export Pipeline

## Goal
Render final video with all effects.

## Backend

### Types
```ts
ExportJob {
  id, projectId, status: 'queued'|'processing'|'done'|'error',
  progress: number, // 0-100
  settings: ExportSettings,
  outputPath?: string,
  error?: string
}

ExportSettings {
  format: 'mp4'|'webm'|'mov',
  resolution: '1080p'|'720p'|'480p'|'original',
  fps: 24|30|60|'original',
  quality: 'low'|'medium'|'high'|'ultra',
  codec?: string
}
```

### Services
- `ExportService.start(projectId, settings)` - Queue job
- `ExportService.getStatus(jobId)` - Poll progress
- `ExportService.cancel(jobId)` - Abort
- `RenderEngine.buildFilterGraph()` - Construct FFmpeg command
- `RenderEngine.execute()` - Run FFmpeg

### API Routes
- `POST /api/editor/project/[id]/export` - Start
- `GET /api/editor/export/[jobId]` - Status
- `GET /api/editor/export/[jobId]/download` - Get file
- `DELETE /api/editor/export/[jobId]` - Cancel

## Filter Graph Assembly

Order of operations:
1. Input files
2. Trim/cut clips
3. Apply effects per clip
4. Apply transforms
5. Add text overlays
6. Apply transitions
7. Mix audio tracks
8. Output encoding

```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "
    [0:v]trim=0:5,setpts=PTS-STARTPTS,eq=brightness=0.1[v0];
    [1:v]trim=0:5,setpts=PTS-STARTPTS[v1];
    [v0][v1]xfade=transition=fade:duration=0.5:offset=4.5[vout];
    [0:a][1:a]acrossfade=d=0.5[aout]
  " \
  -map "[vout]" -map "[aout]" output.mp4
```

## Frontend

### Components
Existing `ExportDialog` - extend with:
- More format options
- Codec selection (advanced)
- Bitrate control
- Preview estimated file size

### Progress Tracking
- Poll every 2s
- Show current frame / total
- ETA calculation
- Cancel button

## Queue System
For multiple exports:
- Bull/BullMQ for job queue (optional)
- Or simple in-memory queue
- One render at a time per server
