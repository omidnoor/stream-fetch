'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StartPipelineRequest, StartPipelineResponse, VideoInfo } from '@/services/automation';
import { ErrorDisplay } from '@/components/automation/ErrorDisplay';
import { EstimateCard } from '@/components/automation/EstimateCard';
import type { VideoInfoDto } from '@/services/youtube/youtube.types';

export default function AutomationPage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [chunkDuration, setChunkDuration] = useState(60);
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [maxParallelJobs, setMaxParallelJobs] = useState(3);
  const [useWatermark, setUseWatermark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const fetchVideoInfo = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setIsFetchingInfo(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(youtubeUrl)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video info');
      }

      const result = await response.json();

      // Convert VideoInfoDto to VideoInfo format
      if (result.success && result.data) {
        const dto: VideoInfoDto = result.data;
        const videoInfo: VideoInfo = {
          title: dto.video.title,
          duration: dto.video.duration,
          thumbnail: dto.video.thumbnail,
          resolution: dto.formats[0]?.quality || 'unknown',
          codec: dto.formats[0]?.codec || 'video/mp4',
          fileSize: dto.formats[0]?.filesize ?? undefined,
        };
        setVideoInfo(videoInfo);
      } else {
        throw new Error(result.error || 'Failed to fetch video info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video info');
      setVideoInfo(null);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const request: StartPipelineRequest = {
        youtubeUrl,
        config: {
          chunkDuration,
          targetLanguage,
          maxParallelJobs,
          videoQuality: '1080p',
          outputFormat: 'mp4',
          useWatermark,
          keepIntermediateFiles: false,
          chunkingStrategy: 'fixed',
        },
      };

      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start pipeline');
      }

      const data: StartPipelineResponse = await response.json();

      // Redirect to job progress page
      router.push(`/automation/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Automated Dubbing Pipeline</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL */}
          <div>
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <input
                id="youtubeUrl"
                type="url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setVideoInfo(null); // Clear video info when URL changes
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={fetchVideoInfo}
                disabled={isFetchingInfo || !youtubeUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              >
                {isFetchingInfo ? 'Loading...' : 'Get Estimate'}
              </button>
            </div>
          </div>

          {/* Chunk Duration */}
          <div>
            <label htmlFor="chunkDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Chunk Duration
            </label>
            <select
              id="chunkDuration"
              value={chunkDuration}
              onChange={(e) => setChunkDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          {/* Target Language */}
          <div>
            <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Target Language
            </label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="es">Spanish (es)</option>
              <option value="fr">French (fr)</option>
              <option value="de">German (de)</option>
              <option value="it">Italian (it)</option>
              <option value="pt">Portuguese (pt)</option>
              <option value="ja">Japanese (ja)</option>
              <option value="ko">Korean (ko)</option>
              <option value="zh">Chinese (zh)</option>
            </select>
          </div>

          {/* Max Parallel Jobs */}
          <div>
            <label htmlFor="maxParallelJobs" className="block text-sm font-medium text-gray-700 mb-2">
              Max Parallel Jobs: {maxParallelJobs}
            </label>
            <input
              id="maxParallelJobs"
              type="range"
              min={1}
              max={5}
              value={maxParallelJobs}
              onChange={(e) => setMaxParallelJobs(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Use Watermark */}
          <div className="flex items-center">
            <input
              id="useWatermark"
              type="checkbox"
              checked={useWatermark}
              onChange={(e) => setUseWatermark(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useWatermark" className="ml-2 block text-sm text-gray-700">
              Use watermark (50% discount)
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <ErrorDisplay
              error={error}
              title="Failed to Start Pipeline"
              showDetails={true}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !videoInfo}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Starting Pipeline...' : 'Start Dubbing Pipeline'}
          </button>

          {!videoInfo && (
            <p className="text-sm text-gray-500 text-center">
              Click "Get Estimate" to preview the cost and time before starting
            </p>
          )}
        </form>
      </div>

      {/* Estimate Card */}
      {videoInfo && (
        <div className="mt-6">
          <EstimateCard
            videoInfo={videoInfo}
            config={{
              chunkDuration,
              targetLanguage,
              maxParallelJobs,
              videoQuality: '1080p',
              outputFormat: 'mp4',
              useWatermark,
              keepIntermediateFiles: false,
              chunkingStrategy: 'fixed',
            }}
          />
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              Estimates update automatically as you adjust settings above
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">How it works:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Downloads the YouTube video</li>
          <li>Splits it into manageable chunks</li>
          <li>Processes chunks in parallel with ElevenLabs</li>
          <li>Merges dubbed chunks into final video</li>
          <li>Provides download link when complete</li>
        </ol>
      </div>
    </div>
  );
}
