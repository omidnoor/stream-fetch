# Error Handling & Recovery

## Error Categories

### 1. Input Errors (User-Fixable)

| Error | Cause | User Action |
|-------|-------|-------------|
| Invalid URL | Malformed YouTube URL | Fix URL format |
| Video Unavailable | Private/deleted video | Try different video |
| Age Restricted | Requires login | Use different video |
| Region Locked | Geographic restriction | Use VPN or different video |

**Response:** Show clear message, don't start pipeline.

### 2. Download Errors (Retryable)

| Error | Cause | Action |
|-------|-------|--------|
| Network Timeout | Slow/unstable connection | Auto-retry 3x |
| Rate Limited | Too many requests | Wait and retry |
| Partial Download | Connection dropped | Resume download |
| Format Unavailable | Quality not available | Fall back to lower quality |

**Response:** Auto-retry with exponential backoff.

### 3. Processing Errors (Recoverable)

| Error | Cause | Action |
|-------|-------|--------|
| FFmpeg Failure | Codec/format issue | Log details, try re-encode |
| Disk Full | Out of space | Alert user, pause pipeline |
| Memory Exceeded | Video too large | Reduce chunk size |
| Chunk Corruption | Bad write | Re-chunk affected segment |

**Response:** Pause pipeline, allow user intervention.

### 4. Dubbing Errors (Per-Chunk)

| Error | Cause | Action |
|-------|-------|--------|
| API Timeout | ElevenLabs slow | Retry chunk |
| Rate Limited | API quota | Wait, then retry |
| Invalid Audio | Corrupt chunk | Re-process chunk |
| Job Failed | API error | Retry up to 3x |

**Response:** Track per-chunk, retry individually.

### 5. Fatal Errors (Non-Recoverable)

| Error | Cause | Action |
|-------|-------|--------|
| API Key Invalid | Bad credentials | User must fix settings |
| Insufficient Credits | No ElevenLabs balance | User must add credits |
| Service Unavailable | API down | Notify, suggest retry later |

**Response:** Stop pipeline, clear error message.

---

## Retry Strategy

### Exponential Backoff

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 5000,      // 5 seconds
  maxDelay: 60000,         // 1 minute
  backoffMultiplier: 2,
};

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < config.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw lastError!;
}
```

### Retry Timeline Example

```
Attempt 1: Immediate
  ↓ (fail)
Wait 5 seconds
  ↓
Attempt 2
  ↓ (fail)
Wait 10 seconds
  ↓
Attempt 3
  ↓ (fail)
Mark as failed
```

---

## Per-Chunk Error Handling

### Chunk State Machine

```
┌─────────┐
│ pending │
└────┬────┘
     │ start
     ▼
┌──────────┐     ┌─────────┐
│ uploading│────►│processing│
└────┬─────┘     └────┬────┘
     │ error          │ error
     ▼                ▼
┌─────────────────────────┐
│        retrying         │
│  (attempt < 3)          │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐   ┌────────┐
│ complete│   │ failed │
└─────────┘   │(max try)│
              └────────┘
```

### Chunk Error Record

```typescript
interface ChunkError {
  chunkIndex: number;
  attempts: ErrorAttempt[];
  finalStatus: 'recovered' | 'failed';
}

interface ErrorAttempt {
  attemptNumber: number;
  timestamp: Date;
  errorCode: string;
  errorMessage: string;
  retryScheduled: boolean;
}
```

---

## Recovery Options

### Option 1: Retry Failed Chunks Only

User clicks "Retry Failed" after partial failure.

```typescript
async function retryFailedChunks(jobId: string) {
  const job = await jobStore.get(jobId);

  const failedChunks = job.progress.dubbing.chunks
    .filter(c => c.status === 'failed')
    .map(c => c.index);

  // Reset failed chunks to pending
  for (const index of failedChunks) {
    job.progress.dubbing.chunks[index].status = 'pending';
    job.progress.dubbing.chunks[index].retryCount = 0;
  }

  // Resume dubbing stage
  await automationService.resumeDubbing(job);
}
```

### Option 2: Download Partial Results

If some chunks completed, let user download what's available.

```typescript
async function downloadPartialResults(jobId: string) {
  const job = await jobStore.get(jobId);

  const completedChunks = job.progress.dubbing.chunks
    .filter(c => c.status === 'complete')
    .sort((a, b) => a.index - b.index);

  if (completedChunks.length === 0) {
    throw new Error('No completed chunks available');
  }

  // Merge only completed consecutive chunks
  const consecutiveChunks = getConsecutiveChunks(completedChunks);

  return mergeService.concatenate(
    consecutiveChunks.map(c => c.outputPath),
    `${job.paths.output}/partial_output.mp4`
  );
}
```

### Option 3: Resume from Stage

If pipeline fails mid-stage, resume from last completed stage.

```typescript
async function resumePipeline(jobId: string) {
  const job = await jobStore.get(jobId);

  switch (job.progress.stage) {
    case 'download':
      await automationService.downloadVideo(job);
      // Fall through to next stages
    case 'chunk':
      await automationService.chunkVideo(job);
    case 'dub':
      await automationService.dubChunks(job);
    case 'merge':
      await automationService.mergeChunks(job);
    case 'finalize':
      await automationService.finalize(job);
  }
}
```

---

## User-Facing Error Messages

### Message Guidelines

| Principle | Example |
|-----------|---------|
| **Clear** | "Video download failed" not "Error code 503" |
| **Actionable** | "Try again in a few minutes" not "Service unavailable" |
| **Honest** | "3 chunks failed after retrying" not "Processing error" |
| **Helpful** | Offer retry/partial download options |

### Error Message Templates

```typescript
const ERROR_MESSAGES: Record<string, ErrorTemplate> = {
  DOWNLOAD_FAILED: {
    title: 'Download Failed',
    message: 'Could not download the video from YouTube.',
    suggestion: 'Check your internet connection and try again.',
    actions: ['retry', 'cancel'],
  },

  DUBBING_PARTIAL_FAILURE: {
    title: 'Some Chunks Failed',
    message: '{failedCount} of {totalCount} chunks failed after multiple retries.',
    suggestion: 'You can retry the failed chunks or download partial results.',
    actions: ['retry_failed', 'download_partial', 'cancel'],
  },

  API_RATE_LIMITED: {
    title: 'Rate Limited',
    message: 'ElevenLabs API rate limit reached.',
    suggestion: 'The pipeline will automatically resume in {waitTime}.',
    actions: ['wait', 'cancel'],
  },

  INSUFFICIENT_CREDITS: {
    title: 'Insufficient Credits',
    message: 'Your ElevenLabs account does not have enough credits.',
    suggestion: 'Add credits to your account and retry.',
    actions: ['cancel'],
  },
};
```

---

## Logging Strategy

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `debug` | Development details | "Chunk buffer size: 1024KB" |
| `info` | Normal operations | "Starting chunk 5 of 16" |
| `warn` | Recoverable issues | "Retry attempt 2 for chunk 5" |
| `error` | Failures | "Chunk 5 failed: API timeout" |

### Log Entry Structure

```typescript
interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  stage: PipelineStage;
  message: string;
  metadata?: {
    chunkIndex?: number;
    attempt?: number;
    errorCode?: string;
    duration?: number;
  };
}
```

### Log Examples

```
12:34:56 INFO  [download] Starting video download
12:35:23 INFO  [download] Download complete (450 MB in 27s)
12:35:24 INFO  [chunk]    Splitting video into 16 chunks
12:35:45 INFO  [chunk]    Chunking complete
12:35:46 INFO  [dub]      Starting parallel dubbing (3 concurrent)
12:36:12 INFO  [dub]      Chunk 1 complete
12:36:18 WARN  [dub]      Chunk 2 failed, scheduling retry (attempt 1/3)
12:36:25 INFO  [dub]      Chunk 2 retry successful
12:38:45 INFO  [dub]      All 16 chunks dubbed
12:38:46 INFO  [merge]    Starting audio replacement
12:40:12 INFO  [merge]    Concatenating final video
12:40:34 INFO  [finalize] Pipeline complete
```

---

## Monitoring & Alerts

### Health Checks

```typescript
interface PipelineHealth {
  activeJobs: number;
  failedLast24h: number;
  avgCompletionTime: number;
  elevenLabsStatus: 'healthy' | 'degraded' | 'down';
}

async function getHealth(): Promise<PipelineHealth> {
  const jobs = await jobStore.list();
  const last24h = jobs.filter(j =>
    j.createdAt > Date.now() - 24 * 60 * 60 * 1000
  );

  return {
    activeJobs: jobs.filter(j => j.status === 'dubbing').length,
    failedLast24h: last24h.filter(j => j.status === 'failed').length,
    avgCompletionTime: calculateAvgTime(last24h),
    elevenLabsStatus: await checkElevenLabsHealth(),
  };
}
```

### Alert Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| High failure rate | >20% in 1 hour | Log warning |
| API repeatedly failing | 5 consecutive | Pause new jobs |
| Disk space low | <1GB free | Alert user |
| Job stuck | No progress 10min | Mark as failed |
