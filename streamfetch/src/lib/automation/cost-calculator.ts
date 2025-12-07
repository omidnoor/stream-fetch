/**
 * Cost Calculator
 * Handles pricing calculations and time estimates for the automation pipeline
 */

import { CostEstimate, TimeEstimate, PipelineConfig, VideoInfo } from '@/services/automation/automation.types';

// ============================================================================
// Pricing Constants (ElevenLabs - as of 2024)
// ============================================================================

const ELEVENLABS_PRICING = {
  // Base pricing per minute of dubbed audio
  perMinute: 0.24, // $0.24 per minute

  // Watermark discount
  watermarkDiscount: 0.5, // 50% discount with watermark

  // Character limits and pricing tiers
  tiers: {
    free: {
      charactersPerMonth: 10000,
      pricePerCharacter: 0,
    },
    starter: {
      charactersPerMonth: 30000,
      pricePerCharacter: 0.00008,
    },
    creator: {
      charactersPerMonth: 100000,
      pricePerCharacter: 0.00006,
    },
    pro: {
      charactersPerMonth: 500000,
      pricePerCharacter: 0.00004,
    },
  },
};

// ============================================================================
// Time Estimation Constants (average times in seconds)
// ============================================================================

const TIME_ESTIMATES = {
  // Download: typically 30-60s per minute of video
  downloadPerMinute: 45,

  // Chunking: very fast, about 1s per minute of video
  chunkingPerMinute: 1,

  // Dubbing: ElevenLabs processing time + upload/download
  // Typically 2-3x the duration of the audio
  dubbingMultiplier: 2.5,

  // Merging: FFmpeg processing, about 2s per minute
  mergingPerMinute: 2,

  // Finalization: fixed overhead
  finalization: 5,
};

// ============================================================================
// Cost Calculator Class
// ============================================================================

export class CostCalculator {
  /**
   * Calculate cost estimate for a dubbing job
   */
  calculateCost(
    videoInfo: VideoInfo,
    config: PipelineConfig
  ): CostEstimate {
    const durationMinutes = videoInfo.duration / 60;
    const chunks = Math.ceil(videoInfo.duration / config.chunkDuration);

    // Base dubbing cost
    let dubbingCost = durationMinutes * ELEVENLABS_PRICING.perMinute;

    // Apply watermark discount
    if (config.useWatermark) {
      dubbingCost *= (1 - ELEVENLABS_PRICING.watermarkDiscount);
    }

    // Processing cost (minimal, mostly for our server resources)
    const processingCost = 0.01 * chunks; // $0.01 per chunk

    const totalCost = dubbingCost + processingCost;

    return {
      totalCost: Number(totalCost.toFixed(2)),
      costPerChunk: Number((totalCost / chunks).toFixed(2)),
      totalChunks: chunks,
      videoDuration: videoInfo.duration,
      breakdown: {
        dubbingCost: Number(dubbingCost.toFixed(2)),
        processingCost: Number(processingCost.toFixed(2)),
      },
    };
  }

  /**
   * Calculate time estimate for a dubbing job
   */
  calculateTime(
    videoInfo: VideoInfo,
    config: PipelineConfig
  ): TimeEstimate {
    const durationMinutes = videoInfo.duration / 60;
    const chunks = Math.ceil(videoInfo.duration / config.chunkDuration);

    // Download time
    const downloadTime = durationMinutes * TIME_ESTIMATES.downloadPerMinute;

    // Chunking time
    const chunkingTime = durationMinutes * TIME_ESTIMATES.chunkingPerMinute;

    // Dubbing time (parallel processing reduces overall time)
    // If we have 15 chunks and 3 parallel jobs, it takes roughly 5 batches
    const batches = Math.ceil(chunks / config.maxParallelJobs);
    const avgChunkDuration = config.chunkDuration;
    const dubbingTime = batches * avgChunkDuration * TIME_ESTIMATES.dubbingMultiplier;

    // Merging time
    const mergingTime = durationMinutes * TIME_ESTIMATES.mergingPerMinute;

    // Finalization
    const finalizationTime = TIME_ESTIMATES.finalization;

    const totalTime = downloadTime + chunkingTime + dubbingTime + mergingTime + finalizationTime;

    return {
      totalTime: Math.ceil(totalTime),
      breakdown: {
        download: Math.ceil(downloadTime),
        chunking: Math.ceil(chunkingTime),
        dubbing: Math.ceil(dubbingTime),
        merging: Math.ceil(mergingTime),
        finalization: finalizationTime,
      },
    };
  }

  /**
   * Calculate optimal chunk duration based on video length
   */
  calculateOptimalChunkDuration(videoDuration: number): number {
    // For videos under 5 minutes, use 60s chunks
    if (videoDuration < 300) {
      return 60;
    }
    // For videos 5-15 minutes, use 120s chunks
    if (videoDuration < 900) {
      return 120;
    }
    // For videos 15-30 minutes, use 180s chunks
    if (videoDuration < 1800) {
      return 180;
    }
    // For longer videos, use 300s chunks
    return 300;
  }

  /**
   * Calculate number of chunks for a given duration and chunk size
   */
  calculateChunkCount(videoDuration: number, chunkDuration: number): number {
    return Math.ceil(videoDuration / chunkDuration);
  }

  /**
   * Estimate completion time from current progress
   */
  estimateCompletion(
    startedAt: Date,
    currentPercent: number
  ): Date | undefined {
    if (currentPercent <= 0) {
      return undefined;
    }

    const elapsed = Date.now() - startedAt.getTime();
    const estimatedTotal = elapsed / (currentPercent / 100);
    const remaining = estimatedTotal - elapsed;

    return new Date(Date.now() + remaining);
  }

  /**
   * Format cost for display
   */
  formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Format time for display
   */
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes}m`;
      }
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get cost breakdown as percentage
   */
  getCostBreakdownPercentage(estimate: CostEstimate): {
    dubbing: number;
    processing: number;
  } {
    const total = estimate.breakdown.dubbingCost + estimate.breakdown.processingCost;
    return {
      dubbing: Math.round((estimate.breakdown.dubbingCost / total) * 100),
      processing: Math.round((estimate.breakdown.processingCost / total) * 100),
    };
  }

  /**
   * Get time breakdown as percentage
   */
  getTimeBreakdownPercentage(estimate: TimeEstimate): {
    download: number;
    chunking: number;
    dubbing: number;
    merging: number;
    finalization: number;
  } {
    const total = estimate.totalTime;
    return {
      download: Math.round((estimate.breakdown.download / total) * 100),
      chunking: Math.round((estimate.breakdown.chunking / total) * 100),
      dubbing: Math.round((estimate.breakdown.dubbing / total) * 100),
      merging: Math.round((estimate.breakdown.merging / total) * 100),
      finalization: Math.round((estimate.breakdown.finalization / total) * 100),
    };
  }
}

// Export singleton instance
let instance: CostCalculator | null = null;

export function getCostCalculator(): CostCalculator {
  if (!instance) {
    instance = new CostCalculator();
  }
  return instance;
}

export function resetCostCalculator(): void {
  instance = null;
}
