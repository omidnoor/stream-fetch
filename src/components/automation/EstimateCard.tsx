import type { VideoInfo, PipelineConfig } from '@/services/automation';

interface EstimateCardProps {
  videoInfo: VideoInfo;
  config: PipelineConfig;
}

export function EstimateCard({ videoInfo, config }: EstimateCardProps) {
  // Calculate chunks
  const totalChunks = Math.ceil(videoInfo.duration / config.chunkDuration);

  // Calculate cost (ElevenLabs pricing: $0.24 per minute)
  const durationMinutes = videoInfo.duration / 60;
  const baseCost = durationMinutes * 0.24;
  const processingCost = 0.01 * totalChunks; // $0.01 per chunk
  const dubbingCost = config.useWatermark ? baseCost * 0.5 : baseCost;
  const finalCost = dubbingCost + processingCost;

  // Calculate time estimate (matching cost-calculator.ts formulas)
  // Download: 45s per minute of video
  // Chunking: 1s per minute
  // Dubbing: 2.5x real-time per batch (parallelized)
  // Merging: 2s per minute
  // Finalization: 5s fixed
  const downloadTimeSeconds = durationMinutes * 45;
  const chunkingTimeSeconds = durationMinutes * 1;

  // Dubbing time: calculate batches and apply multiplier
  const batches = Math.ceil(totalChunks / config.maxParallelJobs);
  const dubbingTimeSeconds = batches * config.chunkDuration * 2.5;

  const mergingTimeSeconds = durationMinutes * 2;
  const finalizationTimeSeconds = 5;
  const totalTimeSeconds = downloadTimeSeconds + chunkingTimeSeconds + dubbingTimeSeconds + mergingTimeSeconds + finalizationTimeSeconds;
  const totalTime = totalTimeSeconds / 60; // convert to minutes

  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    } else if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimate</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chunks */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Chunks</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalChunks}</p>
          <p className="text-xs text-gray-500 mt-1">
            {config.chunkDuration}s per chunk
          </p>
        </div>

        {/* Time */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Est. Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatTime(totalTime)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {config.maxParallelJobs}x parallel jobs
          </p>
        </div>

        {/* Cost */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">Est. Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCost(finalCost)}</p>
          {config.useWatermark && (
            <p className="text-xs text-green-600 mt-1">
              50% dubbing discount applied
            </p>
          )}
          {!config.useWatermark && (
            <p className="text-xs text-gray-500 mt-1">
              ${((baseCost * 0.5) + processingCost).toFixed(2)} with watermark
            </p>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <strong>Video:</strong> {videoInfo.title}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Duration:</strong> {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Target Language:</strong> {config.targetLanguage.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Estimates are approximate and may vary based on video complexity and API performance.
      </div>
    </div>
  );
}
