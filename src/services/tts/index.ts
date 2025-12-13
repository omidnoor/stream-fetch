/**
 * TTS Service Module
 *
 * Entry point for IndexTTS2 text-to-speech services.
 * Exports the main service and related types.
 *
 * USAGE:
 * ```typescript
 * import { getTTSService } from '@/services/tts';
 *
 * const ttsService = getTTSService();
 * const audio = await ttsService.generateSpeech({
 *   text: 'Hello, world!',
 *   voiceReferenceUrl: 'https://example.com/voice.wav',
 *   emotionVector: [0.8, 0, 0, 0, 0, 0, 0.2, 0], // happy + surprised
 *   emotionAlpha: 0.7
 * });
 * ```
 */

// Service classes
export { TTSService } from './tts.service';
export { TTSValidator } from './tts.validator';
export { TTSRepository } from './tts.repository';
export { TTSMapper } from './tts.mapper';

// Factory functions
export {
  getTTSService,
  getTTSServiceWithoutCache,
  resetTTSService,
  createTTSService
} from './tts.factory';

// Types and interfaces
export type {
  GenerateSpeechDto,
  TTSJobDto,
  TTSStatusDto,
  GeneratedAudioDto,
  VoiceReferenceDto,
  TTSCostEstimate,
  TTSServiceOptions,
  EmotionVector,
  EmotionMode,
  TTSJobStatus,
  SupportedTTSLanguage,
  EmotionDimension,
  EmotionPreset,
  FalTTSRequest,
  FalTTSResponse,
} from './tts.types';

// Constants
export {
  EMOTION_DIMENSIONS,
  EMOTION_PRESETS,
  SUPPORTED_TTS_LANGUAGES,
} from './tts.types';
