# Cost Optimization & Future Enhancements

## Cost Considerations

### ElevenLabs Pricing Model

| Tier | Price | Notes |
|------|-------|-------|
| Free | Limited credits | Testing only |
| Starter | ~$5/month | Limited minutes |
| Creator | ~$22/month | More minutes |
| Pro | ~$99/month | High volume |

**Key Factor:** Dubbing is charged per minute of content.

### Cost Calculation

```typescript
interface CostEstimate {
  minutes: number;
  baseCost: number;
  withWatermark: number;
  currency: string;
}

function calculateCost(durationSeconds: number): CostEstimate {
  const minutes = Math.ceil(durationSeconds / 60);

  // Approximate rates (check current ElevenLabs pricing)
  const RATE_PER_MINUTE = 0.18;
  const WATERMARK_DISCOUNT = 0.5;

  return {
    minutes,
    baseCost: minutes * RATE_PER_MINUTE,
    withWatermark: minutes * RATE_PER_MINUTE * WATERMARK_DISCOUNT,
    currency: 'USD',
  };
}
```

### Cost Display Format

```
📊 Cost Estimate
├── Video Duration:     15:32 (16 minutes)
├── Standard Dubbing:   $2.88
├── With Watermark:     $1.44 (50% off)
└── Note: Actual cost may vary based on your plan
```

---

## Cost Optimization Strategies

### 1. Watermark Option

- ElevenLabs offers reduced pricing for watermarked content
- Show option prominently with cost comparison
- Suitable for drafts/previews

### 2. Chunk Caching

- Cache successfully dubbed chunks
- If user retries or re-processes, skip completed chunks
- Reduces repeat costs

```typescript
interface ChunkCache {
  videoFingerprint: string;
  chunkIndex: number;
  targetLanguage: string;
  dubbedAudioPath: string;
  createdAt: Date;
}

async function getCachedDubbing(
  fingerprint: string,
  chunkIndex: number,
  language: string
): Promise<string | null> {
  // Check if we already dubbed this exact chunk
  const cached = await cache.get(`dub:${fingerprint}:${chunkIndex}:${language}`);
  if (cached && fs.existsSync(cached.dubbedAudioPath)) {
    return cached.dubbedAudioPath;
  }
  return null;
}
```

### 3. Smart Chunking

- Detect silence/pauses at chunk boundaries
- Avoid cutting mid-sentence
- Better quality = fewer re-dos

### 4. Preview Mode

- Dub only first 1-2 chunks as preview
- Let user verify quality before full run
- Saves cost on bad settings

```typescript
interface PreviewConfig {
  enabled: boolean;
  chunksToPreview: number;  // Default: 2
}

// Only dub first 2 chunks initially
async function runPreview(job: AutomationJob) {
  const previewChunks = job.chunks.slice(0, 2);
  await dubChunks(previewChunks);

  // Ask user to confirm
  job.status = 'preview_ready';
  await jobStore.update(job);
}
```

---

## Performance Optimizations

### 1. Parallel Processing Tuning

| Video Length | Recommended Parallelism |
|--------------|------------------------|
| < 5 min | 2 concurrent |
| 5-15 min | 3 concurrent |
| 15-30 min | 4 concurrent |
| > 30 min | 5 concurrent |

### 2. Chunk Size Trade-offs

| Chunk Size | Pros | Cons |
|------------|------|------|
| 30 sec | Fast individual dubs, quick retries | More API calls, overhead |
| 1 min | Good balance | Standard choice |
| 2 min | Fewer API calls | Longer retry time if fails |
| 5 min | Minimal overhead | Risk of timeout, long retries |

### 3. Memory Management

```typescript
// Process chunks in batches to limit memory
async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processor));

    // Force garbage collection between batches
    if (global.gc) global.gc();
  }
}
```

---

## Future Enhancements

### Tier 1: Near-Term (Next Release)

#### Multi-Language Batch
Dub to multiple languages in single pipeline run.

```typescript
interface MultiLanguageConfig {
  targetLanguages: string[];  // ['es', 'fr', 'de']
  outputPerLanguage: boolean; // Separate files per language
}
```

**UI Addition:**
```
Target Languages
☑ Spanish
☑ French
☐ German
☐ Japanese
[+ Add Language]
```

#### Subtitle Generation
Extract/generate subtitles from dubbed audio.

```typescript
interface SubtitleOptions {
  generateSubtitles: boolean;
  format: 'srt' | 'vtt' | 'both';
  burnIn: boolean;  // Embed in video
}
```

#### Custom Voice Selection
Allow different voices per chunk or speaker.

```typescript
interface VoiceMapping {
  speaker: string;
  voiceId: string;
  chunks?: number[];  // Apply to specific chunks
}
```

---

### Tier 2: Medium-Term

#### Scheduled Pipelines
Queue jobs to run at specific times.

```typescript
interface ScheduleConfig {
  runAt: Date;
  timezone: string;
  notification: 'email' | 'webhook' | 'none';
}
```

**Use Case:** Schedule long videos to process overnight.

#### Batch URL Processing
Process multiple YouTube videos in sequence.

```typescript
interface BatchJob {
  urls: string[];
  sharedConfig: PipelineConfig;
  sequential: boolean;  // One at a time vs parallel
}
```

#### Webhook Notifications
Notify external services on completion.

```typescript
interface WebhookConfig {
  url: string;
  events: ('complete' | 'failed' | 'progress')[];
  secret: string;  // For signature verification
}
```

---

### Tier 3: Long-Term

#### Cloud Storage Integration
Save directly to cloud storage.

```typescript
interface CloudStorageConfig {
  provider: 's3' | 'gcs' | 'azure' | 'dropbox';
  bucket: string;
  path: string;
  credentials: ProviderCredentials;
}
```

#### Speaker Diarization
Detect different speakers and maintain voice consistency.

```typescript
interface SpeakerConfig {
  detectSpeakers: boolean;
  voicePerSpeaker: Record<string, string>;  // speakerId -> voiceId
}
```

#### Quality Presets
Pre-configured settings for common use cases.

```typescript
const PRESETS = {
  quick_draft: {
    chunkDuration: 120,
    useWatermark: true,
    maxParallel: 5,
    videoQuality: '720p',
  },
  high_quality: {
    chunkDuration: 60,
    useWatermark: false,
    maxParallel: 3,
    videoQuality: '1080p',
  },
  long_form: {
    chunkDuration: 300,
    useWatermark: false,
    maxParallel: 2,
    videoQuality: '1080p',
  },
};
```

#### API/CLI Access
Expose pipeline as API for automation.

```bash
# CLI usage
streamfetch dub https://youtube.com/watch?v=xxx \
  --language es \
  --chunks 60 \
  --output output.mp4
```

```typescript
// API usage
const result = await fetch('/api/automation/start', {
  method: 'POST',
  body: JSON.stringify({
    youtubeUrl: 'https://...',
    config: { targetLanguage: 'es' },
    apiKey: 'user-api-key',
  }),
});
```

---

## Security Considerations

### File Security

| Concern | Mitigation |
|---------|------------|
| Temp file exposure | Store in secure temp dir with restricted permissions |
| Job ID guessing | Use UUIDs, not sequential IDs |
| Path traversal | Validate all file paths |
| Large file DoS | Enforce file size limits |

### API Security

| Concern | Mitigation |
|---------|------------|
| Rate limiting | Limit jobs per user/IP |
| Resource exhaustion | Max concurrent jobs limit |
| API key exposure | Never log or expose keys |
| CORS | Restrict to same origin |

### Data Retention

```typescript
const RETENTION_POLICY = {
  tempFiles: '24 hours',      // Auto-delete
  completedJobs: '7 days',    // Keep metadata
  failedJobs: '30 days',      // For debugging
  logs: '30 days',            // Rotate logs
};
```

---

## Metrics & Analytics

### Track for Optimization

```typescript
interface PipelineMetrics {
  // Performance
  avgDownloadTime: number;
  avgChunkingTime: number;
  avgDubbingTimePerChunk: number;
  avgMergingTime: number;
  totalPipelineTime: number;

  // Reliability
  successRate: number;
  chunkFailureRate: number;
  retryRate: number;

  // Usage
  totalJobsCompleted: number;
  totalMinutesDubbed: number;
  popularLanguages: Record<string, number>;
  avgVideoLength: number;
}
```

### Dashboard Metrics (Future)

```
📊 Pipeline Analytics (Last 7 Days)
├── Jobs Completed:     47
├── Success Rate:       94%
├── Total Minutes:      312
├── Avg Pipeline Time:  23 min
├── Popular Languages:  Spanish (45%), French (30%), German (25%)
└── Peak Usage:         Tuesday 2-4 PM
```
