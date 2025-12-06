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

## Phase 0: Foundation & Setup

### Tasks

- [ ] Create folder structure
  - [ ] `src/app/(pages)/automation/`
  - [ ] `src/app/api/automation/`
  - [ ] `src/components/automation/`
  - [ ] `src/services/automation/`
  - [ ] `src/lib/automation/`

- [ ] Define TypeScript interfaces
  - [ ] `automation.types.ts` - All data models
  - [ ] Export types from index

- [ ] Set up job persistence
  - [ ] `job-store.ts` - CRUD operations
  - [ ] File-based storage in temp directory
  - [ ] Job serialization/deserialization

- [ ] Create progress event system
  - [ ] `progress-emitter.ts` - Event emitter singleton
  - [ ] Subscribe/unsubscribe methods
  - [ ] Event types (progress, log, complete, error)

- [ ] Temporary file manager
  - [ ] `temp-manager.ts` - Create/cleanup directories
  - [ ] Job-specific folder creation
  - [ ] Cleanup scheduler

- [ ] Cost calculator utility
  - [ ] `cost-calculator.ts` - ElevenLabs pricing
  - [ ] Time estimation logic

### Deliverables
- Type definitions complete
- Job store functional
- Progress emitter working
- Temp file management ready

---

## Phase 1: Download & Chunking

### Tasks

- [ ] Integrate YouTube download
  - [ ] Reuse existing `YouTubeService`
  - [ ] Add progress callback support
  - [ ] Save to job's source directory

- [ ] Implement chunk service
  - [ ] `chunk.service.ts` - FFmpeg integration
  - [ ] Fixed duration splitting
  - [ ] Manifest file generation
  - [ ] Chunk validation

- [ ] Create automation service skeleton
  - [ ] `automation.service.ts` - Main orchestrator
  - [ ] `automation.factory.ts` - Singleton pattern
  - [ ] Pipeline stages: download, chunk (stubs for rest)

- [ ] API endpoint: Start pipeline
  - [ ] `POST /api/automation/start`
  - [ ] Validate input
  - [ ] Create job record
  - [ ] Trigger async pipeline

- [ ] API endpoint: Get status
  - [ ] `GET /api/automation/status/[jobId]`
  - [ ] Return current job state

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

### Deliverables
- Download stage working
- Chunking stage working
- Basic API endpoints functional
- Jobs created and tracked

---

## Phase 2: Parallel Dubbing

### Tasks

- [ ] Implement parallel dubbing service
  - [ ] `parallel-dubbing.service.ts`
  - [ ] Job queue with concurrency limit
  - [ ] Per-chunk status tracking

- [ ] ElevenLabs integration
  - [ ] Reuse existing dubbing service
  - [ ] Adapt for chunk-based processing
  - [ ] Handle job creation per chunk

- [ ] Retry logic
  - [ ] Exponential backoff
  - [ ] Max retry attempts (3)
  - [ ] Error categorization

- [ ] Rate limiting
  - [ ] Track API calls
  - [ ] Respect ElevenLabs limits
  - [ ] Queue management

- [ ] Progress tracking
  - [ ] Individual chunk status updates
  - [ ] Aggregate progress calculation
  - [ ] Emit progress events

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

### Deliverables
- Parallel dubbing functional
- Retry logic working
- Progress updates emitting
- All chunks processed

---

## Phase 3: Merging & Output

### Tasks

- [ ] Implement merge service
  - [ ] `merge.service.ts`
  - [ ] Audio replacement per chunk
  - [ ] Video concatenation

- [ ] Audio replacement
  - [ ] FFmpeg command for replacing audio
  - [ ] Preserve video quality
  - [ ] Handle sync issues

- [ ] Concatenation
  - [ ] Generate concat list file
  - [ ] FFmpeg concat demuxer
  - [ ] Crossfade option (optional)

- [ ] Finalization
  - [ ] Generate output file
  - [ ] Create thumbnail
  - [ ] Update job status

- [ ] Cleanup
  - [ ] Remove intermediate files
  - [ ] Schedule output cleanup (24h)
  - [ ] Handle cleanup on failure

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

### Deliverables
- Audio replacement working
- Concatenation working
- Final output generated
- Cleanup functional

---

## Phase 4: UI Components

### Tasks

- [ ] Create base page layout
  - [ ] `automation/page.tsx` - Main page
  - [ ] `automation/[jobId]/page.tsx` - Progress page
  - [ ] `automation/history/page.tsx` - History page

- [ ] URL input component
  - [ ] `url-input.tsx`
  - [ ] Validation feedback
  - [ ] Loading state during analysis

- [ ] Configuration panel
  - [ ] `config-panel.tsx`
  - [ ] Chunk duration selector
  - [ ] Language dropdown
  - [ ] Advanced options toggle

- [ ] Estimate display
  - [ ] `estimate-card.tsx`
  - [ ] Chunks count
  - [ ] Time estimate
  - [ ] Cost estimate

- [ ] Progress components
  - [ ] `pipeline-progress.tsx` - Main container
  - [ ] `stage-indicator.tsx` - Per-stage status
  - [ ] `chunk-grid.tsx` - Visual chunk matrix

- [ ] Log viewer
  - [ ] `live-log.tsx`
  - [ ] Auto-scroll
  - [ ] Level filtering
  - [ ] Expandable

- [ ] Result components
  - [ ] `completion-card.tsx` - Success state
  - [ ] `error-card.tsx` - Failure state

- [ ] History list
  - [ ] `job-history-list.tsx`
  - [ ] Status badges
  - [ ] Action buttons

### Deliverables
- All pages navigable
- All components styled
- Forms functional
- Progress display working

---

## Phase 5: Real-Time Progress

### Tasks

- [ ] SSE endpoint
  - [ ] `GET /api/automation/stream/[jobId]`
  - [ ] Event formatting
  - [ ] Connection management

- [ ] Client hook
  - [ ] `useAutomationProgress.ts`
  - [ ] EventSource management
  - [ ] State updates
  - [ ] Reconnection logic

- [ ] Progress calculation
  - [ ] Overall percentage formula
  - [ ] Time remaining estimate
  - [ ] Stage weights

- [ ] Connect UI to real-time data
  - [ ] Progress page uses hook
  - [ ] Live log updates
  - [ ] Chunk grid updates

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

### Deliverables
- SSE endpoint working
- Real-time updates in UI
- Progress accurate
- Logs streaming

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

### Phase 0: Foundation
- [ ] Folder structure
- [ ] Type definitions
- [ ] Job store
- [ ] Progress emitter
- [ ] Temp manager
- [ ] Cost calculator

### Phase 1: Download & Chunking
- [ ] YouTube download integration
- [ ] Chunk service
- [ ] Automation service skeleton
- [ ] Start API endpoint
- [ ] Status API endpoint

### Phase 2: Parallel Dubbing
- [ ] Parallel dubbing service
- [ ] ElevenLabs integration
- [ ] Retry logic
- [ ] Rate limiting
- [ ] Progress tracking

### Phase 3: Merging & Output
- [ ] Merge service
- [ ] Audio replacement
- [ ] Concatenation
- [ ] Finalization
- [ ] Cleanup

### Phase 4: UI Components
- [ ] Page layouts
- [ ] URL input
- [ ] Config panel
- [ ] Estimate card
- [ ] Progress components
- [ ] Log viewer
- [ ] Result components
- [ ] History list

### Phase 5: Real-Time Progress
- [ ] SSE endpoint
- [ ] Client hook
- [ ] Progress calculation
- [ ] UI integration
- [ ] Fallback polling

### Phase 6: Polish
- [ ] Cancel functionality
- [ ] Retry functionality
- [ ] Download endpoint
- [ ] History management
- [ ] Error handling
- [ ] Edge cases
- [ ] Testing
- [ ] Documentation
