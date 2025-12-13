/**
 * API Route: TTS Cost Estimation
 *
 * POST /api/tts/estimate
 *
 * Estimate the cost of generating speech for given text
 *
 * Request Body:
 * {
 *   text: string;            // Required: Text to estimate
 *   provider?: 'fal' | 'local';  // Optional: Provider (default: 'fal')
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     textLength: number,
 *     estimatedAudioSeconds: number,
 *     estimatedCostUsd: number,
 *     provider: string,
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getTTSService } from "@/services/tts";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, provider = 'fal' } = body;

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'text is required'
          }
        },
        { status: 400 }
      );
    }

    const ttsService = getTTSService();
    const estimate = ttsService.estimateCost(text, provider);

    console.log('[API] TTS cost estimate:', {
      textLength: estimate.textLength,
      estimatedCost: estimate.estimatedCostUsd,
    });

    return NextResponse.json({
      success: true,
      data: estimate,
    });

  } catch (error) {
    return errorHandler(error);
  }
}
