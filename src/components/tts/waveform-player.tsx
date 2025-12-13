"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface WaveformPlayerProps {
  audioUrl: string | null;
  audioBlob?: Blob | null;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  className?: string;
  showControls?: boolean;
  showTime?: boolean;
  showVolume?: boolean;
  autoPlay?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFinish?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({
  audioUrl,
  audioBlob,
  height = 80,
  waveColor = "hsl(var(--muted-foreground))",
  progressColor = "hsl(var(--primary))",
  className,
  showControls = true,
  showTime = true,
  showVolume = true,
  autoPlay = false,
  onReady,
  onPlay,
  onPause,
  onFinish,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      cursorColor: "hsl(var(--primary))",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      backend: "WebAudio",
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
      wavesurfer.setVolume(volume);
      onReady?.();

      if (autoPlay) {
        wavesurfer.play();
      }
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
      onPlay?.();
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
      onPause?.();
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      onFinish?.();
    });

    wavesurfer.on("audioprocess", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("seeking", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [height, waveColor, progressColor, autoPlay, onReady, onPlay, onPause, onFinish]);

  // Load audio when URL or blob changes
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer) return;

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioBlob) {
      wavesurfer.loadBlob(audioBlob);
    } else if (audioUrl) {
      wavesurfer.load(audioUrl);
    }
  }, [audioUrl, audioBlob]);

  // Update volume
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isReady) {
      wavesurfer.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, isReady]);

  const handlePlayPause = useCallback(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isReady) {
      wavesurfer.playPause();
    }
  }, [isReady]);

  const handleRestart = useCallback(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && isReady) {
      wavesurfer.seekTo(0);
      wavesurfer.play();
    }
  }, [isReady]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const hasAudio = audioUrl || audioBlob;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Waveform Container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full rounded-lg overflow-hidden",
          !hasAudio && "bg-surface-2 flex items-center justify-center"
        )}
        style={{ minHeight: height }}
      >
        {!hasAudio && (
          <p className="text-sm text-muted-foreground">No audio loaded</p>
        )}
      </div>

      {/* Controls */}
      {showControls && hasAudio && (
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            disabled={!isReady}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Restart */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            disabled={!isReady}
            className="h-10 w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Time Display */}
          {showTime && (
            <div className="text-sm text-muted-foreground font-mono min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Volume Control */}
          {showVolume && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-24"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
