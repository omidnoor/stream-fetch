/**
 * TTS Service Types
 *
 * DTOs (Data Transfer Objects) and interfaces for IndexTTS2 text-to-speech operations.
 * Supports both local inference and fal.ai cloud API.
 */

/**
 * Emotion dimension indices for the 8D emotion vector
 * [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
 */
export const EMOTION_DIMENSIONS = {
  happy: 0,
  angry: 1,
  sad: 2,
  afraid: 3,
  disgusted: 4,
  melancholic: 5,
  surprised: 6,
  calm: 7,
} as const;

export type EmotionDimension = keyof typeof EMOTION_DIMENSIONS;

/**
 * Preset emotion vectors for common use cases
 */
export const EMOTION_PRESETS = {
  happy: [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  angry: [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  sad: [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  afraid: [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
  disgusted: [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
  melancholic: [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
  surprised: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
  calm: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
  neutral: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  excited: [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.0],
  nervous: [0.0, 0.0, 0.0, 0.6, 0.0, 0.3, 0.0, 0.0],
  frustrated: [0.0, 0.6, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0],
} as const;

export type EmotionPreset = keyof typeof EMOTION_PRESETS;

/**
 * 8-dimensional emotion vector
 * Values should be in range 0.0-1.0 (up to 1.4 accepted but may cause artifacts)
 * System normalizes internally to ensure sum <= 0.8
 */
export type EmotionVector = [number, number, number, number, number, number, number, number];

/**
 * Supported languages for TTS
 */
export const SUPPORTED_TTS_LANGUAGES = {
  en: "English",
  zh: "Chinese (Mandarin)",
  ja: "Japanese",
} as const;

export type SupportedTTSLanguage = keyof typeof SUPPORTED_TTS_LANGUAGES;

/**
 * TTS job status types
 */
export type TTSJobStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Emotion control mode
 */
export type EmotionMode = "speaker" | "audio" | "vector" | "text";

/**
 * Input DTO for generating speech
 */
export interface GenerateSpeechDto {
  /** Text to synthesize */
  text: string;
  /** URL or path to speaker reference audio (10-15 seconds recommended) */
  voiceReferenceUrl: string;
  /** Optional emotion reference audio URL */
  emotionReferenceUrl?: string;
  /** Emotion intensity blend (0.0 = speaker only, 1.0 = full emotion reference) */
  emotionAlpha?: number;
  /** 8-dimensional emotion vector */
  emotionVector?: EmotionVector;
  /** Text description for emotion (e.g., "excited and happy") */
  emotionText?: string;
  /** Emotion control mode */
  emotionMode?: EmotionMode;
  /** Sampling temperature (0.0-1.0) */
  temperature?: number;
  /** Top-p nucleus sampling threshold */
  topP?: number;
  /** Top-k sampling limit */
  topK?: number;
  /** Output format */
  outputFormat?: "wav" | "mp3";
}

/**
 * Response DTO after creating a TTS job
 */
export interface TTSJobDto {
  jobId: string;
  text: string;
  voiceReferenceUrl: string;
  status: TTSJobStatus;
  emotionMode: EmotionMode;
  createdAt: Date;
  estimatedDuration?: number;
}

/**
 * DTO for TTS job status information
 */
export interface TTSStatusDto {
  jobId: string;
  status: TTSJobStatus;
  progress?: number;
  error?: string;
  audioUrl?: string;
  audioDuration?: number;
  completedAt?: Date;
}

/**
 * DTO for generated audio
 */
export interface GeneratedAudioDto {
  jobId: string;
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
  duration: number;
  sampleRate: number;
}

/**
 * Voice reference information
 */
export interface VoiceReferenceDto {
  id: string;
  name: string;
  url: string;
  duration: number;
  language?: SupportedTTSLanguage;
  createdAt: Date;
}

/**
 * Cost estimation for TTS generation
 */
export interface TTSCostEstimate {
  textLength: number;
  estimatedAudioSeconds: number;
  estimatedCostUsd: number;
  provider: "fal" | "local";
}

/**
 * Options for TTSService configuration
 */
export interface TTSServiceOptions {
  /** fal.ai API key (for cloud inference) */
  falApiKey?: string;
  /** Use local inference instead of cloud */
  useLocalInference?: boolean;
  /** Local model checkpoint path */
  modelPath?: string;
  /** Enable response caching */
  enableCaching?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
  /** Default emotion alpha */
  defaultEmotionAlpha?: number;
}

/**
 * fal.ai API request payload
 */
export interface FalTTSRequest {
  audio_url: string;
  prompt: string;
  emotional_audio_url?: string;
  strength?: number;
  emotional_strengths?: {
    happy?: number;
    angry?: number;
    sad?: number;
    afraid?: number;
    disgusted?: number;
    melancholic?: number;
    surprised?: number;
    calm?: number;
  };
  should_use_prompt_for_emotion?: boolean;
  emotion_prompt?: string;
}

/**
 * fal.ai API response
 */
export interface FalTTSResponse {
  audio: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}
