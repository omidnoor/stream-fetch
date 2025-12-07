/**
 * Dubbing Service Types
 *
 * DTOs (Data Transfer Objects) and interfaces for dubbing operations
 */

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
 * Dubbing job status types
 */
export type DubbingJobStatus = "dubbing" | "dubbed" | "failed";

/**
 * Input DTO for creating a dubbing job
 */
export interface CreateDubbingDto {
  sourceUrl: string;
  targetLanguage: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
  numSpeakers?: number;
  watermark?: boolean;
}

/**
 * Response DTO after creating a dubbing job
 */
export interface DubbingJobDto {
  dubbingId: string;
  sourceUrl: string;
  targetLanguage: string;
  sourceLanguage?: string;
  status: DubbingJobStatus;
  createdAt: Date;
}

/**
 * DTO for dubbing job status information
 */
export interface DubbingStatusDto {
  dubbingId: string;
  status: DubbingJobStatus;
  targetLanguage: string;
  expectedDuration?: number;
  error?: string;
  progressPercent?: number;
}

/**
 * DTO for dubbed audio download
 */
export interface DubbedAudioDto {
  dubbingId: string;
  targetLanguage: string;
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Cost estimation result
 */
export interface DubbingCostEstimate {
  characters: number;
  estimatedDollars: number;
  durationMinutes: number;
  withWatermark: boolean;
}

/**
 * Options for DubbingService configuration
 */
export interface DubbingServiceOptions {
  apiKey?: string;
  enableCaching?: boolean;
  cacheStatusTtl?: number; // in seconds
}
