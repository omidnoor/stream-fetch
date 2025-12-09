# Known Issues & Challenges

## Technical Challenges

### Browser Video Limitations
- **Codec support varies** - MP4/H.264 universal, WebM/VP9 partial
- **Seeking accuracy** - Keyframe-based, not frame-accurate
- **Memory limits** - Large videos can crash tab
- **Solution**: Proxy editing (lower res preview, full res export)

### FFmpeg Complexity
- **Filter graph syntax** - Complex for multiple inputs
- **Error messages** - Often cryptic
- **Solution**: Build filter graph programmatically, validate before run

### Real-time Preview
- **Can't apply FFmpeg filters live** - Too slow
- **Solution**: CSS filters for preview, FFmpeg only on export
- **Mismatch risk**: CSS vs FFmpeg output may differ slightly

### Timeline Sync
- **Audio/video drift** - Accumulates with edits
- **Solution**: Use PTS (presentation timestamps), recalculate on export

### Concurrent Editing
- **No real-time collab** - Single user per project
- **Conflict risk**: Multiple tabs open
- **Solution**: Lock project or last-write-wins with warning

## UX Challenges

### Performance Perception
- Export is slow (minutes for long videos)
- **Solution**: Progress bar, background processing, notifications

### Precision
- Frame-accurate editing hard in browser
- **Solution**: Frame step buttons, timecode input, snap to keyframes

### Mobile
- Timeline UI doesn't work well on touch
- **Solution**: Responsive design, simplified mobile view (or desktop-only)

## Infrastructure Challenges

### Storage
- Videos are large (GB scale)
- **Solution**: Clean up policy, user quotas, external storage (S3)

### CPU Load
- FFmpeg is CPU-intensive
- **Solution**: Queue system, rate limiting, dedicated render workers

### Scaling
- One render blocks server
- **Solution**: Separate render service, job queue

## Edge Cases

### Empty States
- No clips on timeline
- No media uploaded
- Export with no changes

### Invalid Operations
- Transition longer than clip
- Overlapping clips
- Circular dependencies

### Recovery
- Browser crash mid-edit (auto-save helps)
- Export fails mid-render
- Corrupt upload file

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| MP4 playback | ✓ | ✓ | ✓ | ✓ |
| WebM playback | ✓ | ✓ | ✗ | ✓ |
| CSS filters | ✓ | ✓ | ✓ | ✓ |
| File System API | ✓ | ✗ | ✗ | ✓ |
| Web Workers | ✓ | ✓ | ✓ | ✓ |
