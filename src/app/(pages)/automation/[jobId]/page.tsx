'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AutomationJob, PipelineProgress, LogEntry } from '@/services/automation';
import { ErrorDisplay } from '@/components/automation/ErrorDisplay';
import { CompletionCard } from '@/components/automation/CompletionCard';

export default function JobProgressPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<AutomationJob | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'complete' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleDownload = async () => {
    if (!job) return;

    try {
      setDownloading(true);
      setError(null);
      const response = await fetch(`/api/automation/download/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.videoInfo.title}_dubbed_${job.config.targetLanguage}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = async () => {
    try {
      setRetrying(true);
      setError(null);
      const response = await fetch(`/api/automation/retry/${jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Retry failed');
      }

      // Reload the page to see updated progress
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/automation/cancel/${jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Cancel failed');
      }

      // Reload to see cancelled status
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  useEffect(() => {
    // Fetch initial job status
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/automation/status/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        const data = await response.json();
        setJob(data.job);
        setProgress(data.job.progress);
        setLogs(data.job.progress.logs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConnectionStatus('error');
      }
    };

    fetchJobStatus();

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/automation/stream/${jobId}`);

    eventSource.addEventListener('progress', (e) => {
      const progressData = JSON.parse(e.data);
      setProgress(progressData);
      setConnectionStatus('connected');
    });

    eventSource.addEventListener('log', (e) => {
      const logData = JSON.parse(e.data);
      setLogs((prev) => [...prev, logData].slice(-100)); // Keep last 100 logs
    });

    eventSource.addEventListener('complete', (e) => {
      const completeData = JSON.parse(e.data);
      setConnectionStatus('complete');
      console.log('Pipeline completed:', completeData);
      eventSource.close();
    });

    eventSource.addEventListener('error', (e: Event) => {
      const errorEvent = e as MessageEvent;
      if (errorEvent.data) {
        try {
          const errorData = JSON.parse(errorEvent.data);
          setError(errorData.message || 'Pipeline failed');
        } catch {
          setError('Connection error');
        }
      } else {
        setError('Connection lost');
      }
      setConnectionStatus('error');
      eventSource.close();
    });

    eventSource.addEventListener('heartbeat', () => {
      // Just keep the connection alive
    });

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'download':
        return 'bg-blue-500';
      case 'chunk':
        return 'bg-indigo-500';
      case 'dub':
        return 'bg-purple-500';
      case 'merge':
        return 'bg-pink-500';
      case 'finalize':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = () => {
    if (connectionStatus === 'complete') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Complete</span>;
    }
    if (connectionStatus === 'error') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Failed</span>;
    }
    if (connectionStatus === 'connected') {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Processing</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Connecting...</span>;
  };

  if (!job && !error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading job details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Pipeline Progress</h1>
          <div className="flex items-center gap-3">
            {getStatusBadge()}

            {/* Action Buttons */}
            {job?.status === 'complete' && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {downloading ? 'Downloading...' : 'Download Video'}
              </button>
            )}

            {job?.status === 'failed' && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {retrying ? 'Retrying...' : 'Retry Failed Chunks'}
              </button>
            )}

            {job?.status && !['complete', 'failed', 'cancelled'].includes(job.status) && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Cancel Job
              </button>
            )}
          </div>
        </div>
        {job && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-2">{job.videoInfo.title}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Duration: {Math.floor(job.videoInfo.duration / 60)}m {job.videoInfo.duration % 60}s</div>
              <div>Job ID: {jobId}</div>
              <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          title="Pipeline Error"
          showDetails={true}
          onDismiss={() => setError(null)}
          onRetry={job?.status === 'failed' ? handleRetry : undefined}
        />
      )}

      {/* Completion Card */}
      {job?.status === 'complete' && job && (
        <CompletionCard job={job} onDownload={handleDownload} />
      )}

      {progress && job?.status !== 'complete' && (
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{progress.overallPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getStageColor(progress.stage)}`}
                style={{ width: `${progress.overallPercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 capitalize">
              Current stage: {progress.stage}
            </div>
          </div>

          {/* Stage Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Pipeline Stages</h3>
            <div className="space-y-2">
              {['download', 'chunk', 'dub', 'merge', 'finalize'].map((stage) => (
                <div key={stage} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    progress.stage === stage ? getStageColor(stage) : 'bg-gray-300'
                  }`} />
                  <span className={`capitalize ${
                    progress.stage === stage ? 'font-semibold' : 'text-gray-500'
                  }`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Activity Log</h3>
            <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-400">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`
                    ${log.level === 'error' ? 'text-red-600' : ''}
                    ${log.level === 'warn' ? 'text-yellow-600' : ''}
                    ${log.level === 'info' ? 'text-blue-600' : ''}
                    ${log.level === 'debug' ? 'text-gray-500' : ''}
                  `}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
