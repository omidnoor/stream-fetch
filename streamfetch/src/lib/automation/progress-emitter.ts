/**
 * Progress Event Emitter
 * Singleton event emitter for real-time progress updates
 */

import { EventEmitter } from 'events';
import {
  PipelineProgress,
  LogEntry,
  JobError,
  ProgressSubscription,
} from '@/services/automation/automation.types';

export interface ProgressEmitterEvents {
  progress: (jobId: string, progress: PipelineProgress) => void;
  log: (jobId: string, log: LogEntry) => void;
  complete: (jobId: string, outputFile: string, duration: number) => void;
  error: (jobId: string, error: JobError) => void;
}

export class ProgressEmitter extends EventEmitter {
  private static instance: ProgressEmitter | null = null;

  private constructor() {
    super();
    this.setMaxListeners(100); // Allow many concurrent listeners
  }

  static getInstance(): ProgressEmitter {
    if (!ProgressEmitter.instance) {
      ProgressEmitter.instance = new ProgressEmitter();
    }
    return ProgressEmitter.instance;
  }

  /**
   * Emit progress update for a job
   */
  emitProgress(jobId: string, progress: PipelineProgress): void {
    this.emit(`progress:${jobId}`, progress);
    this.emit('progress', jobId, progress);
  }

  /**
   * Emit log entry for a job
   */
  emitLog(jobId: string, log: LogEntry): void {
    this.emit(`log:${jobId}`, log);
    this.emit('log', jobId, log);
  }

  /**
   * Emit completion event for a job
   */
  emitComplete(jobId: string, outputFile: string, duration: number): void {
    this.emit(`complete:${jobId}`, { outputFile, duration });
    this.emit('complete', jobId, { outputFile, duration });
  }

  /**
   * Emit error event for a job
   */
  emitError(jobId: string, error: JobError): void {
    this.emit(`error:${jobId}`, error);
    this.emit('error', jobId, error);
  }

  /**
   * Subscribe to all events for a specific job
   */
  subscribe(jobId: string, subscription: ProgressSubscription): () => void {
    const handlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

    if (subscription.onProgress) {
      const handler = (progress: PipelineProgress) => subscription.onProgress!(progress);
      this.on(`progress:${jobId}`, handler);
      handlers.push({ event: `progress:${jobId}`, handler });
    }

    if (subscription.onLog) {
      const handler = (log: LogEntry) => subscription.onLog!(log);
      this.on(`log:${jobId}`, handler);
      handlers.push({ event: `log:${jobId}`, handler });
    }

    if (subscription.onComplete) {
      const handler = (result: { outputFile: string; duration: number }) => {
        subscription.onComplete!(result.outputFile);
      };
      this.on(`complete:${jobId}`, handler);
      handlers.push({ event: `complete:${jobId}`, handler });
    }

    if (subscription.onError) {
      const handler = (error: JobError) => subscription.onError!(error);
      this.on(`error:${jobId}`, handler);
      handlers.push({ event: `error:${jobId}`, handler });
    }

    // Return unsubscribe function
    return () => {
      handlers.forEach(({ event, handler }) => {
        this.off(event, handler);
      });
    };
  }

  /**
   * Remove all listeners for a specific job
   */
  unsubscribeAll(jobId: string): void {
    this.removeAllListeners(`progress:${jobId}`);
    this.removeAllListeners(`log:${jobId}`);
    this.removeAllListeners(`complete:${jobId}`);
    this.removeAllListeners(`error:${jobId}`);
  }

  /**
   * Get current listener count for a job
   */
  getListenerCount(jobId: string): number {
    return (
      this.listenerCount(`progress:${jobId}`) +
      this.listenerCount(`log:${jobId}`) +
      this.listenerCount(`complete:${jobId}`) +
      this.listenerCount(`error:${jobId}`)
    );
  }

  /**
   * Check if a job has any active listeners
   */
  hasListeners(jobId: string): boolean {
    return this.getListenerCount(jobId) > 0;
  }
}

// Export singleton instance getter
export function getProgressEmitter(): ProgressEmitter {
  return ProgressEmitter.getInstance();
}

// Export helper for creating log entries
export function createLogEntry(
  stage: LogEntry['stage'],
  level: LogEntry['level'],
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date(),
    level,
    stage,
    message,
    metadata,
  };
}
