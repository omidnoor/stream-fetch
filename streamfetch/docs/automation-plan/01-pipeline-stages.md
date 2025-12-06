# Pipeline Stages - Detailed Breakdown

## Stage 1: URL Input & Configuration

### User Actions
- Paste YouTube URL
- Configure pipeline settings:
  - Chunk duration (30s, 1min, 2min, 5min, custom)
  - Target language(s)
  - Quality settings
  - Output format preferences

### System Actions
- Validate YouTube URL format
- Fetch video metadata (title, duration, thumbnail)
- Calculate estimated chunks based on duration
- Estimate total cost (ElevenLabs pricing)
- Show time estimate

### Outputs
- Validated video info
- Configuration object
- Cost/time estimates

---

## Stage 2: Video Download

### System Actions
- Download video using existing YouTube service
- Store in temporary directory (`/temp/automation/{jobId}/source/`)
- Extract audio track separately (for dubbing reference)
- Generate video fingerprint for tracking

### Progress Indicators
- Download percentage (0-100%)
- Download speed (MB/s)
- ETA (estimated time remaining)

### Outputs
- Source video file
- Extracted audio file
- Video metadata (duration, resolution, codec)

---

## Stage 3: Video Chunking

### System Actions
- Use FFmpeg to split video into segments
- Maintain audio-video sync points
- Create manifest file tracking all chunks
- Generate thumbnails for each chunk (optional)

### Chunk Structure
```
/temp/automation/{jobId}/chunks/
├── manifest.json
├── chunk_001.mp4
├── chunk_002.mp4
├── chunk_003.mp4
│   ...
└── chunk_015.mp4
```

### Manifest Format
```json
{
  "jobId": "uuid",
  "totalChunks": 15,
  "chunkDuration": 60,
  "chunks": [
    {
      "index": 1,
      "filename": "chunk_001.mp4",
      "startTime": 0,
      "endTime": 60,
      "duration": 60
    }
  ]
}
```

### Chunking Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Fixed Duration** | Split at exact intervals | Simple, predictable |
| **Scene Detection** | Split at scene changes | Better quality cuts |
| **Silence Detection** | Split at audio pauses | Natural break points |

### FFmpeg Commands

**Fixed Duration Split:**
```bash
ffmpeg -i source.mp4 -c copy -map 0 \
  -segment_time 60 -f segment \
  -reset_timestamps 1 \
  chunk_%03d.mp4
```

**With Re-encoding (for precise cuts):**
```bash
ffmpeg -i source.mp4 -c:v libx264 -c:a aac \
  -segment_time 60 -f segment \
  -reset_timestamps 1 \
  chunk_%03d.mp4
```

---

## Stage 4: Parallel Dubbing

### System Actions
1. Queue all chunks for dubbing
2. Send chunks to ElevenLabs in parallel (with rate limiting)
3. Track individual chunk status
4. Handle retries for failed chunks
5. Store dubbed audio for each chunk

### Concurrency Management

| Setting | Default | Description |
|---------|---------|-------------|
| `maxParallelJobs` | 3 | Maximum concurrent dubbing jobs |
| `retryAttempts` | 3 | Retries per failed chunk |
| `retryDelay` | 5000ms | Initial delay between retries |
| `backoffMultiplier` | 2 | Exponential backoff factor |

### Chunk Status Flow
```
pending → uploading → processing → complete
                  ↘ failed → retry → processing
                            ↘ exhausted (after 3 retries)
```

### Output Structure
```
/temp/automation/{jobId}/dubbed/
├── chunk_001_dubbed.mp3
├── chunk_002_dubbed.mp3
│   ...
└── chunk_015_dubbed.mp3
```

---

## Stage 5: Chunk Collection & Merging

### System Actions
1. Wait for all chunks to complete
2. Validate dubbed audio integrity
3. Merge dubbed audio with original video (per chunk)
4. Concatenate all chunks in order
5. Apply crossfade transitions (optional)

### Merge Process

**Step 1: Replace audio per chunk**
```bash
ffmpeg -i chunk_001.mp4 -i chunk_001_dubbed.mp3 \
  -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 \
  chunk_001_final.mp4
```

**Step 2: Create concat list**
```
file 'chunk_001_final.mp4'
file 'chunk_002_final.mp4'
file 'chunk_003_final.mp4'
...
```

**Step 3: Concatenate**
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt \
  -c copy final_output.mp4
```

### Output Structure
```
/temp/automation/{jobId}/output/
├── final_dubbed_video.mp4
└── thumbnail.jpg
```

---

## Stage 6: Output & Cleanup

### System Actions
- Generate final video file
- Create preview thumbnail
- Update job status to complete
- Schedule cleanup of temporary files

### Cleanup Policy

| File Type | Retention | Reason |
|-----------|-----------|--------|
| Source video | Delete after merge | Large, no longer needed |
| Chunk files | Delete after merge | Intermediate files |
| Dubbed audio | Delete after merge | Intermediate files |
| Final output | 24 hours | User download window |
| Job metadata | 7 days | History/debugging |

### User Options
- Download final video
- Preview in browser
- Open containing folder
- Start new pipeline
