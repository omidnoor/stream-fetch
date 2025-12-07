# Implementation Phases

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| Phase 0 | Foundation & Setup | None |
| Phase 1 | Download & Chunking | Phase 0 |
| Phase 2 | Parallel Dubbing | Phase 1 |
| Phase 3 | Merging & Output | Phase 2 |
| Phase 4 | UI Components | Phase 0 |
| Phase 5 | Real-Time Progress | Phase 1-4 |
| Phase 6 | Polish & Edge Cases | Phase 1-5 |

---

## Phase 0: Foundation & Setup ✅ COMPLETED

### Tasks

- [x] Create folder structure
  - [x] `src/app/(pages)/automation/`
  - [x] `src/app/api/automation/`
  - [x] `src/components/automation/`
  - [x] `src/services/automation/`
  - [x] `src/lib/automation/`

- [x] Define TypeScript interfaces
  - [x] `automation.types.ts` - All data models
  - [x] Export types from index

- [x] Set up job persistence
  - [x] `job-store.ts` - CRUD operations
  - [x] File-based storage in temp directory
  - [x] Job serialization/deserialization

- [x] Create progress event system
  - [x] `progress-emitter.ts` - Event emitter singleton
  - [x] Subscribe/unsubscribe methods
  - [x] Event types (progress, log, complete, error)

- [x] Temporary file manager
  - [x] `temp-manager.ts` - Create/cleanup directories
  - [x] Job-specific folder creation
  - [x] Cleanup scheduler

- [x] Cost calculator utility
  - [x] `cost-calculator.ts` - ElevenLabs pricing
  - [x] Time estimation logic

### Deliverables ✅
- ✅ Type definitions complete
- ✅ Job store functional
- ✅ Progress emitter working
- ✅ Temp file management ready

---

## Phase 1: Download & Chunking ✅ COMPLETED

### Tasks

- [x] Integrate YouTube download
  - [x] Reuse existing `YouTubeService`
  - [x] Add progress callback support
  - [x] Save to job's source directory

- [x] Implement chunk service
  - [x] `chunk.service.ts` - FFmpeg integration
  - [x] Fixed duration splitting
  - [x] Manifest file generation
  - [x] Chunk validation

- [x] Create automation service skeleton
  - [x] `automation.service.ts` - Main orchestrator
  - [x] `automation.factory.ts` - Singleton pattern
  - [x] Pipeline stages: download, chunk (stubs for rest)

- [x] API endpoint: Start pipeline
  - [x] `POST /api/automation/start`
  - [x] Validate input
  - [x] Create job record
  - [x] Trigger async pipeline

- [x] API endpoint: Get status
  - [x] `GET /api/automation/status/[jobId]`
  - [x] Return current job state

### FFmpeg Commands to Implement

```typescript
// Fixed duration chunking
async splitVideoFixed(input: string, outputDir: string, duration: number) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        '-c copy',
        '-map 0',
        `-segment_time ${duration}`,
        '-f segment',
        '-reset_timestamps 1'
      ])
      .output(`${outputDir}/chunk_%03d.mp4`)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}
```

### Deliverables ✅
- ✅ Download stage working
- ✅ Chunking stage working
- ✅ Basic API endpoints functional
- ✅ Jobs created and tracked

---

## Phase 2: Parallel Dubbing ✅ COMPLETED

### Tasks

- [x] Implement parallel dubbing service
  - [x] `parallel-dubbing.service.ts`
  - [x] Job queue with concurrency limit
  - [x] Per-chunk status tracking

- [x] ElevenLabs integration
  - [x] Reuse existing dubbing service
  - [x] Adapt for chunk-based processing
  - [x] Handle job creation per chunk

- [x] Retry logic
  - [x] Exponential backoff
  - [x] Max retry attempts (3)
  - [x] Error categorization

- [x] Rate limiting
  - [x] Track API calls
  - [x] Respect ElevenLabs limits
  - [x] Queue management

- [x] Progress tracking
  - [x] Individual chunk status updates
  - [x] Aggregate progress calculation
  - [x] Emit progress events

### Queue Implementation

```typescript
class ParallelDubbingService {
  private queue: ChunkInfo[] = [];
  private active: Map<number, Promise<void>> = new Map();
  private maxConcurrent: number;

  async processNext() {
    while (this.active.size < this.maxConcurrent && this.queue.length > 0) {
      const chunk = this.queue.shift()!;
      const promise = this.processChunk(chunk);
      this.active.set(chunk.index, promise);

      promise.finally(() => {
        this.active.delete(chunk.index);
        this.processNext();
      });
    }
  }

  private async processChunk(chunk: ChunkInfo) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        await this.dubChunk(chunk);
        return;
      } catch (error) {
        attempts++;
        if (attempts < 3) {
          await this.delay(5000 * Math.pow(2, attempts));
        }
      }
    }
    throw new Error(`Chunk ${chunk.index} failed after 3 attempts`);
  }
}
```

### Deliverables ✅
- ✅ Parallel dubbing functional
- ✅ Retry logic working
- ✅ Progress updates emitting
- ✅ All chunks processed

---

## Phase 3: Merging & Output ✅ COMPLETED

### Tasks

- [x] Implement merge service
  - [x] `merge.service.ts`
  - [x] Audio replacement per chunk
  - [x] Video concatenation

- [x] Audio replacement
  - [x] FFmpeg command for replacing audio
  - [x] Preserve video quality
  - [x] Handle sync issues

- [x] Concatenation
  - [x] Generate concat list file
  - [x] FFmpeg concat demuxer
  - [ ] Crossfade option (optional - not implemented)

- [x] Finalization
  - [x] Generate output file
  - [x] Create thumbnail capability
  - [x] Update job status

- [x] Cleanup
  - [x] Remove intermediate files
  - [x] Schedule output cleanup (24h)
  - [x] Handle cleanup on failure

### FFmpeg Commands

```typescript
// Replace audio
async replaceAudio(video: string, audio: string, output: string) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(video)
      .input(audio)
      .outputOptions([
        '-c:v copy',
        '-c:a aac',
        '-map 0:v:0',
        '-map 1:a:0'
      ])
      .output(output)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Concatenate videos
async concatenate(listFile: string, output: string) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(output)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}
```

### Deliverables ✅
- ✅ Audio replacement working
- ✅ Concatenation working
- ✅ Final output generated
- ✅ Cleanup functional

---

## Phase 4: UI Components 🚧 IN PROGRESS

### Tasks

- [x] Create base page layout
  - [x] `automation/page.tsx` - Main page
  - [x] `automation/[jobId]/page.tsx` - Progress page
  - [ ] `automation/history/page.tsx` - History page

- [x] URL input component (integrated in main page)
  - [x] Validation feedback
  - [x] Loading state during analysis

- [x] Configuration panel (integrated in main page)
  - [x] Chunk duration selector
  - [x] Language dropdown
  - [x] Advanced options toggle

- [ ] Estimate display
  - [ ] `estimate-card.tsx`
  - [ ] Chunks count
  - [ ] Time estimate
  - [ ] Cost estimate

- [x] Progress components (integrated in progress page)
  - [x] Overall progress bar
  - [x] Stage indicators
  - [ ] `chunk-grid.tsx` - Visual chunk matrix

- [x] Log viewer (integrated in progress page)
  - [x] Real-time log display
  - [x] Auto-scroll
  - [x] Level filtering (color-coded)
  - [x] Scrollable container

- [ ] Result components
  - [ ] `completion-card.tsx` - Success state
  - [ ] `error-card.tsx` - Failure state

- [ ] History list
  - [ ] `job-history-list.tsx`
  - [ ] Status badges
  - [ ] Action buttons

### Deliverables 🚧
- ✅ Main pages navigable
- ✅ Basic components styled
- ✅ Forms functional
- ✅ Progress display working
- ⏳ Advanced components pending

---

## Phase 5: Real-Time Progress ✅ COMPLETED

### Tasks

- [x] SSE endpoint
  - [x] `GET /api/automation/stream/[jobId]`
  - [x] Event formatting
  - [x] Connection management

- [x] Client hook (integrated in progress page)
  - [x] EventSource management
  - [x] State updates
  - [x] Heartbeat handling

- [x] Progress calculation
  - [x] Overall percentage formula
  - [x] Time remaining estimate (in progress emitter)
  - [x] Stage weights

- [x] Connect UI to real-time data
  - [x] Progress page uses SSE
  - [x] Live log updates
  - [ ] Chunk grid updates (pending chunk grid component)

- [ ] Fallback polling
  - [ ] For browsers without SSE
  - [ ] Automatic detection
  - [ ] Same data format

### Progress Calculation

```typescript
function calculateOverallProgress(progress: PipelineProgress): number {
  const weights = {
    download: 15,
    chunk: 5,
    dub: 70,
    merge: 8,
    finalize: 2
  };

  let completed = 0;

  if (progress.download?.percent === 100) completed += weights.download;
  else if (progress.download) completed += (progress.download.percent / 100) * weights.download;

  if (progress.chunking?.processed === progress.chunking?.totalChunks) completed += weights.chunk;
  else if (progress.chunking) completed += (progress.chunking.processed / progress.chunking.totalChunks) * weights.chunk;

  if (progress.dubbing) {
    const dubPercent = progress.dubbing.completed / progress.dubbing.chunks.length;
    completed += dubPercent * weights.dub;
  }

  // ... etc

  return Math.round(completed);
}
```

### Deliverables ✅
- ✅ SSE endpoint working
- ✅ Real-time updates in UI
- ✅ Progress accurate
- ✅ Logs streaming

---

## Phase 6: Polish & Edge Cases

### Tasks

- [ ] Cancel functionality
  - [ ] `POST /api/automation/cancel/[jobId]`
  - [ ] Abort active operations
  - [ ] Cleanup partial files

- [ ] Retry failed chunks
  - [ ] `POST /api/automation/retry/[jobId]`
  - [ ] Resume from failure point
  - [ ] Preserve successful chunks

- [ ] Download endpoint
  - [ ] `GET /api/automation/download/[jobId]`
  - [ ] Stream large files
  - [ ] Proper headers

- [ ] History management
  - [ ] `GET /api/automation/jobs`
  - [ ] `DELETE /api/automation/jobs/[jobId]`
  - [ ] Pagination

- [ ] Error handling
  - [ ] User-friendly messages
  - [ ] Recovery suggestions
  - [ ] Detailed logs

- [ ] Edge cases
  - [ ] Very long videos (>1hr)
  - [ ] Very short videos (<1min)
  - [ ] Network failures
  - [ ] Disk space issues

- [ ] Testing
  - [ ] Unit tests for services
  - [ ] Integration tests for API
  - [ ] E2E test for full pipeline

- [ ] Documentation
  - [ ] Update main README
  - [ ] API documentation
  - [ ] User guide

### Deliverables
- Cancel working
- Retry working
- History complete
- All edge cases handled
- Tests passing

---

## Task Checklist Summary

### Phase 0: Foundation ✅ COMPLETED
- [x] Folder structure
- [x] Type definitions
- [x] Job store
- [x] Progress emitter
- [x] Temp manager
- [x] Cost calculator

### Phase 1: Download & Chunking ✅ COMPLETED
- [x] YouTube download integration
- [x] Chunk service
- [x] Automation service skeleton
- [x] Start API endpoint
- [x] Status API endpoint

### Phase 2: Parallel Dubbing ✅ COMPLETED
- [x] Parallel dubbing service
- [x] ElevenLabs integration
- [x] Retry logic
- [x] Rate limiting
- [x] Progress tracking

### Phase 3: Merging & Output ✅ COMPLETED
- [x] Merge service
- [x] Audio replacement
- [x] Concatenation
- [x] Finalization
- [x] Cleanup

### Phase 4: UI Components 🚧 PARTIAL
- [x] Page layouts
- [x] URL input
- [x] Config panel
- [ ] Estimate card
- [x] Progress components (basic)
- [x] Log viewer
- [ ] Result components
- [ ] History list

### Phase 5: Real-Time Progress ✅ COMPLETED
- [x] SSE endpoint
- [x] Client hook
- [x] Progress calculation
- [x] UI integration
- [ ] Fallback polling

### Phase 6: Polish ⏳ PENDING
- [ ] Cancel functionality
- [ ] Retry functionality
- [ ] Download endpoint
- [ ] History management
- [ ] Error handling
- [ ] Edge cases
- [ ] Testing
- [ ] Documentation
