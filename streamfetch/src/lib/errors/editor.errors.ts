/**
 * Video Editor-specific Error Classes
 *
 * These errors represent various failure scenarios in the video editing workflow.
 * Each error maps to an appropriate HTTP status code.
 */

import { AppError } from "./base.error.js";

/**
 * Base error for all editor-related errors
 */
export class EditorError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "EDITOR_ERROR"
  ) {
    super(message, statusCode, code);
  }
}

/**
 * Error thrown when video file is invalid or unsupported
 */
export class InvalidVideoFileError extends AppError {
  constructor(filename: string, reason?: string) {
    super(
      `Invalid video file: ${filename}${reason ? ` - ${reason}` : ""}`,
      400,
      "INVALID_VIDEO_FILE"
    );
  }
}

/**
 * Error thrown when video file exceeds size limit
 */
export class FileSizeExceededError extends AppError {
  constructor(size: number, maxSize: number) {
    super(
      `File size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
      413,
      "FILE_SIZE_EXCEEDED"
    );
  }
}

/**
 * Error thrown when video format is not supported
 */
export class UnsupportedFormatError extends AppError {
  constructor(format: string) {
    super(
      `Unsupported video format: ${format}`,
      400,
      "UNSUPPORTED_FORMAT"
    );
  }
}

/**
 * Error thrown when a project is not found
 */
export class ProjectNotFoundError extends AppError {
  constructor(projectId: string) {
    super(
      `Project not found: ${projectId}`,
      404,
      "PROJECT_NOT_FOUND"
    );
  }
}

/**
 * Error thrown when project data is invalid
 */
export class InvalidProjectDataError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid project data: ${reason}`,
      400,
      "INVALID_PROJECT_DATA"
    );
  }
}

/**
 * Error thrown when timeline data is invalid
 */
export class InvalidTimelineError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid timeline data: ${reason}`,
      400,
      "INVALID_TIMELINE"
    );
  }
}

/**
 * Error thrown when video processing fails
 */
export class VideoProcessingError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `Video processing failed: ${message}`,
      500,
      "VIDEO_PROCESSING_ERROR"
    );

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when FFmpeg operation fails
 */
export class FFmpegError extends AppError {
  constructor(operation: string, message: string, originalError?: Error) {
    super(
      `FFmpeg ${operation} failed: ${message}`,
      500,
      "FFMPEG_ERROR"
    );

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when FFmpeg is not installed or not accessible
 */
export class FFmpegNotFoundError extends AppError {
  constructor() {
    super(
      "FFmpeg is not installed or not accessible. Please install FFmpeg to use video editing features.",
      500,
      "FFMPEG_NOT_FOUND"
    );
  }
}

/**
 * Error thrown when video rendering fails
 */
export class RenderError extends AppError {
  constructor(projectId: string, reason?: string) {
    super(
      `Failed to render project ${projectId}${reason ? `: ${reason}` : ""}`,
      500,
      "RENDER_ERROR"
    );
  }
}

/**
 * Error thrown when export settings are invalid
 */
export class InvalidExportSettingsError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid export settings: ${reason}`,
      400,
      "INVALID_EXPORT_SETTINGS"
    );
  }
}

/**
 * Error thrown when video export fails
 */
export class ExportError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `Export failed: ${message}`,
      500,
      "EXPORT_ERROR"
    );

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Error thrown when file upload fails
 */
export class UploadError extends AppError {
  constructor(filename: string, reason?: string) {
    super(
      `Upload failed for ${filename}${reason ? `: ${reason}` : ""}`,
      500,
      "UPLOAD_ERROR"
    );
  }
}

/**
 * Error thrown when clip operation is invalid
 */
export class InvalidClipOperationError extends AppError {
  constructor(clipId: string, operation: string, reason: string) {
    super(
      `Invalid operation "${operation}" on clip ${clipId}: ${reason}`,
      400,
      "INVALID_CLIP_OPERATION"
    );
  }
}

/**
 * Error thrown when text overlay is invalid
 */
export class InvalidTextOverlayError extends AppError {
  constructor(reason: string) {
    super(
      `Invalid text overlay: ${reason}`,
      400,
      "INVALID_TEXT_OVERLAY"
    );
  }
}

/**
 * Error thrown when effect parameters are invalid
 */
export class InvalidEffectError extends AppError {
  constructor(effectType: string, reason: string) {
    super(
      `Invalid effect "${effectType}": ${reason}`,
      400,
      "INVALID_EFFECT"
    );
  }
}

/**
 * Error thrown when thumbnail generation fails
 */
export class ThumbnailGenerationError extends AppError {
  constructor(videoPath: string, reason?: string) {
    super(
      `Failed to generate thumbnail for ${videoPath}${reason ? `: ${reason}` : ""}`,
      500,
      "THUMBNAIL_GENERATION_ERROR"
    );
  }
}

/**
 * Error thrown when storage operation fails
 */
export class StorageError extends AppError {
  constructor(operation: string, reason: string) {
    super(
      `Storage ${operation} failed: ${reason}`,
      500,
      "STORAGE_ERROR"
    );
  }
}

/**
 * Error thrown when project is in wrong state for operation
 */
export class InvalidProjectStateError extends AppError {
  constructor(projectId: string, currentState: string, expectedState: string) {
    super(
      `Project ${projectId} is in state "${currentState}" but expected "${expectedState}"`,
      409,
      "INVALID_PROJECT_STATE"
    );
  }
}
