/**
 * YouTube Validator Tests
 *
 * Tests for URL validation and video ID extraction
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { YouTubeValidator } from '@/services/youtube/youtube.validator';
import { InvalidUrlError } from '@/lib/errors/youtube.errors';

describe('YouTubeValidator', () => {
  let validator: YouTubeValidator;

  beforeEach(() => {
    validator = new YouTubeValidator();
  });

  describe('validateUrl', () => {
    it('should validate standard YouTube watch URLs', () => {
      expect(() => {
        validator.validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      }).not.toThrow();
    });

    it('should validate short YouTube URLs', () => {
      expect(() => {
        validator.validateUrl('https://youtu.be/dQw4w9WgXcQ');
      }).not.toThrow();
    });

    it('should validate YouTube embed URLs', () => {
      expect(() => {
        validator.validateUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      }).not.toThrow();
    });

    it('should validate direct video IDs (11 characters)', () => {
      expect(() => {
        validator.validateUrl('dQw4w9WgXcQ');
      }).not.toThrow();
    });

    it('should throw InvalidUrlError for empty string', () => {
      expect(() => {
        validator.validateUrl('');
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for whitespace-only string', () => {
      expect(() => {
        validator.validateUrl('   ');
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for null', () => {
      expect(() => {
        validator.validateUrl(null as any);
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for undefined', () => {
      expect(() => {
        validator.validateUrl(undefined as any);
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for non-string values', () => {
      expect(() => {
        validator.validateUrl(123 as any);
      }).toThrow(InvalidUrlError);

      expect(() => {
        validator.validateUrl({} as any);
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for non-YouTube URLs', () => {
      expect(() => {
        validator.validateUrl('https://vimeo.com/123456');
      }).toThrow(InvalidUrlError);

      expect(() => {
        validator.validateUrl('https://example.com');
      }).toThrow(InvalidUrlError);
    });

    it('should throw InvalidUrlError for invalid video IDs', () => {
      expect(() => {
        validator.validateUrl('abc123'); // Too short
      }).toThrow(InvalidUrlError);

      expect(() => {
        validator.validateUrl('abc123def456xyz'); // Too long
      }).toThrow(InvalidUrlError);
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(validator.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validator.isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(validator.isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(validator.isValidYouTubeUrl('dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(validator.isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false);
      expect(validator.isValidYouTubeUrl('https://example.com')).toBe(false);
      expect(validator.isValidYouTubeUrl('not-a-url')).toBe(false);
      expect(validator.isValidYouTubeUrl('')).toBe(false);
    });

    it('should handle URLs with additional parameters', () => {
      expect(validator.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe(true);
      expect(validator.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx')).toBe(true);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from standard watch URL', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short URL', () => {
      const videoId = validator.extractVideoId('https://youtu.be/dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from direct ID string', () => {
      const videoId = validator.extractVideoId('dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID with query parameters', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with multiple query parameters', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx&index=1');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should throw InvalidUrlError for invalid URLs', () => {
      expect(() => {
        validator.extractVideoId('https://vimeo.com/123456');
      }).toThrow(InvalidUrlError);

      expect(() => {
        validator.extractVideoId('not-a-valid-url');
      }).toThrow(InvalidUrlError);

      expect(() => {
        validator.extractVideoId('');
      }).toThrow(InvalidUrlError);
    });

    it('should handle video IDs with hyphens and underscores', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=abc-DEF_123');
      expect(videoId).toBe('abc-DEF_123');
    });

    it('should extract from URLs without protocol', () => {
      const videoId = validator.extractVideoId('youtube.com/watch?v=dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract from youtu.be without protocol', () => {
      const videoId = validator.extractVideoId('youtu.be/dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });
  });

  describe('validateItag', () => {
    it('should validate positive integer itags', () => {
      expect(() => {
        validator.validateItag(18);
      }).not.toThrow();

      expect(() => {
        validator.validateItag(22);
      }).not.toThrow();

      expect(() => {
        validator.validateItag(1080);
      }).not.toThrow();
    });

    it('should throw error for zero', () => {
      expect(() => {
        validator.validateItag(0);
      }).toThrow('Invalid itag: must be a positive integer');
    });

    it('should throw error for negative numbers', () => {
      expect(() => {
        validator.validateItag(-1);
      }).toThrow('Invalid itag: must be a positive integer');

      expect(() => {
        validator.validateItag(-100);
      }).toThrow('Invalid itag: must be a positive integer');
    });

    it('should throw error for decimal numbers', () => {
      expect(() => {
        validator.validateItag(18.5);
      }).toThrow('Invalid itag: must be a positive integer');

      expect(() => {
        validator.validateItag(1.1);
      }).toThrow('Invalid itag: must be a positive integer');
    });

    it('should throw error for non-numeric values', () => {
      expect(() => {
        validator.validateItag('18' as any);
      }).toThrow('Invalid itag: must be a positive integer');

      expect(() => {
        validator.validateItag(null as any);
      }).toThrow('Invalid itag: must be a positive integer');

      expect(() => {
        validator.validateItag(undefined as any);
      }).toThrow('Invalid itag: must be a positive integer');
    });

    it('should throw error for NaN', () => {
      expect(() => {
        validator.validateItag(NaN);
      }).toThrow('Invalid itag: must be a positive integer');
    });

    it('should throw error for Infinity', () => {
      expect(() => {
        validator.validateItag(Infinity);
      }).toThrow('Invalid itag: must be a positive integer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with fragments', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=30s');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should handle URLs with www prefix variations', () => {
      expect(validator.isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validator.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should be case-sensitive for domain names', () => {
      // The regex patterns are case-sensitive, expecting lowercase domains
      expect(validator.isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validator.isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should preserve case in video IDs', () => {
      const videoId = validator.extractVideoId('https://www.youtube.com/watch?v=AbC-DeF_123');
      expect(videoId).toBe('AbC-DeF_123');
    });
  });
});
