/**
 * Dubbing Validator Tests
 *
 * Tests for language validation, URL validation, and dubbing parameters
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DubbingValidator } from '@/services/dubbing/dubbing.validator';
import { InvalidLanguageError, InvalidSourceUrlError } from '@/lib/errors/dubbing.errors';
import { ValidationError } from '@/lib/errors/validation.error';
import { SUPPORTED_LANGUAGES } from '@/services/dubbing/dubbing.types';

describe('DubbingValidator', () => {
  let validator: DubbingValidator;

  beforeEach(() => {
    validator = new DubbingValidator();
  });

  describe('validateLanguage', () => {
    it('should validate supported languages', () => {
      expect(() => {
        validator.validateLanguage('en');
      }).not.toThrow();

      expect(() => {
        validator.validateLanguage('es');
      }).not.toThrow();

      expect(() => {
        validator.validateLanguage('fr');
      }).not.toThrow();

      expect(() => {
        validator.validateLanguage('de');
      }).not.toThrow();
    });

    it('should validate all defined supported languages', () => {
      const languageCodes = Object.keys(SUPPORTED_LANGUAGES);

      languageCodes.forEach(code => {
        expect(() => {
          validator.validateLanguage(code);
        }).not.toThrow();
      });
    });

    it('should throw InvalidLanguageError for unsupported languages', () => {
      expect(() => {
        validator.validateLanguage('unsupported');
      }).toThrow(InvalidLanguageError);

      expect(() => {
        validator.validateLanguage('xx');
      }).toThrow(InvalidLanguageError);

      expect(() => {
        validator.validateLanguage('fake_lang');
      }).toThrow(InvalidLanguageError);
    });

    it('should throw InvalidLanguageError for empty string', () => {
      expect(() => {
        validator.validateLanguage('');
      }).toThrow(InvalidLanguageError);
    });

    it('should be case-sensitive', () => {
      expect(() => {
        validator.validateLanguage('EN'); // Should fail - expects lowercase
      }).toThrow(InvalidLanguageError);

      expect(() => {
        validator.validateLanguage('Es');
      }).toThrow(InvalidLanguageError);
    });
  });

  describe('validateSourceUrl', () => {
    it('should validate HTTP URLs', () => {
      expect(() => {
        validator.validateSourceUrl('http://example.com/video.mp4');
      }).not.toThrow();
    });

    it('should validate HTTPS URLs', () => {
      expect(() => {
        validator.validateSourceUrl('https://example.com/video.mp4');
      }).not.toThrow();

      expect(() => {
        validator.validateSourceUrl('https://storage.example.com/videos/test.mp4');
      }).not.toThrow();
    });

    it('should validate URLs with query parameters', () => {
      expect(() => {
        validator.validateSourceUrl('https://example.com/video.mp4?token=abc123');
      }).not.toThrow();
    });

    it('should validate URLs with ports', () => {
      expect(() => {
        validator.validateSourceUrl('https://example.com:8080/video.mp4');
      }).not.toThrow();
    });

    it('should throw InvalidSourceUrlError for null', () => {
      expect(() => {
        validator.validateSourceUrl(null as any);
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for undefined', () => {
      expect(() => {
        validator.validateSourceUrl(undefined as any);
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for empty string', () => {
      expect(() => {
        validator.validateSourceUrl('');
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for non-string values', () => {
      expect(() => {
        validator.validateSourceUrl(123 as any);
      }).toThrow(InvalidSourceUrlError);

      expect(() => {
        validator.validateSourceUrl({} as any);
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for non-HTTP protocols', () => {
      expect(() => {
        validator.validateSourceUrl('ftp://example.com/video.mp4');
      }).toThrow(InvalidSourceUrlError);

      expect(() => {
        validator.validateSourceUrl('file:///path/to/video.mp4');
      }).toThrow(InvalidSourceUrlError);

      expect(() => {
        validator.validateSourceUrl('data:video/mp4;base64,abc123');
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for relative URLs', () => {
      expect(() => {
        validator.validateSourceUrl('/videos/test.mp4');
      }).toThrow(InvalidSourceUrlError);

      expect(() => {
        validator.validateSourceUrl('video.mp4');
      }).toThrow(InvalidSourceUrlError);
    });

    it('should throw InvalidSourceUrlError for malformed URLs', () => {
      expect(() => {
        validator.validateSourceUrl('not a valid url');
      }).toThrow(InvalidSourceUrlError);

      expect(() => {
        validator.validateSourceUrl('http://');
      }).toThrow(InvalidSourceUrlError);
    });

    it('should handle URLs with special characters', () => {
      expect(() => {
        validator.validateSourceUrl('https://example.com/video%20file.mp4');
      }).not.toThrow();

      expect(() => {
        validator.validateSourceUrl('https://example.com/видео.mp4');
      }).not.toThrow();
    });
  });

  describe('validateDubbingId', () => {
    it('should validate correctly formatted dubbing IDs', () => {
      expect(() => {
        validator.validateDubbingId('dub_abc123');
      }).not.toThrow();

      expect(() => {
        validator.validateDubbingId('dub_xyz789def456');
      }).not.toThrow();

      expect(() => {
        validator.validateDubbingId('dub_12345');
      }).not.toThrow();
    });

    it('should throw ValidationError for IDs without dub_ prefix', () => {
      expect(() => {
        validator.validateDubbingId('abc123');
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateDubbingId('dubbing_123');
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateDubbingId('DUB_123');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for too short IDs', () => {
      expect(() => {
        validator.validateDubbingId('dub_');
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateDubbingId('dub');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for null', () => {
      expect(() => {
        validator.validateDubbingId(null as any);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined', () => {
      expect(() => {
        validator.validateDubbingId(undefined as any);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => {
        validator.validateDubbingId('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string values', () => {
      expect(() => {
        validator.validateDubbingId(123 as any);
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateDubbingId({} as any);
      }).toThrow(ValidationError);
    });
  });

  describe('validateNumSpeakers', () => {
    it('should validate valid speaker counts', () => {
      expect(() => {
        validator.validateNumSpeakers(1);
      }).not.toThrow();

      expect(() => {
        validator.validateNumSpeakers(5);
      }).not.toThrow();

      expect(() => {
        validator.validateNumSpeakers(10);
      }).not.toThrow();
    });

    it('should allow undefined (optional parameter)', () => {
      expect(() => {
        validator.validateNumSpeakers(undefined);
      }).not.toThrow();
    });

    it('should allow null (optional parameter)', () => {
      expect(() => {
        validator.validateNumSpeakers(null as any);
      }).not.toThrow();
    });

    it('should throw ValidationError for zero', () => {
      expect(() => {
        validator.validateNumSpeakers(0);
      }).toThrow(ValidationError);
      expect(() => {
        validator.validateNumSpeakers(0);
      }).toThrow('Number of speakers must be an integer between 1 and 10');
    });

    it('should throw ValidationError for negative numbers', () => {
      expect(() => {
        validator.validateNumSpeakers(-1);
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateNumSpeakers(-10);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for numbers greater than 10', () => {
      expect(() => {
        validator.validateNumSpeakers(11);
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateNumSpeakers(100);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for decimal numbers', () => {
      expect(() => {
        validator.validateNumSpeakers(2.5);
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateNumSpeakers(1.1);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-numeric values', () => {
      expect(() => {
        validator.validateNumSpeakers('5' as any);
      }).toThrow(ValidationError);

      expect(() => {
        validator.validateNumSpeakers({} as any);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for NaN', () => {
      expect(() => {
        validator.validateNumSpeakers(NaN);
      }).toThrow(ValidationError);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = validator.getSupportedLanguages();

      expect(languages).toBeDefined();
      expect(typeof languages).toBe('object');
      expect(Object.keys(languages).length).toBeGreaterThan(0);
    });

    it('should include common languages', () => {
      const languages = validator.getSupportedLanguages();

      expect(languages.en).toBe('English');
      expect(languages.es).toBe('Spanish');
      expect(languages.fr).toBe('French');
      expect(languages.de).toBe('German');
    });

    it('should return a copy, not the original object', () => {
      const languages1 = validator.getSupportedLanguages();
      const languages2 = validator.getSupportedLanguages();

      expect(languages1).not.toBe(languages2); // Different object references
      expect(languages1).toEqual(languages2); // Same content
    });

    it('should match SUPPORTED_LANGUAGES constant', () => {
      const languages = validator.getSupportedLanguages();

      expect(languages).toEqual(SUPPORTED_LANGUAGES);
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(validator.isLanguageSupported('en')).toBe(true);
      expect(validator.isLanguageSupported('es')).toBe(true);
      expect(validator.isLanguageSupported('fr')).toBe(true);
      expect(validator.isLanguageSupported('de')).toBe(true);
      expect(validator.isLanguageSupported('ja')).toBe(true);
      expect(validator.isLanguageSupported('zh')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(validator.isLanguageSupported('unsupported')).toBe(false);
      expect(validator.isLanguageSupported('xx')).toBe(false);
      expect(validator.isLanguageSupported('fake')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validator.isLanguageSupported('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validator.isLanguageSupported('EN')).toBe(false);
      expect(validator.isLanguageSupported('Es')).toBe(false);
    });

    it('should check all supported languages', () => {
      const languageCodes = Object.keys(SUPPORTED_LANGUAGES);

      languageCodes.forEach(code => {
        expect(validator.isLanguageSupported(code)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long dubbing IDs', () => {
      const longId = 'dub_' + 'a'.repeat(1000);
      expect(() => {
        validator.validateDubbingId(longId);
      }).not.toThrow();
    });

    it('should handle URLs with fragments', () => {
      expect(() => {
        validator.validateSourceUrl('https://example.com/video.mp4#section');
      }).not.toThrow();
    });

    it('should handle URLs with authentication', () => {
      expect(() => {
        validator.validateSourceUrl('https://user:pass@example.com/video.mp4');
      }).not.toThrow();
    });

    it('should validate boundary values for speakers', () => {
      expect(() => {
        validator.validateNumSpeakers(1); // Minimum
      }).not.toThrow();

      expect(() => {
        validator.validateNumSpeakers(10); // Maximum
      }).not.toThrow();
    });
  });
});
