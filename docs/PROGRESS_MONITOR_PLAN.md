# Progress Monitor Window - Implementation Plan

## Overview
Create a medium-sized, sleek, modern monitoring window that shows real-time pipeline progress using SSE streaming data. All styles will come from the design system in `globals.css`.

## Data Sources

### API Endpoint
- **SSE Stream**: `/api/automation/stream/[jobId]`
- **Events**: `progress`, `log`, `complete`, `error`, `heartbeat`

### Available Data (from automation.types.ts)

#### Pipeline Stages
1. **download** - Downloading YouTube video
2. **chunk** - Splitting into chunks
3. **dub** - AI dubbing chunks in parallel
4. **merge** - Merging dubbed chunks
5. **finalize** - Final processing

#### Progress Data Structure
```typescript
PipelineProgress {
  stage: PipelineStage
  overallPercent: number (0-100)
  startedAt: Date
  estimatedCompletion?: Date

  // Stage-specific progress
  download?: {
    percent: number
    bytesDownloaded: number
    totalBytes: number
    speed: string (e.g., "2.5 MB/s")
    eta: number (seconds)
  }

  chunking?: {
    totalChunks: number
    processed: number
    currentChunk?: string
  }

  dubbing?: {
    chunks: ChunkStatus[] // {index, filename, status, error, etc.}
    activeJobs: number
    completed: number
    failed: number
    pending: number
  }

  merging?: {
    percent: number
    currentStep: 'replacing_audio' | 'concatenating' | 'finalizing'
    chunksProcessed: number
    totalChunks: number
  }

  logs: LogEntry[]
}
```

#### Chunk States
- `pending` - Waiting to process
- `uploading` - Uploading to ElevenLabs
- `processing` - Being dubbed
- `complete` - Successfully dubbed
- `failed` - Error occurred
- `retrying` - Retry in progress

## Component Design

### 1. Main Container
**Location**: Show AFTER form submission, BEFORE EstimateCard
**Size**: Medium - takes full width, ~500-600px height
**Style**: Uses `card-elevated` class from globals.css with gradient border

### 2. Layout Sections (Top to Bottom)

#### A. Header Bar
- **Left**: Current stage indicator with icon
- **Right**: Overall progress percentage + elapsed time
- **Style**: `glass` effect from globals.css, gradient border using CSS variables

#### B. Stage Timeline
- Horizontal stepper showing all 5 stages
- Active stage highlighted with `text-primary` and `bg-primary/10`
- Completed stages with checkmark in `text-success`
- Upcoming stages with `text-muted-foreground`

#### C. Main Progress Area (Changes per stage)

**Download Stage:**
```
┌─────────────────────────────────────────┐
│ Progress bar using .progress-bar class  │
│ 156 MB / 240 MB                         │
│ Speed: 2.5 MB/s  │  ETA: 34s            │
└─────────────────────────────────────────┘
```

**Chunking Stage:**
```
┌─────────────────────────────────────────┐
│ Processing chunk 8/12                   │
│ Progress bar using .progress-bar class  │
│ text-muted-foreground for filename      │
└─────────────────────────────────────────┘
```

**Dubbing Stage (Most Complex):**
```
┌─────────────────────────────────────────┐
│ Active: 3  │  Complete: 5  │  Failed: 0 │
│                                          │
│ Chunks Grid (using Tailwind Grid):      │
│ ✓ = bg-success/10 border-success        │
│ ⟳ = bg-primary/10 border-primary        │
│ ○ = bg-surface-3 border-border          │
│ ✗ = bg-destructive/10 border-destructive│
└─────────────────────────────────────────┘
```

**Merging Stage:**
```
┌─────────────────────────────────────────┐
│ Step: Replacing Audio                   │
│ Progress bar using .progress-bar class  │
│ Processing chunk 10/12                  │
└─────────────────────────────────────────┘
```

**Finalize Stage:**
```
┌─────────────────────────────────────────┐
│ Finalizing output file...              │
│ Progress bar using .progress-bar class  │
└─────────────────────────────────────────┘
```

#### D. Live Log Panel
- Uses `font-mono` for terminal aesthetic
- `scrollbar-thin` class from globals.css
- Each log entry with timestamp in `text-muted-foreground`
- Log levels styled with semantic colors:
  - `info`: `text-info`
  - `warn`: `text-warning`
  - `error`: `text-destructive`
  - `debug`: `text-muted-foreground`

### 3. Design System Usage (from globals.css)

#### CSS Classes to Use
- **Containers**: `card-elevated`, `card-base`
- **Progress Bars**: `.progress-bar` and `.progress-fill`
- **Inputs**: `.input-field` (if needed)
- **Buttons**: `.btn-ghost`
- **Icons**: `.icon-box`
- **Text**: `.gradient-text` for special highlights
- **Effects**: `.glass` for glassmorphism
- **Scrollbars**: `.scrollbar-thin`

#### CSS Variables to Use
```css
/* Surfaces */
bg-surface-0, bg-surface-1, bg-surface-2, bg-surface-3, bg-surface-4

/* Semantic Colors */
text-primary, bg-primary, border-primary
text-success, bg-success, border-success
text-destructive, bg-destructive, border-destructive
text-warning, bg-warning, border-warning
text-info, bg-info, border-info
text-muted-foreground
text-foreground

/* Features (for stage icons) */
text-feature-1, bg-feature-1/10
text-feature-2, bg-feature-2/10
text-feature-3, bg-feature-3/10

/* Borders */
border, border-border
```

#### Animations to Add to globals.css
```css
/* Add to @layer utilities section */

/* Pulse effect for active stage */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
  }
  50% {
    box-shadow: 0 0 30px hsl(var(--primary) / 0.5);
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Shimmer for progress bars */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.shimmer {
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* Smooth fade-in for logs */
@keyframes log-entry {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-entry-new {
  animation: log-entry 0.3s ease-out;
}
```

### 4. Component Structure

**Location**: `src/components/automation/progress/`

```tsx
<ProgressMonitor jobId={jobId}>
  <MonitorHeader
    stage={stage}
    percent={overallPercent}
    elapsedTime={elapsedTime}
  />

  <StageTimeline
    stages={['download', 'chunk', 'dub', 'merge', 'finalize']}
    currentStage={stage}
  />

  <ProgressContent stage={stage}>
    {stage === 'download' && <DownloadProgress data={download} />}
    {stage === 'chunk' && <ChunkingProgress data={chunking} />}
    {stage === 'dub' && <DubbingProgress data={dubbing} />}
    {stage === 'merge' && <MergingProgress data={merging} />}
    {stage === 'finalize' && <FinalizeProgress />}
  </ProgressContent>

  <LogPanel logs={logs} />
</ProgressMonitor>
```

### 5. SSE Integration Hook

**Location**: `src/hooks/useJobProgress.ts`

```typescript
export function useJobProgress(jobId: string) {
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<JobError | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/automation/stream/${jobId}`);

    eventSource.addEventListener('progress', (e) => {
      const progressData = JSON.parse(e.data);
      setProgress(progressData);
    });

    eventSource.addEventListener('log', (e) => {
      const log = JSON.parse(e.data);
      setLogs(prev => [...prev, log]);
    });

    eventSource.addEventListener('complete', (e) => {
      const { outputFile, duration } = JSON.parse(e.data);
      setIsComplete(true);
      // Can handle completion here
    });

    eventSource.addEventListener('error', (e) => {
      const errorData = JSON.parse(e.data);
      setError(errorData);
    });

    return () => eventSource.close();
  }, [jobId]);

  return { progress, logs, isComplete, error };
}
```

## Implementation Steps

### Phase 1: Setup & Core Components
1. ✅ Add animation utilities to `globals.css`
2. ⏳ Create `useJobProgress.ts` hook in `src/hooks/`
3. ⏳ Create `ProgressMonitor.tsx` - Main container with SSE
4. ⏳ Create `MonitorHeader.tsx` - Header with stage/percent/time
5. ⏳ Create `StageTimeline.tsx` - Horizontal stage stepper

### Phase 2: Stage-Specific Views
6. ⏳ Create `DownloadProgress.tsx` - Download metrics view
7. ⏳ Create `ChunkingProgress.tsx` - Chunking progress view
8. ⏳ Create `DubbingProgress.tsx` - Chunk grid + stats
9. ⏳ Create `MergingProgress.tsx` - Merge progress view
10. ⏳ Create `FinalizeProgress.tsx` - Finalize view

### Phase 3: Supporting Components
11. ⏳ Create `LogPanel.tsx` - Scrollable log viewer with filtering
12. ⏳ Create `ChunkGrid.tsx` - Visual chunk status grid
13. ⏳ Create `MetricCard.tsx` - Reusable metric display

### Phase 4: Integration
14. ⏳ Add ProgressMonitor to automation page
15. ⏳ Show monitor after pipeline starts
16. ⏳ Handle completion → transition to download
17. ⏳ Handle errors → show retry options
18. ⏳ Test responsive design

## File Structure

```
src/
├── app/globals.css                    # Add animations here
├── hooks/
│   └── useJobProgress.ts              # SSE connection hook
└── components/
    └── automation/
        ├── EstimateCard.tsx           # Existing (update to match design)
        └── progress/
            ├── ProgressMonitor.tsx    # Main container
            ├── MonitorHeader.tsx      # Header bar
            ├── StageTimeline.tsx      # Stage stepper
            ├── DownloadProgress.tsx   # Download stage view
            ├── ChunkingProgress.tsx   # Chunking stage view
            ├── DubbingProgress.tsx    # Dubbing stage view
            ├── MergingProgress.tsx    # Merging stage view
            ├── FinalizeProgress.tsx   # Finalize stage view
            ├── LogPanel.tsx           # Log viewer
            ├── ChunkGrid.tsx          # Chunk visualization
            └── MetricCard.tsx         # Metric display card
```

## Design Principles

1. **No Inline Styles**: Everything uses Tailwind classes or global CSS classes
2. **Consistent Spacing**: Use Tailwind's spacing scale (space-y-4, gap-6, etc.)
3. **Color Consistency**: Only use CSS variables from design system
4. **Reusable Components**: Extract common patterns into shared components
5. **Accessible**: Proper ARIA labels, semantic HTML
6. **Responsive**: Works on mobile (stacked layout) and desktop (grid layout)

## Visual Mockup

```
┌────────────────────────────────────────────────────────────────┐
│ AUTOMATED DUBBING PIPELINE                                     │
│                                                                 │
│ [Progress Monitor - card-elevated with gradient border]        │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Header: Dubbing ● 65% ● 2m 34s elapsed                     │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ Timeline: ✓ Download → ✓ Chunk → ⟳ Dub → Merge → Finalize │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ [Stage-specific content area]                              │ │
│ │ Active: 3  │  Complete: 5  │  Failed: 0                    │ │
│ │                                                             │ │
│ │ [Chunk Grid - 3x4]                                         │ │
│ │ ✓ ✓ ✓ ✓                                                    │ │
│ │ ✓ ⟳ ⟳ ⟳                                                    │ │
│ │ ○ ○ ○ ○                                                    │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ Logs [scrollbar-thin, font-mono]:                          │ │
│ │ [14:23:45] INFO  Download started                          │ │
│ │ [14:23:52] INFO  Download: 25%                             │ │
│ │ [14:24:10] INFO  Download complete                         │ │
│ │ [14:24:11] INFO  Chunking video...                         │ │
│ │ [14:24:15] INFO  Created 12 chunks                         │ │
│ │ [14:24:16] INFO  Starting parallel dubbing...              │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Estimate Card - existing component]                           │
└────────────────────────────────────────────────────────────────┘
```

## Next Actions

1. Start with Phase 1: Add animations to globals.css
2. Create the useJobProgress hook
3. Build ProgressMonitor component with SSE integration
4. Add to automation page and test with real pipeline

---

**Ready to implement!** All styles will come from the design system in globals.css, maintaining consistency across the app.
