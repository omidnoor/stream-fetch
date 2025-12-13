/**
 * API Route: TTS Emotion Presets
 *
 * GET /api/tts/presets
 *
 * Returns available emotion presets and their vectors
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     presets: {
 *       happy: [1.0, 0, 0, 0, 0, 0, 0, 0],
 *       sad: [0, 0, 1.0, 0, 0, 0, 0, 0],
 *       ...
 *     },
 *     dimensions: ['happy', 'angry', 'sad', 'afraid', 'disgusted', 'melancholic', 'surprised', 'calm'],
 *     languages: { en: 'English', zh: 'Chinese', ja: 'Japanese' },
 *     limits: {
 *       maxTextLength: 5000,
 *       maxVoiceReferenceDuration: 15,
 *     }
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { getTTSService } from "@/services/tts";
import { EMOTION_DIMENSIONS, EMOTION_PRESETS } from "@/services/tts/tts.types";

export async function GET() {
  try {
    const ttsService = getTTSService();

    const presets = ttsService.getEmotionPresets();
    const languages = ttsService.getSupportedLanguages();
    const maxTextLength = ttsService.getMaxTextLength();

    return NextResponse.json({
      success: true,
      data: {
        presets,
        dimensions: Object.keys(EMOTION_DIMENSIONS),
        dimensionDescriptions: {
          happy: 'Joy, excitement, positive energy',
          angry: 'Anger, frustration, intensity',
          sad: 'Sadness, sorrow, grief',
          afraid: 'Fear, anxiety, nervousness',
          disgusted: 'Disgust, contempt, disapproval',
          melancholic: 'Low mood, depression, wistfulness',
          surprised: 'Surprise, shock, astonishment',
          calm: 'Calm, natural, neutral',
        },
        languages,
        limits: {
          maxTextLength,
          maxVoiceReferenceDuration: 15,
          emotionVectorRange: { min: 0, max: 1.5 },
          emotionAlphaRange: { min: 0, max: 1 },
        },
        tips: [
          'Use emotion vector values between 0.5-0.8 for natural results',
          'Start with emotionAlpha=0.6 and adjust as needed',
          'Voice reference audio should be 10-15 seconds of clear speech',
          'Combine multiple emotions (e.g., happy + surprised = excited)',
          'High values on "surprised" may cause artifacts',
        ],
      },
    });
  } catch (error) {
    console.error('[API] Error getting presets:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get presets'
        }
      },
      { status: 500 }
    );
  }
}
