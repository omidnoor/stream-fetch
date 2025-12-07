'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, AlertCircle, Zap, Languages, Settings2 } from 'lucide-react';
import { StartPipelineRequest, StartPipelineResponse, VideoInfo } from '@/services/automation';
import { EstimateCard } from '@/components/automation/EstimateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Automated Dubbing Pipeline</h1>
        <p className="text-muted-foreground">
          Upload a YouTube video and automatically dub it with AI-powered translation and voice synthesis
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-1/10">
              <Zap className="h-5 w-5 text-feature-1" />
            </div>
            <h3 className="font-semibold">Parallel Processing</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Process multiple chunks simultaneously for faster completion
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-2/10">
              <Languages className="h-5 w-5 text-feature-2" />
            </div>
            <h3 className="font-semibold">Multi-Language</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Support for 50+ languages with natural-sounding AI voices
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-3/10">
              <Settings2 className="h-5 w-5 text-feature-3" />
            </div>
            <h3 className="font-semibold">Customizable</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Fine-tune chunk duration, quality, and processing options
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Pipeline Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure your automated dubbing pipeline settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL */}
          <div className="space-y-2">
            <label htmlFor="youtubeUrl" className="text-sm font-medium">
              YouTube URL
            </label>
            <div className="flex gap-2">
              <Input
                id="youtubeUrl"
                type="url"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setVideoInfo(null);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="flex-1"
              />
              <Button
                type="button"
                onClick={fetchVideoInfo}
                disabled={isFetchingInfo || !youtubeUrl.trim()}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isFetchingInfo ? 'Loading...' : 'Get Estimate'}
              </Button>
            </div>
          </div>

          {/* Chunk Duration */}
          <div className="space-y-2">
            <label htmlFor="chunkDuration" className="text-sm font-medium">
              Chunk Duration
            </label>
            <select
              id="chunkDuration"
              value={chunkDuration}
              onChange={(e) => setChunkDuration(Number(e.target.value))}
              className="input-field"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Smaller chunks = faster parallel processing, larger chunks = fewer API calls
            </p>
          </div>

          {/* Target Language */}
          <div className="space-y-2">
            <label htmlFor="targetLanguage" className="text-sm font-medium">
              Target Language
            </label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="input-field"
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="maxParallelJobs" className="text-sm font-medium">
                Max Parallel Jobs
              </label>
              <span className="text-sm font-semibold text-primary">{maxParallelJobs}</span>
            </div>
            <input
              id="maxParallelJobs"
              type="range"
              min={1}
              max={5}
              value={maxParallelJobs}
              onChange={(e) => setMaxParallelJobs(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Higher values = faster processing but increased API costs
            </p>
          </div>

          {/* Use Watermark */}
          <div className="flex items-start gap-3 rounded-lg border border-success/50 bg-success/10 p-4">
            <input
              id="useWatermark"
              type="checkbox"
              checked={useWatermark}
              onChange={(e) => setUseWatermark(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border bg-background accent-primary"
            />
            <div className="flex-1">
              <label htmlFor="useWatermark" className="text-sm font-medium cursor-pointer">
                Use watermark (50% discount)
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Add ElevenLabs watermark to reduce costs by half
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Failed to Start Pipeline</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !videoInfo}
            className="w-full gap-2"
            size="lg"
          >
            {isLoading ? (
              'Starting Pipeline...'
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Dubbing Pipeline
              </>
            )}
          </Button>

          {!videoInfo && (
            <p className="text-sm text-muted-foreground text-center">
              Click "Get Estimate" to preview the cost and time before starting
            </p>
          )}
        </form>
      </div>

      {/* Estimate Card */}
      {videoInfo && (
        <div className="space-y-3">
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
          <p className="text-sm text-muted-foreground text-center">
            Estimates update automatically as you adjust settings above
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">How the Pipeline Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Download Video</h4>
              <p className="text-sm text-muted-foreground">
                Downloads the YouTube video in the highest available quality
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Split into Chunks</h4>
              <p className="text-sm text-muted-foreground">
                Divides the video into manageable chunks based on your configured duration
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Parallel Processing</h4>
              <p className="text-sm text-muted-foreground">
                Processes chunks in parallel with ElevenLabs AI dubbing for faster completion
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h4 className="font-semibold mb-1">Merge & Finalize</h4>
              <p className="text-sm text-muted-foreground">
                Merges all dubbed chunks into the final video and provides a download link
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
