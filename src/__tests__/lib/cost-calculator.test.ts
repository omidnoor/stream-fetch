/**
 * Cost Calculator Tests
 *
 * Comprehensive tests for cost and time estimation logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostCalculator, getCostCalculator, resetCostCalculator } from '@/lib/automation/cost-calculator';
import { VideoInfo, PipelineConfig } from '@/services/automation/automation.types';

describe('CostCalculator', () => {
  let calculator: CostCalculator;

  beforeEach(() => {
    resetCostCalculator();
    calculator = new CostCalculator();
  });

  describe('calculateCost', () => {
    it('should calculate cost for a 10-minute video with 60s chunks', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 600, // 10 minutes
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateCost(videoInfo, config);

      expect(estimate.totalChunks).toBe(10); // 600s / 60s = 10 chunks
      expect(estimate.videoDuration).toBe(600);
      expect(estimate.breakdown.dubbingCost).toBe(2.4); // 10 minutes * $0.24
      expect(estimate.breakdown.processingCost).toBe(0.1); // 10 chunks * $0.01
      expect(estimate.totalCost).toBe(2.5); // 2.4 + 0.1
      expect(estimate.costPerChunk).toBe(0.25); // 2.5 / 10
    });

    it('should apply 50% watermark discount', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 600,
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: true, // Enable watermark
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateCost(videoInfo, config);

      expect(estimate.breakdown.dubbingCost).toBe(1.2); // 2.4 * 0.5 (50% discount)
      expect(estimate.breakdown.processingCost).toBe(0.1);
      expect(estimate.totalCost).toBe(1.3); // 1.2 + 0.1
    });

    it('should handle fractional chunks correctly', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 650, // 10 minutes 50 seconds
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateCost(videoInfo, config);

      expect(estimate.totalChunks).toBe(11); // ceil(650 / 60) = 11 chunks
      expect(estimate.breakdown.processingCost).toBe(0.11); // 11 chunks * $0.01
    });

    it('should handle different chunk durations', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 900, // 15 minutes
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config120s: PipelineConfig = {
        chunkDuration: 120,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateCost(videoInfo, config120s);

      expect(estimate.totalChunks).toBe(8); // ceil(900 / 120) = 8 chunks
      expect(estimate.breakdown.processingCost).toBe(0.08);
    });
  });

  describe('calculateTime', () => {
    it('should calculate time for a 10-minute video with 3 parallel jobs', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 600, // 10 minutes
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 3,
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateTime(videoInfo, config);

      // Download: 10 minutes * 45s/min = 450s
      expect(estimate.breakdown.download).toBe(450);

      // Chunking: 10 minutes * 1s/min = 10s
      expect(estimate.breakdown.chunking).toBe(10);

      // Dubbing: 10 chunks / 3 parallel = 4 batches (ceil)
      // 4 batches * 60s chunk * 2.5 multiplier = 600s
      expect(estimate.breakdown.dubbing).toBe(600);

      // Merging: 10 minutes * 2s/min = 20s
      expect(estimate.breakdown.merging).toBe(20);

      // Finalization: 5s
      expect(estimate.breakdown.finalization).toBe(5);

      // Total: 450 + 10 + 600 + 20 + 5 = 1085s
      expect(estimate.totalTime).toBe(1085);
    });

    it('should calculate parallel batches correctly', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 900, // 15 minutes
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 5, // 5 parallel jobs
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateTime(videoInfo, config);

      // 15 chunks / 5 parallel = 3 batches
      // 3 batches * 60s * 2.5 = 450s
      expect(estimate.breakdown.dubbing).toBe(450);
    });

    it('should handle single parallel job correctly', () => {
      const videoInfo: VideoInfo = {
        title: 'Test Video',
        duration: 300, // 5 minutes
        thumbnail: 'https://example.com/thumb.jpg',
        resolution: '1920x1080',
        codec: 'h264',
      };

      const config: PipelineConfig = {
        chunkDuration: 60,
        targetLanguage: 'es',
        maxParallelJobs: 1, // Sequential processing
        videoQuality: '1080p',
        outputFormat: 'mp4',
        useWatermark: false,
        keepIntermediateFiles: false,
        chunkingStrategy: 'fixed',
      };

      const estimate = calculator.calculateTime(videoInfo, config);

      // 5 chunks / 1 parallel = 5 batches
      // 5 batches * 60s * 2.5 = 750s
      expect(estimate.breakdown.dubbing).toBe(750);
    });
  });

  describe('calculateOptimalChunkDuration', () => {
    it('should return 60s for videos under 5 minutes', () => {
      expect(calculator.calculateOptimalChunkDuration(120)).toBe(60);
      expect(calculator.calculateOptimalChunkDuration(299)).toBe(60);
    });

    it('should return 120s for videos 5-15 minutes', () => {
      expect(calculator.calculateOptimalChunkDuration(300)).toBe(120);
      expect(calculator.calculateOptimalChunkDuration(600)).toBe(120);
      expect(calculator.calculateOptimalChunkDuration(899)).toBe(120);
    });

    it('should return 180s for videos 15-30 minutes', () => {
      expect(calculator.calculateOptimalChunkDuration(900)).toBe(180);
      expect(calculator.calculateOptimalChunkDuration(1200)).toBe(180);
      expect(calculator.calculateOptimalChunkDuration(1799)).toBe(180);
    });

    it('should return 300s for videos over 30 minutes', () => {
      expect(calculator.calculateOptimalChunkDuration(1800)).toBe(300);
      expect(calculator.calculateOptimalChunkDuration(3600)).toBe(300);
      expect(calculator.calculateOptimalChunkDuration(7200)).toBe(300);
    });
  });

  describe('calculateChunkCount', () => {
    it('should calculate chunk count correctly', () => {
      expect(calculator.calculateChunkCount(600, 60)).toBe(10);
      expect(calculator.calculateChunkCount(900, 120)).toBe(8);
      expect(calculator.calculateChunkCount(1800, 300)).toBe(6);
    });

    it('should ceil fractional chunks', () => {
      expect(calculator.calculateChunkCount(650, 60)).toBe(11);
      expect(calculator.calculateChunkCount(920, 120)).toBe(8);
      expect(calculator.calculateChunkCount(1810, 300)).toBe(7);
    });
  });

  describe('formatCost', () => {
    it('should format cost with dollar sign and 2 decimals', () => {
      expect(calculator.formatCost(1.5)).toBe('$1.50');
      expect(calculator.formatCost(10)).toBe('$10.00');
      expect(calculator.formatCost(0.99)).toBe('$0.99');
      expect(calculator.formatCost(123.456)).toBe('$123.46');
    });

    it('should handle zero cost', () => {
      expect(calculator.formatCost(0)).toBe('$0.00');
    });
  });

  describe('formatTime', () => {
    it('should format seconds only for times under 1 minute', () => {
      expect(calculator.formatTime(30)).toBe('30s');
      expect(calculator.formatTime(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(calculator.formatTime(60)).toBe('1m');
      expect(calculator.formatTime(90)).toBe('1m 30s');
      expect(calculator.formatTime(125)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(calculator.formatTime(3600)).toBe('1h');
      expect(calculator.formatTime(3660)).toBe('1h 1m');
      expect(calculator.formatTime(5400)).toBe('1h 30m');
      expect(calculator.formatTime(7200)).toBe('2h');
    });
  });

  describe('getCostBreakdownPercentage', () => {
    it('should calculate percentage breakdown', () => {
      const estimate = {
        totalCost: 2.5,
        costPerChunk: 0.25,
        totalChunks: 10,
        videoDuration: 600,
        breakdown: {
          dubbingCost: 2.4,
          processingCost: 0.1,
        },
      };

      const percentages = calculator.getCostBreakdownPercentage(estimate);

      expect(percentages.dubbing).toBe(96); // 2.4 / 2.5 * 100 = 96%
      expect(percentages.processing).toBe(4); // 0.1 / 2.5 * 100 = 4%
    });
  });

  describe('getTimeBreakdownPercentage', () => {
    it('should calculate percentage breakdown for all stages', () => {
      const estimate = {
        totalTime: 1000,
        breakdown: {
          download: 400,
          chunking: 100,
          dubbing: 300,
          merging: 150,
          finalization: 50,
        },
      };

      const percentages = calculator.getTimeBreakdownPercentage(estimate);

      expect(percentages.download).toBe(40);
      expect(percentages.chunking).toBe(10);
      expect(percentages.dubbing).toBe(30);
      expect(percentages.merging).toBe(15);
      expect(percentages.finalization).toBe(5);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getCostCalculator();
      const instance2 = getCostCalculator();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getCostCalculator();
      resetCostCalculator();
      const instance2 = getCostCalculator();

      expect(instance1).not.toBe(instance2);
    });
  });
});
