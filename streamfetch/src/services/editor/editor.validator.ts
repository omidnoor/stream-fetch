/**
 * Editor Validator
 *
 * Validates input for video editing operations.
 * Throws typed errors for invalid input.
 *
 * EDUCATIONAL NOTE:
 * Single Responsibility - This class ONLY validates input.
 * No business logic, no API calls, just validation.
 */

import {
  InvalidVideoFileError,
  FileSizeExceededError,
  UnsupportedFormatError,
  InvalidProjectDataError,
  InvalidTimelineError,
  InvalidExportSettingsError,
  InvalidTextOverlayError,
  InvalidEffectError,
} from "@/lib/errors/editor.errors.js";
import { ValidationError } from "@/lib/errors/validation.error.js";
import type {
  CreateProjectDto,
  UpdateProjectDto,
  AddClipDto,
  AddTextDto,
  ExportSettings,
  TimelineData,
  VideoFormat,
  VideoQuality,
  TextOverlay,
  Effect,
} from "./editor.types.js";

/**
 * Supported video formats
 */
const SUPPORTED_VIDEO_FORMATS = ["mp4", "webm", "mov", "avi", "mkv", "flv"];

/**
 * Supported video MIME types
 */
const SUPPORTED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-flv",
];

/**
 * Maximum file size (500MB by default)
 */
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

/**
 * Valid video quality settings
 */
const VALID_QUALITIES: VideoQuality[] = ["low", "medium", "high", "ultra"];

/**
 * Valid export formats
 */
const VALID_EXPORT_FORMATS: VideoFormat[] = ["mp4", "webm", "mov", "avi"];

export class EditorValidator {
  constructor(private maxFileSize: number = DEFAULT_MAX_FILE_SIZE) {}

  /**
   * Validate video file
   *
   * @throws InvalidVideoFileError if file is invalid
   * @throws FileSizeExceededError if file is too large
   * @throws UnsupportedFormatError if format is not supported
   */
  validateVideoFile(file: {
    name: string;
    size: number;
    type?: string;
  }): void {
    // Check file name
    if (!file.name || typeof file.name !== "string") {
      throw new InvalidVideoFileError("", "File name is required");
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new FileSizeExceededError(file.size, this.maxFileSize);
    }

    // Check file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !SUPPORTED_VIDEO_FORMATS.includes(extension)) {
      throw new UnsupportedFormatError(extension || "unknown");
    }

    // Check MIME type if provided
    if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
      throw new UnsupportedFormatError(file.type);
    }
  }

  /**
   * Validate video URL
   *
   * @throws ValidationError if URL is invalid
   */
  validateVideoUrl(url: string): void {
    if (!url || typeof url !== "string") {
      throw new ValidationError("Video URL is required");
    }

    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      throw new ValidationError(`Invalid video URL: ${url}`);
    }

    // URL must be HTTP or HTTPS
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new ValidationError("Video URL must use HTTP or HTTPS protocol");
    }
  }

  /**
   * Validate project ID format
   *
   * @throws ValidationError if project ID is invalid
   */
  validateProjectId(projectId: string): void {
    if (!projectId || typeof projectId !== "string") {
      throw new ValidationError("Project ID is required");
    }

    // Must be a valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      throw new ValidationError("Invalid project ID format");
    }
  }

  /**
   * Validate create project data
   *
   * @throws InvalidProjectDataError if data is invalid
   */
  validateCreateProject(data: CreateProjectDto): void {
    if (!data.name || typeof data.name !== "string") {
      throw new InvalidProjectDataError("Project name is required");
    }

    if (data.name.trim().length === 0) {
      throw new InvalidProjectDataError("Project name cannot be empty");
    }

    if (data.name.length > 100) {
      throw new InvalidProjectDataError(
        "Project name must be 100 characters or less"
      );
    }

    // Validate source video URL if provided
    if (data.sourceVideoUrl) {
      this.validateVideoUrl(data.sourceVideoUrl);
    }

    // Validate settings if provided
    if (data.settings) {
      if (data.settings.resolution) {
        this.validateResolution(data.settings.resolution);
      }

      if (
        data.settings.frameRate !== undefined &&
        (data.settings.frameRate <= 0 || data.settings.frameRate > 120)
      ) {
        throw new InvalidProjectDataError(
          "Frame rate must be between 1 and 120"
        );
      }
    }
  }

  /**
   * Validate update project data
   *
   * @throws InvalidProjectDataError if data is invalid
   */
  validateUpdateProject(data: UpdateProjectDto): void {
    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim().length === 0) {
        throw new InvalidProjectDataError("Project name cannot be empty");
      }

      if (data.name.length > 100) {
        throw new InvalidProjectDataError(
          "Project name must be 100 characters or less"
        );
      }
    }

    if (data.timeline) {
      this.validateTimeline(data.timeline);
    }

    if (data.settings?.resolution) {
      this.validateResolution(data.settings.resolution);
    }
  }

  /**
   * Validate timeline data
   *
   * @throws InvalidTimelineError if timeline is invalid
   */
  validateTimeline(timeline: TimelineData): void {
    if (!timeline || typeof timeline !== "object") {
      throw new InvalidTimelineError("Timeline data is required");
    }

    if (!Array.isArray(timeline.clips)) {
      throw new InvalidTimelineError("Timeline clips must be an array");
    }

    if (!Array.isArray(timeline.audioTracks)) {
      throw new InvalidTimelineError("Timeline audio tracks must be an array");
    }

    if (!Array.isArray(timeline.textOverlays)) {
      throw new InvalidTimelineError("Timeline text overlays must be an array");
    }

    if (!Array.isArray(timeline.transitions)) {
      throw new InvalidTimelineError("Timeline transitions must be an array");
    }

    if (typeof timeline.duration !== "number" || timeline.duration < 0) {
      throw new InvalidTimelineError("Timeline duration must be a positive number");
    }

    // Validate each clip
    timeline.clips.forEach((clip, index) => {
      if (!clip.id || !clip.sourceUrl) {
        throw new InvalidTimelineError(`Clip at index ${index} is missing required fields`);
      }

      if (clip.startTime < 0 || clip.endTime <= clip.startTime) {
        throw new InvalidTimelineError(
          `Clip at index ${index} has invalid time range`
        );
      }

      if (clip.volume < 0 || clip.volume > 1) {
        throw new InvalidTimelineError(
          `Clip at index ${index} has invalid volume (must be 0-1)`
        );
      }
    });

    // Validate text overlays
    timeline.textOverlays.forEach((overlay, index) => {
      this.validateTextOverlay(overlay, index);
    });
  }

  /**
   * Validate add clip data
   *
   * @throws ValidationError if data is invalid
   */
  validateAddClip(data: AddClipDto): void {
    if (!data.sourceUrl) {
      throw new ValidationError("Source URL is required for clip");
    }

    this.validateVideoUrl(data.sourceUrl);

    if (data.startTime !== undefined && data.startTime < 0) {
      throw new ValidationError("Start time must be non-negative");
    }

    if (
      data.endTime !== undefined &&
      data.startTime !== undefined &&
      data.endTime <= data.startTime
    ) {
      throw new ValidationError("End time must be greater than start time");
    }

    if (data.position !== undefined && data.position < 0) {
      throw new ValidationError("Position must be non-negative");
    }
  }

  /**
   * Validate text overlay
   *
   * @throws InvalidTextOverlayError if overlay is invalid
   */
  validateTextOverlay(overlay: TextOverlay | AddTextDto, index?: number): void {
    const prefix = index !== undefined ? `Text overlay at index ${index}` : "Text overlay";

    if (!("text" in overlay) || !overlay.text || typeof overlay.text !== "string") {
      throw new InvalidTextOverlayError(`${prefix}: text is required`);
    }

    if (overlay.startTime < 0) {
      throw new InvalidTextOverlayError(
        `${prefix}: start time must be non-negative`
      );
    }

    if (overlay.endTime <= overlay.startTime) {
      throw new InvalidTextOverlayError(
        `${prefix}: end time must be greater than start time`
      );
    }

    if ("position" in overlay && overlay.position) {
      const { x, y } = overlay.position;
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        throw new InvalidTextOverlayError(
          `${prefix}: position must be between 0-100%`
        );
      }
    }

    if ("style" in overlay && overlay.style) {
      if (
        overlay.style.opacity !== undefined &&
        (overlay.style.opacity < 0 || overlay.style.opacity > 1)
      ) {
        throw new InvalidTextOverlayError(
          `${prefix}: opacity must be between 0-1`
        );
      }

      if (
        overlay.style.fontSize !== undefined &&
        overlay.style.fontSize <= 0
      ) {
        throw new InvalidTextOverlayError(
          `${prefix}: font size must be positive`
        );
      }
    }
  }

  /**
   * Validate effect
   *
   * @throws InvalidEffectError if effect is invalid
   */
  validateEffect(effect: Effect): void {
    if (!effect.type) {
      throw new InvalidEffectError("unknown", "Effect type is required");
    }

    // Validate effect parameters based on type
    switch (effect.type) {
      case "brightness":
      case "contrast":
      case "saturation":
        if (
          typeof effect.parameters.value !== "number" ||
          effect.parameters.value < 0 ||
          effect.parameters.value > 2
        ) {
          throw new InvalidEffectError(
            effect.type,
            "Value must be between 0 and 2"
          );
        }
        break;

      case "blur":
        if (
          typeof effect.parameters.radius !== "number" ||
          effect.parameters.radius < 0
        ) {
          throw new InvalidEffectError(
            effect.type,
            "Radius must be non-negative"
          );
        }
        break;

      case "speed":
        if (
          typeof effect.parameters.factor !== "number" ||
          effect.parameters.factor <= 0
        ) {
          throw new InvalidEffectError(
            effect.type,
            "Speed factor must be positive"
          );
        }
        break;

      case "rotate":
        if (typeof effect.parameters.angle !== "number") {
          throw new InvalidEffectError(effect.type, "Angle is required");
        }
        break;
    }
  }

  /**
   * Validate export settings
   *
   * @throws InvalidExportSettingsError if settings are invalid
   */
  validateExportSettings(settings: ExportSettings): void {
    if (!settings.format || !VALID_EXPORT_FORMATS.includes(settings.format)) {
      throw new InvalidExportSettingsError(
        `Format must be one of: ${VALID_EXPORT_FORMATS.join(", ")}`
      );
    }

    if (!settings.quality || !VALID_QUALITIES.includes(settings.quality)) {
      throw new InvalidExportSettingsError(
        `Quality must be one of: ${VALID_QUALITIES.join(", ")}`
      );
    }

    if (settings.resolution) {
      this.validateResolution(settings.resolution);
    }

    if (settings.frameRate !== undefined) {
      if (settings.frameRate <= 0 || settings.frameRate > 120) {
        throw new InvalidExportSettingsError(
          "Frame rate must be between 1 and 120"
        );
      }
    }
  }

  /**
   * Validate resolution
   *
   * @throws ValidationError if resolution is invalid
   */
  private validateResolution(resolution: { width: number; height: number }): void {
    if (!resolution.width || !resolution.height) {
      throw new ValidationError("Resolution width and height are required");
    }

    if (
      resolution.width <= 0 ||
      resolution.height <= 0 ||
      resolution.width > 7680 ||
      resolution.height > 4320
    ) {
      throw new ValidationError(
        "Resolution must be between 1x1 and 7680x4320 (8K)"
      );
    }
  }

  /**
   * Get supported video formats
   */
  getSupportedFormats(): string[] {
    return [...SUPPORTED_VIDEO_FORMATS];
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return [...SUPPORTED_MIME_TYPES];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format: string): boolean {
    return SUPPORTED_VIDEO_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}
