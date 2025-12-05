/**
 * ElevenLabs API Helper
 *
 * This module provides utility functions to interact with ElevenLabs API
 * for video dubbing functionality.
 *
 * Features:
 * - Dub videos to multiple languages
 * - Track dubbing progress
 * - Download dubbed audio/video
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

/**
 * Initialize ElevenLabs client with API key from environment
 */
export function getElevenLabsClient() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
  }

  return new ElevenLabsClient({ apiKey });
}

/**
 * Supported languages for dubbing
 */
export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  pl: "Polish",
  tr: "Turkish",
  ru: "Russian",
  nl: "Dutch",
  cs: "Czech",
  ar: "Arabic",
  zh: "Chinese (Simplified)",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  uk: "Ukrainian",
  id: "Indonesian",
  ms: "Malay",
  th: "Thai",
  vi: "Vietnamese",
  fil: "Filipino",
  sv: "Swedish",
  bg: "Bulgarian",
  ro: "Romanian",
  el: "Greek",
  sk: "Slovak",
  hr: "Croatian",
  ta: "Tamil",
  hu: "Hungarian"
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Options for dubbing a video
 */
export interface DubbingOptions {
  sourceUrl: string;           // URL of the video to dub
  targetLanguage: SupportedLanguage;  // Target language code
  sourceLanguage?: SupportedLanguage; // Source language (auto-detected if not provided)
  numSpeakers?: number;        // Number of speakers in the video
  watermark?: boolean;         // Include watermark (false = uses more credits)
}

/**
 * Dubbing job status response
 */
export interface DubbingStatus {
  dubbingId: string;
  status: "dubbing" | "dubbed" | "failed";
  targetLanguage: string;
  expectedDuration?: number;
  error?: string;
}

/**
 * Create a dubbing job
 *
 * @param options - Dubbing configuration options
 * @returns Dubbing job ID for tracking progress
 *
 * @example
 * ```ts
 * const dubbingId = await createDubbingJob({
 *   sourceUrl: "https://example.com/video.mp4",
 *   targetLanguage: "es",
 *   watermark: true
 * });
 * ```
 */
export async function createDubbingJob(options: DubbingOptions): Promise<string> {
  const client = getElevenLabsClient();

  try {
    // Type assertion to handle SDK API changes
    const response = await (client.dubbing as any).dubAVideoOrAnAudioFile({
      source_url: options.sourceUrl,
      target_lang: options.targetLanguage,
      source_lang: options.sourceLanguage,
      num_speakers: options.numSpeakers,
      watermark: options.watermark ?? true, // Use watermark by default to save credits
    });

    return response.dubbing_id;
  } catch (error) {
    console.error("Error creating dubbing job:", error);
    throw new Error(`Failed to create dubbing job: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check the status of a dubbing job
 *
 * @param dubbingId - The dubbing job ID
 * @returns Current status of the dubbing job
 *
 * @example
 * ```ts
 * const status = await getDubbingStatus("dub_123abc");
 * if (status.status === "dubbed") {
 *   console.log("Dubbing complete!");
 * }
 * ```
 */
export async function getDubbingStatus(dubbingId: string): Promise<DubbingStatus> {
  const client = getElevenLabsClient();

  try {
    // Type assertion to handle SDK API changes
    const response = await (client.dubbing as any).getDubbingProjectMetadata(dubbingId);

    return {
      dubbingId,
      status: response.status as "dubbing" | "dubbed" | "failed",
      targetLanguage: response.target_language || "unknown",
      expectedDuration: response.expected_duration_sec,
      error: response.error_message,
    };
  } catch (error) {
    console.error("Error checking dubbing status:", error);
    throw new Error(`Failed to get dubbing status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Download the dubbed audio file
 *
 * @param dubbingId - The dubbing job ID
 * @param targetLanguage - Target language code
 * @returns Audio buffer of the dubbed content
 *
 * @example
 * ```ts
 * const audioBuffer = await downloadDubbedAudio("dub_123abc", "es");
 * // Save to file or stream to client
 * ```
 */
export async function downloadDubbedAudio(
  dubbingId: string,
  targetLanguage: SupportedLanguage
): Promise<Buffer> {
  const client = getElevenLabsClient();

  try {
    // Type assertion to handle SDK API changes
    const response = await (client.dubbing as any).getTranscriptForDub(dubbingId, targetLanguage);

    // The response will be a stream or buffer depending on the SDK version
    // Convert to Buffer if needed
    if (Buffer.isBuffer(response)) {
      return response;
    }

    // If it's a readable stream, convert to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response as any) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading dubbed audio:", error);
    throw new Error(`Failed to download dubbed audio: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Estimate the cost of dubbing based on video duration
 *
 * @param durationSeconds - Duration of the video in seconds
 * @param withWatermark - Whether to include watermark (cheaper)
 * @returns Estimated cost in credits/characters
 *
 * Note: Actual costs may vary. Check ElevenLabs pricing for exact rates.
 */
export function estimateDubbingCost(durationSeconds: number, withWatermark: boolean = true): {
  characters: number;
  estimatedDollars: number;
} {
  // ElevenLabs charges based on duration
  // With watermark: ~2000 chars/min
  // Without watermark: ~3000 chars/min
  const charsPerMinute = withWatermark ? 2000 : 3000;
  const minutes = durationSeconds / 60;
  const characters = Math.ceil(minutes * charsPerMinute);

  // Rough cost estimate (varies by plan)
  // Average: $0.24 - $0.60 per minute
  const costPerMinute = 0.42; // Mid-range estimate
  const estimatedDollars = minutes * costPerMinute;

  return {
    characters,
    estimatedDollars: parseFloat(estimatedDollars.toFixed(2))
  };
}
