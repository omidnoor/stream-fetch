# Optimization Strategies

## Frontend Performance

### Timeline
- Virtualize long timelines (only render visible clips)
- Debounce zoom/scroll updates
- Use `requestAnimationFrame` for playhead
- Memoize clip components

### Video Playback
- Preload adjacent clips
- Use `video.fastSeek()` when available
- Lower preview resolution during scrub
- Cache decoded frames (limited)

### Waveforms
- Generate at lower resolution
- Progressive loading (coarse → fine)
- Canvas rendering, not SVG

### State Management
- Immer for immutable updates
- Selective re-renders with selectors
- Local state for drag operations

## Backend Performance

### FFmpeg
- Use hardware acceleration when available (`-hwaccel auto`)
- Preset selection (`-preset fast` vs `ultrafast`)
- Two-pass encoding for quality (optional)
- Segment-based parallel encoding (advanced)

### File I/O
- Stream uploads, don't buffer
- Use temp files for intermediate renders
- Clean up aggressively

### Database
- Index on `projectId`, `userId`
- Pagination for project lists
- Selective field projection

## Memory Management

### Limits
- Max clips per project: 100
- Max project duration: 1 hour
- Max upload size: 500MB
- Max concurrent renders: 1

### Cleanup
- Delete temp files after export
- Prune old exports (24h)
- Garbage collect orphaned media

## Caching

### Client
- SWR/React Query for API data
- IndexedDB for offline project draft
- Service worker for static assets

### Server
- Redis for render job status (optional)
- File-based cache for thumbnails
- ETag for media files
