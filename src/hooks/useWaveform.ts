/**
 * useWaveform Hook
 *
 * Fetches and caches waveform data for audio clips.
 * Includes loading states and error handling.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { WaveformData } from "@/lib/editor/types";

/**
 * Waveform cache to avoid re-fetching
 */
const waveformCache = new Map<string, WaveformData>();

/**
 * Hook options
 */
interface UseWaveformOptions {
  projectId: string;
  clipId: string;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

/**
 * Hook return type
 */
interface UseWaveformReturn {
  /** Waveform data */
  data: WaveformData | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Manually fetch waveform */
  fetchWaveform: () => Promise<void>;
  /** Clear cached data */
  clearCache: () => void;
}

/**
 * useWaveform hook
 */
export function useWaveform({
  projectId,
  clipId,
  autoFetch = true,
}: UseWaveformOptions): UseWaveformReturn {
  const [data, setData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${projectId}:${clipId}`;

  /**
   * Fetch waveform data
   */
  const fetchWaveform = useCallback(async () => {
    if (!projectId || !clipId) return;

    // Check cache first
    const cached = waveformCache.get(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/editor/project/${projectId}/waveform/${clipId}`
      );
      const result = await response.json();

      if (result.success) {
        const waveformData = result.data;
        setData(waveformData);
        // Cache the result
        waveformCache.set(cacheKey, waveformData);
      } else {
        setError(result.error?.message || "Failed to fetch waveform");
      }
    } catch (err) {
      setError("Network error fetching waveform");
    } finally {
      setLoading(false);
    }
  }, [projectId, clipId, cacheKey]);

  /**
   * Clear cached waveform data
   */
  const clearCache = useCallback(() => {
    waveformCache.delete(cacheKey);
    setData(null);
  }, [cacheKey]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchWaveform();
    }
  }, [autoFetch, fetchWaveform]);

  return {
    data,
    loading,
    error,
    fetchWaveform,
    clearCache,
  };
}

/**
 * Clear all cached waveform data
 */
export function clearAllWaveformCache() {
  waveformCache.clear();
}

/**
 * Pre-fetch and cache waveform data for multiple clips
 */
export async function prefetchWaveforms(
  projectId: string,
  clipIds: string[]
): Promise<void> {
  const promises = clipIds.map(async (clipId) => {
    const cacheKey = `${projectId}:${clipId}`;

    // Skip if already cached
    if (waveformCache.has(cacheKey)) return;

    try {
      const response = await fetch(
        `/api/editor/project/${projectId}/waveform/${clipId}`
      );
      const result = await response.json();

      if (result.success) {
        waveformCache.set(cacheKey, result.data);
      }
    } catch (error) {
      console.error(`Failed to prefetch waveform for ${clipId}:`, error);
    }
  });

  await Promise.all(promises);
}
