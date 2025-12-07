/**
 * Automation Pipeline Type Definitions
 * Contains all interfaces and types for the automated dubbing pipeline
 */

// ============================================================================
// Job Status Types
// ============================================================================

export type JobStatus =
  | 'pending'
  | 'downloading'
  | 'chunking'
  | 'dubbing'
  | 'merging'
  | 'finalizing'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type PipelineStage =
  | 'download'
  | 'chunk'
  | 'dub'
  | 'merge'
  | 'finalize';

export type ChunkState =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'retrying';

export type ChunkingStrategy = 'fixed' | 'scene' | 'silence';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type MergeStep = 'replacing_audio' | 'concatenating' | 'finalizing';

// ============================================================================
// Configuration Types
// ============================================================================

export interface PipelineConfig {
  chunkDuration: number;          // seconds (30, 60, 120, 300)
  targetLanguage: string;         // ISO code (es, fr, de, etc.)
  maxParallelJobs: number;        // 1-5, default 3
  videoQuality: string;           // 1080p, 720p, etc.
  outputFormat: 'mp4' | 'webm';
  useWatermark: boolean;          // Reduces cost
  keepIntermediateFiles: boolean;
  chunkingStrategy: ChunkingStrategy;
}

export interface VideoInfo {
  title: string;
  duration: number;               // seconds
  thumbnail: string;
  resolution: string;
  codec: string;
  fileSize?: number;
}

// ============================================================================
// Progress Types
// ============================================================================

export interface DownloadProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  speed: string;
  eta: number;                    // seconds
}

export interface ChunkingProgress {
  totalChunks: number;
  processed: number;
  currentChunk?: string;
}

export interface DubbingProgress {
  chunks: ChunkStatus[];
  activeJobs: number;
  completed: number;
  failed: number;
  pending: number;
}

export interface MergingProgress {
  percent: number;
  currentStep: MergeStep;
  chunksProcessed: number;
  totalChunks: number;
}

export interface PipelineProgress {
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

// ============================================================================
// Chunk Types
// ============================================================================

export interface ChunkInfo {
  index: number;
  filename: string;
  startTime: number;              // seconds
  endTime: number;                // seconds
  duration: number;               // seconds
  path: string;
}

export interface ChunkStatus {
  index: number;
  filename: string;
  status: ChunkState;
  dubbingJobId?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
}

export interface ChunkManifest {
  jobId: string;
  totalChunks: number;
  chunkDuration: number;
  chunks: ChunkInfo[];
}

export interface DubbingResult {
  chunkIndex: number;
  outputPath: string;
  dubbingJobId: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// Job Types
// ============================================================================

export interface JobPaths {
  root: string;           // /temp/automation/{jobId}
  source: string;         // /temp/automation/{jobId}/source/
  chunks: string;         // /temp/automation/{jobId}/chunks/
  dubbed: string;         // /temp/automation/{jobId}/dubbed/
  output: string;         // /temp/automation/{jobId}/output/
}

export interface JobError {
  code: string;
  message: string;
  stage: PipelineStage;
  recoverable: boolean;
  failedChunks?: number[];
  details?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  stage: PipelineStage;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationJob {
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

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface StartPipelineRequest {
  youtubeUrl: string;
  config: PipelineConfig;
}

export interface StartPipelineResponse {
  jobId: string;
  status: JobStatus;
  estimatedTime: number;          // seconds
  estimatedCost: number;          // USD
}

export interface JobStatusResponse {
  job: AutomationJob;
}

export interface CancelJobResponse {
  success: boolean;
  message: string;
}

export interface RetryJobRequest {
  chunksToRetry?: number[];       // If not specified, retry all failed chunks
}

export interface RetryJobResponse {
  success: boolean;
  chunksToRetry: number[];
}

export interface ListJobsRequest {
  limit?: number;
  offset?: number;
  status?: JobStatus;
}

export interface ListJobsResponse {
  jobs: AutomationJob[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Event Types (for SSE)
// ============================================================================

export type SSEEventType = 'progress' | 'log' | 'complete' | 'error';

export interface SSEProgressEvent {
  type: 'progress';
  data: PipelineProgress;
}

export interface SSELogEvent {
  type: 'log';
  data: LogEntry;
}

export interface SSECompleteEvent {
  type: 'complete';
  data: {
    outputFile: string;
    duration: number;
  };
}

export interface SSEErrorEvent {
  type: 'error';
  data: JobError;
}

export type SSEEvent = SSEProgressEvent | SSELogEvent | SSECompleteEvent | SSEErrorEvent;

// ============================================================================
// Cost Estimation Types
// ============================================================================

export interface CostEstimate {
  totalCost: number;              // USD
  costPerChunk: number;           // USD
  totalChunks: number;
  videoDuration: number;          // seconds
  breakdown: {
    dubbingCost: number;
    processingCost: number;
  };
}

export interface TimeEstimate {
  totalTime: number;              // seconds
  breakdown: {
    download: number;
    chunking: number;
    dubbing: number;
    merging: number;
    finalization: number;
  };
}

// ============================================================================
// Service Interface Types
// ============================================================================

export interface ProgressCallback {
  (progress: PipelineProgress): void;
}

export interface LogCallback {
  (log: LogEntry): void;
}

export interface ErrorCallback {
  (error: JobError): void;
}

export interface CompleteCallback {
  (outputFile: string): void;
}

export interface ProgressSubscription {
  onProgress?: ProgressCallback;
  onLog?: LogCallback;
  onComplete?: CompleteCallback;
  onError?: ErrorCallback;
}
