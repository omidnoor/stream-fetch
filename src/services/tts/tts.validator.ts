/**
 * TTS Validator
 *
 * Validates input for TTS operations.
 * Throws typed errors for invalid input.
 */

import {
  InvalidVoiceReferenceError,
  InvalidTextInputError,
  InvalidEmotionVectorError,
  TextTooLongError,
} from '@/lib/errors/tts.errors';
import { ValidationError } from '@/lib/errors/validation.error';
import {
  EmotionVector,
  EmotionMode,
  EMOTION_PRESETS,
  EmotionPreset,
  SUPPORTED_TTS_LANGUAGES,
  SupportedTTSLanguage,
} from './tts.types';

/** Maximum text length in characters */
const MAX_TEXT_LENGTH = 5000;

/** Maximum voice reference duration in seconds */
const MAX_VOICE_REFERENCE_DURATION = 15;

/** Minimum voice reference duration in seconds */
const MIN_VOICE_REFERENCE_DURATION = 1;

/** Valid audio formats for voice reference */
const VALID_AUDIO_FORMATS = ['wav', 'mp3', 'flac', 'm4a', 'ogg', 'webm'];

export class TTSValidator {
  /**
   * Validate text input for TTS generation
   *
   * @throws InvalidTextInputError if text is invalid
   * @throws TextTooLongError if text exceeds maximum length
   */
  validateText(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new InvalidTextInputError('Text is required');
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      throw new InvalidTextInputError('Text cannot be empty');
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      throw new TextTooLongError(trimmedText.length, MAX_TEXT_LENGTH);
    }
  }

  /**
   * Validate voice reference URL or path
   *
   * @throws InvalidVoiceReferenceError if reference is invalid
   */
  validateVoiceReference(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new InvalidVoiceReferenceError('Voice reference URL is required');
    }

    // Check if it's a valid URL or file path
    try {
      new URL(url);
    } catch {
      // Not a URL, check if it looks like a file path
      if (!url.startsWith('/') && !url.match(/^[a-zA-Z]:\\/)) {
        throw new InvalidVoiceReferenceError('Invalid URL or file path format');
      }
    }

    // Check for valid audio extension
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension && !VALID_AUDIO_FORMATS.includes(extension)) {
      throw new InvalidVoiceReferenceError(
        `Unsupported audio format: ${extension}. Supported formats: ${VALID_AUDIO_FORMATS.join(', ')}`
      );
    }
  }

  /**
   * Validate emotion vector
   *
   * @throws InvalidEmotionVectorError if vector is invalid
   */
  validateEmotionVector(vector: EmotionVector): void {
    if (!Array.isArray(vector)) {
      throw new InvalidEmotionVectorError('Emotion vector must be an array');
    }

    if (vector.length !== 8) {
      throw new InvalidEmotionVectorError(
        `Emotion vector must have exactly 8 dimensions, got ${vector.length}`
      );
    }

    for (let i = 0; i < vector.length; i++) {
      const value = vector[i];

      if (typeof value !== 'number' || isNaN(value)) {
        throw new InvalidEmotionVectorError(
          `Dimension ${i} must be a number, got ${typeof value}`
        );
      }

      if (value < 0 || value > 1.5) {
        throw new InvalidEmotionVectorError(
          `Dimension ${i} must be between 0 and 1.5, got ${value}`
        );
      }
    }

    // Warn if sum is too high (may cause artifacts)
    const sum = vector.reduce((a, b) => a + b, 0);
    if (sum > 1.5) {
      console.warn(
        `[TTSValidator] Emotion vector sum (${sum.toFixed(2)}) exceeds 1.5, may cause artifacts`
      );
    }
  }

  /**
   * Validate emotion alpha (blend factor)
   *
   * @throws ValidationError if alpha is invalid
   */
  validateEmotionAlpha(alpha: number): void {
    if (typeof alpha !== 'number' || isNaN(alpha)) {
      throw new ValidationError('Emotion alpha must be a number');
    }

    if (alpha < 0 || alpha > 1) {
      throw new ValidationError('Emotion alpha must be between 0 and 1');
    }
  }

  /**
   * Validate emotion mode
   *
   * @throws ValidationError if mode is invalid
   */
  validateEmotionMode(mode: string): void {
    const validModes: EmotionMode[] = ['speaker', 'audio', 'vector', 'text'];

    if (!validModes.includes(mode as EmotionMode)) {
      throw new ValidationError(
        `Invalid emotion mode: ${mode}. Valid modes: ${validModes.join(', ')}`
      );
    }
  }

  /**
   * Validate job ID format
   *
   * @throws ValidationError if job ID is invalid
   */
  validateJobId(jobId: string): void {
    if (!jobId || typeof jobId !== 'string') {
      throw new ValidationError('Job ID is required');
    }

    if (jobId.length < 5) {
      throw new ValidationError('Invalid job ID format');
    }
  }

  /**
   * Validate generation parameters
   *
   * @throws ValidationError if parameters are invalid
   */
  validateGenerationParams(params: {
    temperature?: number;
    topP?: number;
    topK?: number;
  }): void {
    if (params.temperature !== undefined) {
      if (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 2) {
        throw new ValidationError('Temperature must be between 0 and 2');
      }
    }

    if (params.topP !== undefined) {
      if (typeof params.topP !== 'number' || params.topP < 0 || params.topP > 1) {
        throw new ValidationError('Top-p must be between 0 and 1');
      }
    }

    if (params.topK !== undefined) {
      if (!Number.isInteger(params.topK) || params.topK < 1 || params.topK > 100) {
        throw new ValidationError('Top-k must be an integer between 1 and 100');
      }
    }
  }

  /**
   * Get emotion vector from preset name
   */
  getEmotionPreset(presetName: string): EmotionVector | null {
    const preset = EMOTION_PRESETS[presetName as EmotionPreset];
    return preset ? ([...preset] as EmotionVector) : null;
  }

  /**
   * Get list of available emotion presets
   */
  getAvailablePresets(): string[] {
    return Object.keys(EMOTION_PRESETS);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Record<string, string> {
    return { ...SUPPORTED_TTS_LANGUAGES };
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return languageCode in SUPPORTED_TTS_LANGUAGES;
  }

  /**
   * Get maximum text length
   */
  getMaxTextLength(): number {
    return MAX_TEXT_LENGTH;
  }

  /**
   * Get maximum voice reference duration
   */
  getMaxVoiceReferenceDuration(): number {
    return MAX_VOICE_REFERENCE_DURATION;
  }
}
