/**
 * POST /api/automation/start
 * Start a new automation pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationService } from '@/services/automation';
import { getCostCalculator } from '@/lib/automation/cost-calculator';
import type { StartPipelineRequest, StartPipelineResponse, PipelineConfig } from '@/services/automation';

export async function POST(request: NextRequest) {
  try {
    const body: StartPipelineRequest = await request.json();

    // Validate request
    if (!body.youtubeUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    if (!body.config) {
      return NextResponse.json(
        { error: 'Pipeline configuration is required' },
        { status: 400 }
      );
    }

    // Validate config
    const config: PipelineConfig = {
      chunkDuration: body.config.chunkDuration || 60,
      targetLanguage: body.config.targetLanguage || 'es',
      maxParallelJobs: body.config.maxParallelJobs || 3,
      videoQuality: body.config.videoQuality || '1080p',
      outputFormat: body.config.outputFormat || 'mp4',
      useWatermark: body.config.useWatermark ?? false,
      keepIntermediateFiles: body.config.keepIntermediateFiles ?? false,
      chunkingStrategy: body.config.chunkingStrategy || 'fixed',
    };

    // Validate chunk duration
    if (![30, 60, 120, 300].includes(config.chunkDuration)) {
      return NextResponse.json(
        { error: 'Chunk duration must be 30, 60, 120, or 300 seconds' },
        { status: 400 }
      );
    }

    // Validate max parallel jobs
    if (config.maxParallelJobs < 1 || config.maxParallelJobs > 5) {
      return NextResponse.json(
        { error: 'Max parallel jobs must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Start pipeline
    const automationService = getAutomationService();
    const jobId = await automationService.startPipeline(body.youtubeUrl, config);

    // Get job to calculate estimates
    const job = await automationService.getJobStatus(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Calculate estimates
    const costCalculator = getCostCalculator();
    const costEstimate = costCalculator.calculateCost(job.videoInfo, config);
    const timeEstimate = costCalculator.calculateTime(job.videoInfo, config);

    const response: StartPipelineResponse = {
      jobId,
      status: job.status,
      estimatedTime: timeEstimate.totalTime,
      estimatedCost: costEstimate.totalCost,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting pipeline:', error);

    return NextResponse.json(
      {
        error: 'Failed to start pipeline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
