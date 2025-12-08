/**
 * GET /api/automation/download/[jobId]
 * Download the final dubbed video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAutomationService } from '@/services/automation';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const automationService = getAutomationService();
    const job = await automationService.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'complete') {
      return NextResponse.json(
        { error: `Job is not complete. Current status: ${job.status}` },
        { status: 400 }
      );
    }

    if (!job.outputFile) {
      return NextResponse.json(
        { error: 'Output file not found' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(job.outputFile)) {
      return NextResponse.json(
        { error: 'Output file has been deleted or moved' },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = fs.statSync(job.outputFile);
    const fileSize = stats.size;

    // Create a readable stream
    const fileStream = fs.createReadStream(job.outputFile);

    // Create filename
    const sanitizedTitle = job.videoInfo.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
    const filename = `${sanitizedTitle}_dubbed_${job.config.targetLanguage}.mp4`;

    // Create response with proper headers
    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Length', fileSize.toString());
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache');

    // Convert Node.js stream to Web Stream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          // Handle both string and Buffer types
          const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buffer));
        });

        fileStream.on('end', () => {
          controller.close();
        });

        fileStream.on('error', (error) => {
          console.error('Stream error:', error);
          controller.error(error);
        });
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(webStream, { headers });
  } catch (error) {
    console.error('Error downloading file:', error);

    return NextResponse.json(
      {
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
