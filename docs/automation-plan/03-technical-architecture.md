# Technical Architecture

## File Structure

```
src/
├── app/
│   ├── (pages)/
│   │   └── automation/
│   │       ├── page.tsx                    # Main automation page
│   │       ├── [jobId]/
│   │       │   └── page.tsx                # Job progress page
│   │       └── history/
│   │           └── page.tsx                # Job history
│   └── api/
│       └── automation/
│           ├── start/route.ts              # Start pipeline
│           ├── status/[jobId]/route.ts     # Get job status
│           ├── stream/[jobId]/route.ts     # SSE progress stream
│           ├── cancel/[jobId]/route.ts     # Cancel job
│           ├── retry/[jobId]/route.ts      # Retry failed chunks
│           ├── download/[jobId]/route.ts   # Download result
│           └── jobs/route.ts               # List all jobs
│
├── components/
│   └── automation/
│       ├── url-input.tsx                   # URL input with validation
│       ├── config-panel.tsx                # Configuration options
│       ├── estimate-card.tsx               # Cost/time estimates
│       ├── pipeline-progress.tsx           # Main progress display
│       ├── stage-indicator.tsx             # Individual stage status
│       ├── chunk-grid.tsx                  # Visual chunk grid
│       ├── live-log.tsx                    # Real-time log viewer
│       ├── completion-card.tsx             # Success result display
│       ├── error-card.tsx                  # Failure display
│       └── job-history-list.tsx            # History list
│
├── services/
│   └── automation/
│       ├── automation.service.ts           # Main orchestration
│       ├── automation.factory.ts           # Singleton factory
│       ├── automation.types.ts             # TypeScript interfaces
│       ├── pipeline.manager.ts             # Pipeline state machine
│       ├── chunk.service.ts                # Video chunking (FFmpeg)
│       ├── parallel-dubbing.service.ts     # Parallel job queue
│       └── merge.service.ts                # Chunk merging (FFmpeg)
│
└── lib/
    └── automation/
        ├── job-store.ts                    # Job persistence
        ├── progress-emitter.ts             # Event emitter for progress
        ├── cost-calculator.ts              # Pricing calculations
        └── temp-manager.ts                 # Temp file management
```

---

## Data Models

### AutomationJob

```typescript
interface AutomationJob {
  id: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;

  // Input
  youtubeUrl: string;
  videoInfo: VideoInfo;

  // Configuration
  config: PipelineConfig;

  // Progress
  progress: PipelineProgress;

  // Paths
  paths: JobPaths;

  // Output
  outputFile?: string;
  error?: JobError;
}

type JobStatus =
  | 'pending'
  | 'downloading'
  | 'chunking'
  | 'dubbing'
  | 'merging'
  | 'finalizing'
  | 'complete'
  | 'failed'
  | 'cancelled';
```

### PipelineConfig

```typescript
interface PipelineConfig {
  chunkDuration: number;          // seconds (30, 60, 120, 300)
  targetLanguage: string;         // ISO code (es, fr, de, etc.)
  maxParallelJobs: number;        // 1-5, default 3
  videoQuality: string;           // 1080p, 720p, etc.
  outputFormat: 'mp4' | 'webm';
  useWatermark: boolean;          // Reduces cost
  keepIntermediateFiles: boolean;
  chunkingStrategy: 'fixed' | 'scene' | 'silence';
}
```

### PipelineProgress

```typescript
interface PipelineProgress {
  stage: PipelineStage;
  overallPercent: number;
  startedAt: Date;
  estimatedCompletion?: Date;

  download?: DownloadProgress;
  chunking?: ChunkingProgress;
  dubbing?: DubbingProgress;
  merging?: MergingProgress;

  logs: LogEntry[];
}

type PipelineStage =
  | 'download'
  | 'chunk'
  | 'dub'
  | 'merge'
  | 'finalize';

interface DownloadProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  speed: string;
  eta: number;
}

interface ChunkingProgress {
  totalChunks: number;
  processed: number;
  currentChunk?: string;
}

interface DubbingProgress {
  chunks: ChunkStatus[];
  activeJobs: number;
  completed: number;
  failed: number;
  pending: number;
}

interface MergingProgress {
  percent: number;
  currentStep: 'replacing_audio' | 'concatenating' | 'finalizing';
  chunksProcessed: number;
  totalChunks: number;
}
```

### ChunkStatus

```typescript
interface ChunkStatus {
  index: number;
  filename: string;
  status: ChunkState;
  dubbingJobId?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
}

type ChunkState =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'retrying';
```

### JobPaths

```typescript
interface JobPaths {
  root: string;           // /temp/automation/{jobId}
  source: string;         // /temp/automation/{jobId}/source/
  chunks: string;         // /temp/automation/{jobId}/chunks/
  dubbed: string;         // /temp/automation/{jobId}/dubbed/
  output: string;         // /temp/automation/{jobId}/output/
}
```

### LogEntry

```typescript
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  stage: PipelineStage;
  message: string;
  metadata?: Record<string, unknown>;
}
```

### JobError

```typescript
interface JobError {
  code: string;
  message: string;
  stage: PipelineStage;
  recoverable: boolean;
  failedChunks?: number[];
  details?: Record<string, unknown>;
}
```

---

## API Endpoints

### POST `/api/automation/start`

Start a new pipeline job.

**Request:**
```typescript
{
  youtubeUrl: string;
  config: PipelineConfig;
}
```

**Response:**
```typescript
{
  jobId: string;
  status: 'pending';
  estimatedTime: number;
  estimatedCost: number;
}
```

### GET `/api/automation/status/[jobId]`

Get current job status (polling).

**Response:**
```typescript
{
  job: AutomationJob;
}
```

### GET `/api/automation/stream/[jobId]`

Server-Sent Events stream for real-time updates.

**Event Format:**
```
event: progress
data: {"stage":"dubbing","overallPercent":42,...}

event: log
data: {"timestamp":"...","level":"info","message":"..."}

event: complete
data: {"outputFile":"...","duration":1694}

event: error
data: {"code":"DUBBING_FAILED","message":"..."}
```

### POST `/api/automation/cancel/[jobId]`

Cancel a running job.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### POST `/api/automation/retry/[jobId]`

Retry failed chunks only.

**Response:**
```typescript
{
  success: boolean;
  chunksToRetry: number[];
}
```

### GET `/api/automation/download/[jobId]`

Download the final video file.

**Response:** Binary stream with appropriate headers.

### GET `/api/automation/jobs`

List all jobs with pagination.

**Query Params:**
- `limit`: number (default 10)
- `offset`: number (default 0)
- `status`: filter by status

**Response:**
```typescript
{
  jobs: AutomationJob[];
  total: number;
  hasMore: boolean;
}
```

---

## Service Architecture

### AutomationService

Main orchestrator that coordinates the pipeline.

```typescript
class AutomationService {
  async startPipeline(url: string, config: PipelineConfig): Promise<string>;
  async getJobStatus(jobId: string): Promise<AutomationJob>;
  async cancelJob(jobId: string): Promise<void>;
  async retryFailedChunks(jobId: string): Promise<void>;

  // Internal pipeline stages
  private async downloadVideo(job: AutomationJob): Promise<void>;
  private async chunkVideo(job: AutomationJob): Promise<void>;
  private async dubChunks(job: AutomationJob): Promise<void>;
  private async mergeChunks(job: AutomationJob): Promise<void>;
  private async finalize(job: AutomationJob): Promise<void>;
}
```

### PipelineManager

State machine for pipeline execution.

```typescript
class PipelineManager {
  constructor(job: AutomationJob);

  async execute(): Promise<void>;
  async pause(): Promise<void>;
  async resume(): Promise<void>;
  async cancel(): Promise<void>;

  onProgress(callback: (progress: PipelineProgress) => void): void;
  onStageComplete(callback: (stage: PipelineStage) => void): void;
  onError(callback: (error: JobError) => void): void;
}
```

### ChunkService

Handles video splitting with FFmpeg.

```typescript
class ChunkService {
  async splitVideo(
    inputPath: string,
    outputDir: string,
    duration: number,
    strategy: 'fixed' | 'scene' | 'silence'
  ): Promise<ChunkManifest>;

  async getChunkInfo(chunkPath: string): Promise<ChunkInfo>;
}
```

### ParallelDubbingService

Manages concurrent dubbing jobs.

```typescript
class ParallelDubbingService {
  constructor(maxConcurrent: number);

  async processChunks(
    chunks: ChunkInfo[],
    targetLanguage: string,
    onProgress: (status: ChunkStatus) => void
  ): Promise<DubbingResult[]>;

  async retryChunk(chunk: ChunkInfo): Promise<DubbingResult>;
  cancelAll(): void;
}
```

### MergeService

Combines dubbed chunks into final video.

```typescript
class MergeService {
  async replaceAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string
  ): Promise<void>;

  async concatenateVideos(
    videoPaths: string[],
    outputPath: string,
    crossfade?: number
  ): Promise<void>;
}
```

---

## Real-Time Progress (SSE)

### Server Implementation

```typescript
// GET /api/automation/stream/[jobId]/route.ts

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Subscribe to progress events
      const unsubscribe = progressEmitter.subscribe(params.jobId, {
        onProgress: (p) => send('progress', p),
        onLog: (l) => send('log', l),
        onComplete: (r) => { send('complete', r); controller.close(); },
        onError: (e) => { send('error', e); controller.close(); },
      });

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client Hook

```typescript
// hooks/useAutomationProgress.ts

export function useAutomationProgress(jobId: string) {
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'complete' | 'error'>('connecting');

  useEffect(() => {
    const eventSource = new EventSource(`/api/automation/stream/${jobId}`);

    eventSource.addEventListener('progress', (e) => {
      setProgress(JSON.parse(e.data));
      setStatus('connected');
    });

    eventSource.addEventListener('log', (e) => {
      setLogs(prev => [...prev, JSON.parse(e.data)].slice(-100));
    });

    eventSource.addEventListener('complete', () => {
      setStatus('complete');
      eventSource.close();
    });

    eventSource.addEventListener('error', () => {
      setStatus('error');
    });

    return () => eventSource.close();
  }, [jobId]);

  return { progress, logs, status };
}
```

---

## Job Persistence

### JobStore

File-based persistence for jobs (can be upgraded to DB later).

```typescript
// lib/automation/job-store.ts

class JobStore {
  private basePath = '/temp/automation/jobs';

  async create(job: AutomationJob): Promise<void>;
  async get(jobId: string): Promise<AutomationJob | null>;
  async update(jobId: string, updates: Partial<AutomationJob>): Promise<void>;
  async delete(jobId: string): Promise<void>;
  async list(filter?: { status?: JobStatus }): Promise<AutomationJob[]>;

  // Progress-specific updates (high frequency)
  async updateProgress(jobId: string, progress: PipelineProgress): Promise<void>;
  async addLog(jobId: string, log: LogEntry): Promise<void>;
}
```

### Storage Structure

```
/temp/automation/
├── jobs/
│   ├── {jobId-1}.json
│   ├── {jobId-2}.json
│   └── ...
└── {jobId}/
    ├── source/
    │   └── video.mp4
    ├── chunks/
    │   ├── manifest.json
    │   ├── chunk_001.mp4
    │   └── ...
    ├── dubbed/
    │   ├── chunk_001_dubbed.mp3
    │   └── ...
    └── output/
        └── final.mp4
```
