/**
 * Editor Mapper
 *
 * Transforms internal project data to DTOs and vice versa.
 */

import type {
  VideoProject,
  ProjectDto,
  CreateProjectDto,
  ExportJobDto,
  ProjectSettings,
  TimelineData,
} from "./editor.types.js";

export class EditorMapper {
  /**
   * Map VideoProject to ProjectDto (for API responses)
   */
  mapToProjectDto(project: VideoProject): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      thumbnail: project.thumbnail,
      status: project.status,
      duration: project.timeline.duration,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Map array of projects to DTOs
   */
  mapToProjectDtoList(projects: VideoProject[]): ProjectDto[] {
    return projects.map((p) => this.mapToProjectDto(p));
  }

  /**
   * Map CreateProjectDto to VideoProject (for new projects)
   */
  mapToProject(
    id: string,
    dto: CreateProjectDto,
    userId?: string
  ): VideoProject {
    const defaultSettings: ProjectSettings = {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      backgroundColor: "#000000",
      audioSampleRate: 44100,
    };

    const defaultTimeline: TimelineData = {
      clips: [],
      audioTracks: [],
      textOverlays: [],
      transitions: [],
      duration: 0,
    };

    return {
      id,
      name: dto.name,
      description: dto.description,
      userId,
      timeline: defaultTimeline,
      settings: { ...defaultSettings, ...dto.settings },
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Map export job to ExportJobDto
   */
  mapToExportJobDto(
    jobId: string,
    projectId: string,
    status: ExportJobDto["status"],
    progress: number = 0,
    outputUrl?: string,
    error?: string
  ): ExportJobDto {
    return {
      jobId,
      projectId,
      status,
      progress,
      outputUrl,
      error,
      createdAt: new Date(),
    };
  }

  /**
   * Generate project filename for export
   */
  generateExportFilename(
    projectName: string,
    format: string,
    quality: string
  ): string {
    const sanitized = this.sanitizeFilename(projectName);
    const timestamp = Date.now();
    return `${sanitized}_${quality}_${timestamp}.${format}`;
  }

  /**
   * Generate thumbnail filename
   */
  generateThumbnailFilename(projectId: string): string {
    return `thumb_${projectId}_${Date.now()}.jpg`;
  }

  /**
   * Calculate total project duration from timeline
   */
  calculateTotalDuration(timeline: TimelineData): number {
    if (timeline.clips.length === 0) {
      return 0;
    }

    // Find the maximum end time across all clips
    const maxEndTime = Math.max(
      ...timeline.clips.map((clip) => clip.position + clip.duration),
      0
    );

    return maxEndTime;
  }

  /**
   * Format duration for display (seconds to HH:MM:SS)
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Generate unique clip ID
   */
  generateClipId(): string {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique audio track ID
   */
  generateAudioTrackId(): string {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique text overlay ID
   */
  generateTextOverlayId(): string {
    return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique effect ID
   */
  generateEffectId(): string {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique transition ID
   */
  generateTransitionId(): string {
    return `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize filename by removing invalid characters
   */
  private sanitizeFilename(title: string): string {
    // Remove characters that are invalid in filenames
    const sanitized = title.replace(/[<>:"/\\|?*]/g, "_");

    // Remove leading/trailing spaces and dots
    const trimmed = sanitized.trim().replace(/^\.+/, "");

    // Limit length to prevent filesystem issues
    const maxLength = 100;
    return trimmed.length > maxLength
      ? trimmed.substring(0, maxLength)
      : trimmed;
  }

  /**
   * Convert timeline to JSON-safe format
   */
  serializeTimeline(timeline: TimelineData): string {
    return JSON.stringify(timeline);
  }

  /**
   * Parse timeline from JSON
   */
  deserializeTimeline(json: string): TimelineData {
    return JSON.parse(json) as TimelineData;
  }

  /**
   * Merge timeline data (for updates)
   */
  mergeTimeline(
    existing: TimelineData,
    updates: Partial<TimelineData>
  ): TimelineData {
    return {
      clips: updates.clips ?? existing.clips,
      audioTracks: updates.audioTracks ?? existing.audioTracks,
      textOverlays: updates.textOverlays ?? existing.textOverlays,
      transitions: updates.transitions ?? existing.transitions,
      duration: updates.duration ?? existing.duration,
    };
  }

  /**
   * Create minimal project DTO (for lists)
   */
  mapToMinimalDto(project: VideoProject): Pick<ProjectDto, "id" | "name" | "status" | "thumbnail"> {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      thumbnail: project.thumbnail,
    };
  }
}
