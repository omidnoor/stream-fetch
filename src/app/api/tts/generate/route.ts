/**
 * API Route: Generate Speech
 *
 * POST /api/tts/generate
 *
 * Generates speech from text using IndexTTS2 via fal.ai
 *
 * Request Body:
 * {
 *   text: string;              // Required: Text to synthesize
 *   voiceReferenceUrl: string; // Required: URL to voice reference audio
 *   emotionReferenceUrl?: string;   // Optional: URL to emotion reference audio
 *   emotionAlpha?: number;          // Optional: Emotion blend (0-1)
 *   emotionVector?: number[];       // Optional: 8D emotion vector
 *   emotionText?: string;           // Optional: Text description of emotion
 *   emotionMode?: 'speaker' | 'audio' | 'vector' | 'text';
 *   emotionPreset?: string;         // Optional: Preset name (e.g., 'happy')
 *   temperature?: number;           // Optional: Sampling temperature
 *   topP?: number;                  // Optional: Top-p sampling
 *   topK?: number;                  // Optional: Top-k sampling
 *   async?: boolean;                // Optional: Use async generation
 * }
 *
 * Response:
 * - Sync: Returns audio buffer as file download
 * - Async: Returns job ID for status polling
 */

import { NextRequest, NextResponse } from "next/server";
import { getTTSService } from "@/services/tts";
import { errorHandler } from "@/middleware/error-handler";
import { EmotionVector, EMOTION_PRESETS, EmotionPreset } from "@/services/tts/tts.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      voiceReferenceUrl,
      emotionReferenceUrl,
      emotionAlpha,
      emotionVector,
      emotionText,
      emotionMode,
      emotionPreset,
      temperature,
      topP,
      topK,
      outputFormat,
      async: useAsync,
    } = body;

    // Validate required fields
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

    if (!voiceReferenceUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'voiceReferenceUrl is required'
          }
        },
        { status: 400 }
      );
    }

    const ttsService = getTTSService();

    // Handle emotion preset
    let resolvedEmotionVector: EmotionVector | undefined = emotionVector;
    let resolvedEmotionMode = emotionMode;

    if (emotionPreset && !emotionVector) {
      const preset = EMOTION_PRESETS[emotionPreset as EmotionPreset];
      if (preset) {
        resolvedEmotionVector = [...preset] as EmotionVector;
        resolvedEmotionMode = 'vector';
      }
    }

    // Async generation
    if (useAsync) {
      const jobDto = await ttsService.generateSpeechAsync({
        text,
        voiceReferenceUrl,
        emotionReferenceUrl,
        emotionAlpha,
        emotionVector: resolvedEmotionVector,
        emotionText,
        emotionMode: resolvedEmotionMode,
        temperature,
        topP,
        topK,
        outputFormat,
      });

      console.log('[API] TTS async job created:', jobDto.jobId);

      return NextResponse.json({
        success: true,
        data: {
          jobId: jobDto.jobId,
          status: jobDto.status,
          estimatedDuration: jobDto.estimatedDuration,
        },
        message: "TTS job submitted successfully. Poll /api/tts/status for completion."
      });
    }

    // Sync generation
    const audioDto = await ttsService.generateSpeech({
      text,
      voiceReferenceUrl,
      emotionReferenceUrl,
      emotionAlpha,
      emotionVector: resolvedEmotionVector,
      emotionText,
      emotionMode: resolvedEmotionMode,
      temperature,
      topP,
      topK,
      outputFormat,
    });

    console.log('[API] TTS generated:', {
      jobId: audioDto.jobId,
      size: audioDto.audioBuffer.length,
      duration: audioDto.duration,
    });

    // Return audio as file download
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const audioData = new Uint8Array(audioDto.audioBuffer);

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': audioDto.mimeType,
        'Content-Disposition': `attachment; filename="${audioDto.filename}"`,
        'Content-Length': audioDto.audioBuffer.length.toString(),
        'X-TTS-Job-Id': audioDto.jobId,
        'X-TTS-Duration': audioDto.duration.toString(),
      },
    });

  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * GET /api/tts/generate
 *
 * Returns API information and usage examples
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: '/api/tts/generate',
      method: 'POST',
      description: 'Generate speech from text using IndexTTS2',
      parameters: {
        required: {
          text: 'Text to synthesize (max 5000 characters)',
          voiceReferenceUrl: 'URL to voice reference audio (10-15 seconds recommended)',
        },
        optional: {
          emotionReferenceUrl: 'URL to emotion reference audio',
          emotionAlpha: 'Emotion blend factor (0-1, default: 1)',
          emotionVector: '8D emotion vector [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]',
          emotionText: 'Text description of desired emotion',
          emotionMode: 'speaker | audio | vector | text',
          emotionPreset: 'Preset name: happy, sad, angry, calm, excited, etc.',
          temperature: 'Sampling temperature (0-2, default: 0.8)',
          topP: 'Top-p sampling (0-1, default: 0.8)',
          topK: 'Top-k sampling (1-100, default: 30)',
          outputFormat: 'wav | mp3 (default: wav)',
          async: 'Use async generation (default: false)',
        },
      },
      example: {
        text: 'Hello, this is a test of the text-to-speech system.',
        voiceReferenceUrl: 'https://example.com/voice.wav',
        emotionPreset: 'happy',
        emotionAlpha: 0.7,
      },
    },
  });
}
