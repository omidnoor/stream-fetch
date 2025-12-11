/**
 * useWaveform Hook
 *
 * Generates waveform data from audio/video files using Web Audio API.
 * Extracts audio peaks for visualization in the timeline.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { WaveformData } from "@/lib/editor/types";
import {
  generateWaveformPeaks,
  normalizeWaveformPeaks,
} from "@/lib/editor/utils";

interface UseWaveformOptions {
  /** Number of peaks to generate (resolution) */
  peakCount?: number;
  /** Whether to auto-generate waveform on mount */
  autoGenerate?: boolean;
}

interface UseWaveformReturn {
  /** Generated waveform data */
  waveformData: WaveformData | null;
  /** Whether waveform is being generated */
  loading: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Function to manually trigger waveform generation */
  generate: () => Promise<void>;
  /** Progress of generation (0-1) */
  progress: number;
}

/**
 * Hook for generating waveform data from audio URL
 */
export function useWaveform(
  audioUrl: string | null | undefined,
  options: UseWaveformOptions = {}
): UseWaveformReturn {
  const { peakCount = 200, autoGenerate = true } = options;

  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Generate waveform from audio URL
   */
  const generate = useCallback(async () => {
    if (!audioUrl) {
      setError("No audio URL provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      setProgress(0.1);

      // Fetch audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      setProgress(0.3);

      // Get array buffer
      const arrayBuffer = await response.arrayBuffer();

      setProgress(0.5);

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      setProgress(0.7);

      // Get audio data from first channel
      const channelData = audioBuffer.getChannelData(0);

      // Generate peaks
      const peaks = generateWaveformPeaks(channelData, peakCount);

      // Normalize peaks to 0-1 range
      const normalizedPeaks = normalizeWaveformPeaks(peaks);

      setProgress(0.9);

      // Create waveform data
      const data: WaveformData = {
        peaks: normalizedPeaks,
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
      };

      setWaveformData(data);
      setProgress(1);

      // Close audio context to free resources
      await audioContext.close();
    } catch (err) {
      console.error("Error generating waveform:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate waveform";
      setError(errorMessage);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }, [audioUrl, peakCount]);

  // Auto-generate waveform when URL changes
  useEffect(() => {
    if (audioUrl && autoGenerate) {
      generate();
    }
  }, [audioUrl, autoGenerate, generate]);

  return {
    waveformData,
    loading,
    error,
    generate,
    progress,
  };
}
