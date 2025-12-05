/**
 * Dubbing Validator
 *
 * Validates input for dubbing operations.
 * Throws typed errors for invalid input.
 */

import { InvalidLanguageError, InvalidSourceUrlError } from '@/lib/errors/dubbing.errors';
import { ValidationError } from '@/lib/errors/validation.error';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './dubbing.types';

export class DubbingValidator {
  /**
   * Validate that a language code is supported
   *
   * @throws InvalidLanguageError if language is not supported
   */
  validateLanguage(languageCode: string): void {
    if (!SUPPORTED_LANGUAGES[languageCode as SupportedLanguage]) {
      throw new InvalidLanguageError(languageCode);
    }
  }

  /**
   * Validate source URL format
   *
   * @throws InvalidSourceUrlError if URL is invalid
   */
  validateSourceUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new InvalidSourceUrlError('Source URL is required');
    }

    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      throw new InvalidSourceUrlError(url);
    }

    // URL must be HTTP or HTTPS
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new InvalidSourceUrlError(url);
    }
  }

  /**
   * Validate dubbing ID format
   *
   * @throws ValidationError if dubbing ID is invalid
   */
  validateDubbingId(dubbingId: string): void {
    if (!dubbingId || typeof dubbingId !== 'string') {
      throw new ValidationError('Dubbing ID is required');
    }

    // ElevenLabs dubbing IDs typically start with "dub_"
    if (!dubbingId.startsWith('dub_')) {
      throw new ValidationError('Invalid dubbing ID format');
    }

    // Must be at least 5 characters (dub_ + something)
    if (dubbingId.length < 5) {
      throw new ValidationError('Invalid dubbing ID format');
    }
  }

  /**
   * Validate number of speakers
   *
   * @throws ValidationError if number is invalid
   */
  validateNumSpeakers(numSpeakers?: number): void {
    if (numSpeakers === undefined || numSpeakers === null) {
      return; // Optional parameter
    }

    if (!Number.isInteger(numSpeakers) || numSpeakers < 1 || numSpeakers > 10) {
      throw new ValidationError('Number of speakers must be an integer between 1 and 10');
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): Record<string, string> {
    return { ...SUPPORTED_LANGUAGES };
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return languageCode in SUPPORTED_LANGUAGES;
  }
}
