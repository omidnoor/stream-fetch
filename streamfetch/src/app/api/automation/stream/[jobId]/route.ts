/**
 * GET /api/automation/stream/[jobId]
 * Server-Sent Events stream for real-time job progress
 */

import { NextRequest } from 'next/server';
import { getAutomationService } from '@/services/automation';
import { getProgressEmitter } from '@/lib/automation/progress-emitter';
import type { PipelineProgress, LogEntry, JobError } from '@/services/automation';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!jobId) {
    return new Response('Job ID is required', { status: 400 });
  }

  // Verify job exists
  const automationService = getAutomationService();
  const job = await automationService.getJobStatus(jobId);

  if (!job) {
    return new Response('Job not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  const progressEmitter = getProgressEmitter();

  const stream = new ReadableStream({
    start(controller) {
      // Helper to send SSE events
      const send = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial state
      send('progress', job.progress);

      // Subscribe to progress events
      const unsubscribe = progressEmitter.subscribe(jobId, {
        onProgress: (progress: PipelineProgress) => {
          send('progress', progress);
        },
        onLog: (log: LogEntry) => {
          send('log', log);
        },
        onComplete: (outputFile: string) => {
          send('complete', { outputFile, duration: Date.now() - job.progress.startedAt.getTime() });
          // Close the stream after sending complete event
          setTimeout(() => {
            controller.close();
          }, 100);
        },
        onError: (error: JobError) => {
          send('error', error);
          // Close the stream after sending error event
          setTimeout(() => {
            controller.close();
          }, 100);
        },
      });

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          send('heartbeat', { timestamp: new Date().toISOString() });
        } catch (error) {
          // Connection closed, stop heartbeat
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup heartbeat on close
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        originalClose();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
