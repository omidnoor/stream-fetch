/**
 * Editor Service Factory
 *
 * Creates and manages EditorService instances.
 * Implements singleton pattern for efficiency.
 */

import { EditorService } from "./editor.service";
import { EditorValidator } from "./editor.validator";
import { EditorRepository } from "./editor.repository";
import { EditorMapper } from "./editor.mapper";
import { FFmpegService } from "../ffmpeg/ffmpeg.service";
import { getCacheService } from "@/lib/cache/cache.factory";
import type { EditorServiceOptions } from "./editor.types";

/**
 * Singleton instance of EditorService
 */
let serviceInstance: EditorService | null = null;

/**
 * Get the EditorService instance (with caching)
 *
 * Creates a singleton instance with all dependencies.
 * Uses cache by default for better performance.
 *
 * @param options Optional configuration
 * @returns EditorService instance
 *
 * @example
 * ```typescript
 * const editorService = getEditorService();
 * const project = await editorService.createProject({
 *   name: 'My Video Project',
 *   sourceVideoUrl: 'https://example.com/video.mp4'
 * });
 * ```
 */
export function getEditorService(
  options?: EditorServiceOptions
): EditorService {
  if (!serviceInstance) {
    const validator = new EditorValidator(options?.maxFileSize);
    const repository = new EditorRepository(
      options?.tempDirectory,
      options?.outputDirectory
    );
    const mapper = new EditorMapper();
    const ffmpegService = new FFmpegService();

    // Use cache by default (can be disabled via options)
    const cache =
      options?.enableCaching === false ? undefined : getCacheService();

    serviceInstance = new EditorService(
      validator,
      repository,
      mapper,
      ffmpegService,
      cache
    );

    console.log("[EditorFactory] Created new EditorService instance");
  }

  return serviceInstance;
}

/**
 * Get EditorService instance without caching
 *
 * Useful for testing or when you don't want caching.
 *
 * @param options Optional configuration
 * @returns EditorService instance without cache
 *
 * @example
 * ```typescript
 * const service = getEditorServiceWithoutCache();
 * // All calls will bypass cache
 * ```
 */
export function getEditorServiceWithoutCache(
  options?: EditorServiceOptions
): EditorService {
  const validator = new EditorValidator(options?.maxFileSize);
  const repository = new EditorRepository(
    options?.tempDirectory,
    options?.outputDirectory
  );
  const mapper = new EditorMapper();
  const ffmpegService = new FFmpegService();

  return new EditorService(
    validator,
    repository,
    mapper,
    ffmpegService,
    undefined // No cache
  );
}

/**
 * Reset the singleton instance
 *
 * Useful for testing when you need a fresh instance.
 *
 * @example
 * ```typescript
 * // In test setup
 * beforeEach(() => {
 *   resetEditorService();
 * });
 * ```
 */
export function resetEditorService(): void {
  serviceInstance = null;
  console.log("[EditorFactory] Reset EditorService instance");
}

/**
 * Create a custom EditorService with specific dependencies
 *
 * Advanced usage for dependency injection in tests.
 *
 * @param validator Custom validator instance
 * @param repository Custom repository instance
 * @param mapper Custom mapper instance
 * @param ffmpegService Custom FFmpeg service instance
 * @param cache Optional cache service
 * @returns Custom EditorService instance
 *
 * @example
 * ```typescript
 * // In tests with mocks
 * const mockRepo = new MockEditorRepository();
 * const service = createEditorService(
 *   new EditorValidator(),
 *   mockRepo,
 *   new EditorMapper(),
 *   new FFmpegService()
 * );
 * ```
 */
export function createEditorService(
  validator: EditorValidator,
  repository: EditorRepository,
  mapper: EditorMapper,
  ffmpegService: FFmpegService,
  cache?: any
): EditorService {
  return new EditorService(
    validator,
    repository,
    mapper,
    ffmpegService,
    cache
  );
}

/**
 * Initialize the editor service
 *
 * Should be called once at application startup.
 *
 * @param options Optional configuration
 * @returns Initialized EditorService instance
 *
 * @example
 * ```typescript
 * // In server startup
 * await initializeEditorService({
 *   maxFileSize: 500 * 1024 * 1024, // 500MB
 *   tempDirectory: '/tmp/editor',
 *   outputDirectory: '/var/output/editor'
 * });
 * ```
 */
export async function initializeEditorService(
  options?: EditorServiceOptions
): Promise<EditorService> {
  const service = getEditorService(options);
  await service.initialize();
  console.log("[EditorFactory] EditorService initialized");
  return service;
}
