# Phase 6: Audio System

## Goal
Audio tracks, volume, waveforms.

## Backend

### Types
```ts
AudioTrack extends TimelineTrack { type: 'audio' }
AudioClip extends TimelineClip {
  volume: number, // 0-2 (0=mute, 1=normal, 2=boost)
  fadeIn?: number,
  fadeOut?: number,
  muted: boolean
}
```

### Services
- `AudioService.extractWaveform(file)` - Generate peaks
- `AudioService.setVolume(clipId, volume)`
- `AudioService.setFade(clipId, fadeIn, fadeOut)`
- FFmpeg audio filter builder

### API Routes
- `GET /api/editor/project/[id]/waveform/[clipId]`
- `PUT /api/editor/project/[id]/audio/[clipId]`

## Frontend

### Components
| Component | Purpose |
|-----------|---------|
| `AudioTrack` | Audio timeline row |
| `Waveform` | Visual waveform display |
| `VolumeSlider` | Per-clip volume |
| `AudioMixer` | Master/track levels |

### Features
- Waveform visualization
- Volume keyframes (later phase)
- Fade handles on clip edges
- Mute/solo per track
- Master volume

### Hooks
- `useAudio(clipId)` - Audio state
- `useWaveform(clipId)` - Waveform data

## Waveform Generation
```bash
# FFmpeg to extract peaks
ffmpeg -i input.mp4 -af "aresample=8000,asetnsamples=n=1000" -f data -
```

Alternative: Use Web Audio API client-side for preview.

## FFmpeg Audio Filters
```bash
# Volume
volume=1.5

# Fade
afade=t=in:d=0.5,afade=t=out:st=9.5:d=0.5

# Mix tracks
amix=inputs=2:duration=longest
```
