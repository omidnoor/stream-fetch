import { useState } from 'react';
import type { AutomationJob } from '@/services/automation';

interface CompletionCardProps {
  job: AutomationJob;
  onDownload: () => Promise<void>;
}

export function CompletionCard({ job, onDownload }: CompletionCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  // Calculate statistics
  const duration = job.updatedAt && job.createdAt
    ? (new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) / 1000
    : 0;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const totalChunks = job.progress.dubbing?.chunks.length || 0;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Dubbing Complete!
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Your video has been successfully dubbed to {job.config.targetLanguage.toUpperCase()}
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{totalChunks}</div>
          <div className="text-sm text-gray-600 mt-1">Chunks Processed</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{formatDuration(duration)}</div>
          <div className="text-sm text-gray-600 mt-1">Total Time</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {Math.floor(job.videoInfo.duration / 60)}:{(job.videoInfo.duration % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 mt-1">Video Duration</div>
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2">{job.videoInfo.title}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Original Language:</span>
            <span className="ml-2 font-medium">Auto-detected</span>
          </div>
          <div>
            <span className="text-gray-600">Target Language:</span>
            <span className="ml-2 font-medium">{job.config.targetLanguage.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-gray-600">Quality:</span>
            <span className="ml-2 font-medium">{job.config.videoQuality}</span>
          </div>
          <div>
            <span className="text-gray-600">Watermark:</span>
            <span className="ml-2 font-medium">{job.config.useWatermark ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{downloading ? 'Downloading...' : 'Download Dubbed Video'}</span>
      </button>

      {/* Additional Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => window.location.href = '/automation'}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
        >
          Create New Job
        </button>
        <button
          onClick={() => window.location.href = '/automation/history'}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
        >
          View History
        </button>
      </div>

      {/* Output File Info */}
      {job.outputFile && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 text-sm">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-gray-600">
                <strong>Output:</strong> {job.outputFile.split('/').pop()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
