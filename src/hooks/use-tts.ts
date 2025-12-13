"use client";

import { useState, useCallback } from "react";
import type { EmotionVector, EmotionMode, EmotionPreset } from "@/services/tts/tts.types";

interface TTSGenerateParams {
  text: string;
  voiceReferenceUrl: string;
  emotionReferenceUrl?: string;
  emotionAlpha?: number;
  emotionVector?: EmotionVector;
  emotionText?: string;
  emotionMode?: EmotionMode;
  emotionPreset?: EmotionPreset;
  temperature?: number;
  topP?: number;
  topK?: number;
  outputFormat?: "wav" | "mp3";
  async?: boolean;
}

interface TTSJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  audioUrl?: string;
  error?: string;
  completedAt?: string;
}

interface TTSPresets {
  presets: Record<string, number[]>;
  dimensions: string[];
  dimensionDescriptions: Record<string, string>;
  languages: Record<string, string>;
  limits: {
    maxTextLength: number;
    maxVoiceReferenceDuration: number;
    emotionVectorRange: { min: number; max: number };
    emotionAlphaRange: { min: number; max: number };
  };
  tips: string[];
}

interface CostEstimate {
  textLength: number;
  estimatedAudioSeconds: number;
  estimatedCostUsd: number;
  provider: string;
}

interface UseTTSResult {
  // State
  isGenerating: boolean;
  isPolling: boolean;
  error: string | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  jobStatus: TTSJobStatus | null;
  presets: TTSPresets | null;
  costEstimate: CostEstimate | null;

  // Actions
  generateSpeech: (params: TTSGenerateParams) => Promise<Blob | null>;
  generateSpeechAsync: (params: TTSGenerateParams) => Promise<string | null>;
  pollJobStatus: (jobId: string) => Promise<TTSJobStatus | null>;
  downloadAudio: (jobId: string) => Promise<Blob | null>;
  fetchPresets: () => Promise<TTSPresets | null>;
  estimateCost: (text: string) => Promise<CostEstimate | null>;
  reset: () => void;
}

export function useTTS(): UseTTSResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<TTSJobStatus | null>(null);
  const [presets, setPresets] = useState<TTSPresets | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setJobStatus(null);
    setCostEstimate(null);
  }, [audioUrl]);

  const generateSpeech = useCallback(async (params: TTSGenerateParams): Promise<Blob | null> => {
    setIsGenerating(true);
    setError(null);
    reset();

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, async: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate speech");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);

      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [reset]);

  const generateSpeechAsync = useCallback(async (params: TTSGenerateParams): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);
    reset();

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, async: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to submit job");
      }

      const data = await response.json();
      const jobId = data.data?.jobId;

      if (jobId) {
        setJobStatus({
          jobId,
          status: "pending",
          progress: 0,
        });
      }

      return jobId || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [reset]);

  const pollJobStatus = useCallback(async (jobId: string): Promise<TTSJobStatus | null> => {
    setIsPolling(true);

    try {
      const response = await fetch(`/api/tts/status?jobId=${encodeURIComponent(jobId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get status");
      }

      const data = await response.json();
      const status = data.data as TTSJobStatus;

      setJobStatus(status);

      if (status.status === "failed") {
        setError(status.error || "Job failed");
      }

      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsPolling(false);
    }
  }, []);

  const downloadAudio = useCallback(async (jobId: string): Promise<Blob | null> => {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/tts/download?jobId=${encodeURIComponent(jobId)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to download audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);

      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const fetchPresets = useCallback(async (): Promise<TTSPresets | null> => {
    try {
      const response = await fetch("/api/tts/presets");

      if (!response.ok) {
        throw new Error("Failed to fetch presets");
      }

      const data = await response.json();
      const presetsData = data.data as TTSPresets;

      setPresets(presetsData);
      return presetsData;
    } catch (err) {
      console.error("Failed to fetch presets:", err);
      return null;
    }
  }, []);

  const estimateCost = useCallback(async (text: string): Promise<CostEstimate | null> => {
    try {
      const response = await fetch("/api/tts/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to estimate cost");
      }

      const data = await response.json();
      const estimate = data.data as CostEstimate;

      setCostEstimate(estimate);
      return estimate;
    } catch (err) {
      console.error("Failed to estimate cost:", err);
      return null;
    }
  }, []);

  return {
    isGenerating,
    isPolling,
    error,
    audioBlob,
    audioUrl,
    jobStatus,
    presets,
    costEstimate,
    generateSpeech,
    generateSpeechAsync,
    pollJobStatus,
    downloadAudio,
    fetchPresets,
    estimateCost,
    reset,
  };
}
