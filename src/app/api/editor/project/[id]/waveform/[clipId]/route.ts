/**
 * API Route: Waveform Data
 *
 * GET /api/editor/project/[id]/waveform/[clipId] - Get waveform data for a clip
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import { createEmptyWaveform, normalizeWaveformPeaks } from "@/lib/editor/utils";

/**
 * GET - Get waveform data for a clip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clipId: string }> }
) {
  try {
    const { id: projectId, clipId } = await params;

    const editorService = await getEditorService();
    const project = await editorService.getProject(projectId);

    // Find the clip
    const clip = project.timeline.clips.find((c) => c.id === clipId);

    if (!clip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CLIP_NOT_FOUND",
            message: "Clip not found",
          },
        },
        { status: 404 }
      );
    }

    // In a real implementation, we would:
    // 1. Use FFmpeg to extract audio from the source file
    // 2. Generate waveform peaks using FFmpeg or Web Audio API
    // 3. Cache the waveform data for future requests
    //
    // For now, generate placeholder waveform data
    const waveformData = generatePlaceholderWaveform(clip.duration);

    console.log(`[API] Waveform data generated for clip: ${clipId}`);

    return NextResponse.json({
      success: true,
      data: waveformData,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * Generate placeholder waveform data
 * In production, this would be replaced with actual FFmpeg extraction
 */
function generatePlaceholderWaveform(duration: number) {
  const peakCount = 200;
  const peaks: number[] = [];

  // Generate semi-random peaks that look like audio
  for (let i = 0; i < peakCount; i++) {
    const position = i / peakCount;

    // Create some envelope variation
    const envelope = Math.sin(position * Math.PI * 4) * 0.3 + 0.7;

    // Add randomness
    const randomness = Math.random() * 0.5 + 0.5;

    // Combine for realistic-looking waveform
    const peak = envelope * randomness;

    peaks.push(peak);
  }

  // Normalize peaks
  const normalizedPeaks = normalizeWaveformPeaks(peaks);

  return {
    peaks: normalizedPeaks,
    sampleRate: 44100,
    duration,
    channels: 2,
  };
}
