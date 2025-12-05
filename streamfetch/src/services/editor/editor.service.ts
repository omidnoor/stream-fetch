/**
 * Editor Service
 *
 * Main service for video editing operations.
 * Orchestrates validation, storage, FFmpeg operations, and data transformation.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  VideoProject,
  AddClipDto,
  AddTextDto,
  ExportProjectDto,
  ExportJobDto,
  VideoClip,
  TextOverlay,
  TimelineData,
} from "./editor.types";
import { EditorValidator } from "./editor.validator";
import { EditorRepository } from "./editor.repository";
import { EditorMapper } from "./editor.mapper";
import { FFmpegService } from "../ffmpeg/ffmpeg.service";
import type { CacheService } from "@/lib/cache/cache.interface";
import {
  ProjectNotFoundError,
  InvalidProjectStateError,
  VideoProcessingError,
  FFmpegNotFoundError,
} from "@/lib/errors/editor.errors";

/**
 * Main Editor Service
 *
 * Provides high-level API for video editing operations:
 * - Create and manage projects
 * - Add/remove clips and overlays
 * - Process videos
 * - Export final videos
 */
export class EditorService {
  constructor(
    private readonly validator: EditorValidator,
    private readonly repository: EditorRepository,
    private readonly mapper: EditorMapper,
    private readonly ffmpegService: FFmpegService,
    private readonly cache?: CacheService
  ) {}

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Initialize repository (create directories)
    await this.repository.initialize();

    // Check FFmpeg availability
    const ffmpegAvailable = await this.ffmpegService.checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      console.warn(
        "[EditorService] WARNING: FFmpeg is not available. Video processing features will not work."
      );
      console.warn(
        "[EditorService] Please install FFmpeg to use video editing features."
      );
    } else {
      console.log("[EditorService] FFmpeg is available");
    }
  }

  /**
   * Create a new video project
   *
   * @param params Project creation parameters
   * @param userId Optional user ID
   * @returns Created project DTO
   * @throws InvalidProjectDataError if data is invalid
   */
  async createProject(
    params: CreateProjectDto,
    userId?: string
  ): Promise<ProjectDto> {
    // 1. Validate inputs
    this.validator.validateCreateProject(params);

    // 2. Generate project ID
    const projectId = uuidv4();

    // 3. Map DTO to project entity
    const project = this.mapper.mapToProject(projectId, params, userId);

    // 4. If source video URL is provided, create initial clip
    if (params.sourceVideoUrl) {
      try {
        // Get video metadata
        const metadata = await this.ffmpegService.getVideoMetadata(
          params.sourceVideoUrl
        );

        // Add initial clip
        const clip: VideoClip = {
          id: this.mapper.generateClipId(),
          sourceUrl: params.sourceVideoUrl,
          startTime: 0,
          endTime: metadata.duration,
          duration: metadata.duration,
          position: 0,
          layer: 0,
          volume: 1.0,
          muted: false,
          effects: [],
        };

        project.timeline.clips.push(clip);
        project.timeline.duration = metadata.duration;

        // Update project settings from video metadata
        project.settings.resolution = {
          width: metadata.width,
          height: metadata.height,
        };
        project.settings.frameRate = metadata.frameRate;
      } catch (error) {
        console.warn(
          "[EditorService] Failed to load source video metadata:",
          error
        );
        // Continue without initial clip if metadata fetch fails
      }
    }

    // 5. Save project
    await this.repository.saveProject(project);

    console.log("[EditorService] Project created:", projectId);

    // 6. Return DTO
    return this.mapper.mapToProjectDto(project);
  }

  /**
   * Get project by ID
   *
   * @param projectId Project ID
   * @returns Full project data
   * @throws ProjectNotFoundError if project not found
   */
  async getProject(projectId: string): Promise<VideoProject> {
    // 1. Validate input
    this.validator.validateProjectId(projectId);

    // 2. Fetch from repository
    const project = await this.repository.getProject(projectId);

    return project;
  }

  /**
   * Get project DTO by ID (lighter response)
   *
   * @param projectId Project ID
   * @returns Project DTO
   * @throws ProjectNotFoundError if project not found
   */
  async getProjectDto(projectId: string): Promise<ProjectDto> {
    const project = await this.getProject(projectId);
    return this.mapper.mapToProjectDto(project);
  }

  /**
   * List all projects (optionally for a user)
   *
   * @param userId Optional user ID to filter
   * @returns Array of project DTOs
   */
  async listProjects(userId?: string): Promise<ProjectDto[]> {
    const projects = await this.repository.listProjects(userId);
    return this.mapper.mapToProjectDtoList(projects);
  }

  /**
   * Update project
   *
   * @param projectId Project ID
   * @param updates Update data
   * @returns Updated project DTO
   * @throws ProjectNotFoundError if project not found
   * @throws InvalidProjectDataError if update data is invalid
   */
  async updateProject(
    projectId: string,
    updates: UpdateProjectDto
  ): Promise<ProjectDto> {
    // 1. Validate inputs
    this.validator.validateProjectId(projectId);
    this.validator.validateUpdateProject(updates);

    // 2. Get existing project
    const project = await this.repository.getProject(projectId);

    // 3. Apply updates
    if (updates.name !== undefined) {
      project.name = updates.name;
    }

    if (updates.description !== undefined) {
      project.description = updates.description;
    }

    if (updates.timeline !== undefined) {
      project.timeline = updates.timeline;
      // Recalculate duration
      project.timeline.duration =
        this.mapper.calculateTotalDuration(updates.timeline);
    }

    if (updates.settings !== undefined) {
      project.settings = { ...project.settings, ...updates.settings };
    }

    // 4. Save updated project
    await this.repository.saveProject(project);

    console.log("[EditorService] Project updated:", projectId);

    // 5. Return DTO
    return this.mapper.mapToProjectDto(project);
  }

  /**
   * Delete project
   *
   * @param projectId Project ID
   * @throws ProjectNotFoundError if project not found
   */
  async deleteProject(projectId: string): Promise<void> {
    // 1. Validate input
    this.validator.validateProjectId(projectId);

    // 2. Delete from repository
    await this.repository.deleteProject(projectId);

    console.log("[EditorService] Project deleted:", projectId);
  }

  /**
   * Add video clip to project timeline
   *
   * @param projectId Project ID
   * @param clipData Clip data
   * @returns Updated project
   * @throws ProjectNotFoundError if project not found
   * @throws ValidationError if clip data is invalid
   */
  async addClip(projectId: string, clipData: AddClipDto): Promise<VideoProject> {
    // 1. Validate inputs
    this.validator.validateProjectId(projectId);
    this.validator.validateAddClip(clipData);

    // 2. Get project
    const project = await this.repository.getProject(projectId);

    // 3. Get video metadata
    const metadata = await this.ffmpegService.getVideoMetadata(
      clipData.sourceUrl
    );

    // 4. Create clip
    const clip: VideoClip = {
      id: this.mapper.generateClipId(),
      sourceUrl: clipData.sourceUrl,
      startTime: clipData.startTime ?? 0,
      endTime: clipData.endTime ?? metadata.duration,
      duration: (clipData.endTime ?? metadata.duration) - (clipData.startTime ?? 0),
      position: clipData.position ?? project.timeline.duration,
      layer: 0,
      volume: 1.0,
      muted: false,
      effects: [],
    };

    // 5. Add to timeline
    project.timeline.clips.push(clip);

    // 6. Recalculate duration
    project.timeline.duration = this.mapper.calculateTotalDuration(
      project.timeline
    );

    // 7. Save project
    await this.repository.saveProject(project);

    console.log("[EditorService] Clip added to project:", projectId);

    return project;
  }

  /**
   * Remove clip from project
   *
   * @param projectId Project ID
   * @param clipId Clip ID
   * @returns Updated project
   */
  async removeClip(projectId: string, clipId: string): Promise<VideoProject> {
    // 1. Get project
    const project = await this.repository.getProject(projectId);

    // 2. Remove clip
    project.timeline.clips = project.timeline.clips.filter(
      (c) => c.id !== clipId
    );

    // 3. Recalculate duration
    project.timeline.duration = this.mapper.calculateTotalDuration(
      project.timeline
    );

    // 4. Save project
    await this.repository.saveProject(project);

    console.log("[EditorService] Clip removed from project:", projectId);

    return project;
  }

  /**
   * Add text overlay to project
   *
   * @param projectId Project ID
   * @param textData Text overlay data
   * @returns Updated project
   */
  async addTextOverlay(
    projectId: string,
    textData: AddTextDto
  ): Promise<VideoProject> {
    // 1. Validate inputs
    this.validator.validateProjectId(projectId);
    this.validator.validateTextOverlay(textData);

    // 2. Get project
    const project = await this.repository.getProject(projectId);

    // 3. Create text overlay
    const overlay: TextOverlay = {
      id: this.mapper.generateTextOverlayId(),
      text: textData.text,
      startTime: textData.startTime,
      endTime: textData.endTime,
      position: textData.position ?? { x: 50, y: 50 },
      style: {
        fontFamily: textData.style?.fontFamily ?? "Arial",
        fontSize: textData.style?.fontSize ?? 24,
        color: textData.style?.color ?? "#FFFFFF",
        backgroundColor: textData.style?.backgroundColor,
        opacity: textData.style?.opacity ?? 1.0,
        bold: textData.style?.bold ?? false,
        italic: textData.style?.italic ?? false,
        underline: textData.style?.underline ?? false,
      },
      animation: textData.style
        ? {
            fadeIn: 0.5,
            fadeOut: 0.5,
          }
        : undefined,
    };

    // 4. Add to timeline
    project.timeline.textOverlays.push(overlay);

    // 5. Save project
    await this.repository.saveProject(project);

    console.log("[EditorService] Text overlay added to project:", projectId);

    return project;
  }

  /**
   * Export project to video file
   *
   * @param exportParams Export parameters
   * @returns Export job information
   */
  async exportProject(exportParams: ExportProjectDto): Promise<ExportJobDto> {
    // 1. Validate inputs
    this.validator.validateProjectId(exportParams.projectId);
    this.validator.validateExportSettings(exportParams.settings);

    // 2. Get project
    const project = await this.repository.getProject(exportParams.projectId);

    // 3. Check project has content
    if (project.timeline.clips.length === 0) {
      throw new VideoProcessingError(
        "Cannot export empty project - add at least one video clip"
      );
    }

    // 4. Generate job ID
    const jobId = uuidv4();

    // 5. Update project status
    await this.repository.updateProjectStatus(
      exportParams.projectId,
      "processing",
      0
    );

    // 6. Start async rendering (in a real app, this would be queued)
    this.renderProjectAsync(project, exportParams, jobId).catch((error) => {
      console.error("[EditorService] Export failed:", error);
    });

    // 7. Return job DTO
    return this.mapper.mapToExportJobDto(
      jobId,
      exportParams.projectId,
      "processing",
      0
    );
  }

  /**
   * Render project asynchronously
   * @private
   */
  private async renderProjectAsync(
    project: VideoProject,
    exportParams: ExportProjectDto,
    jobId: string
  ): Promise<void> {
    try {
      // Generate output filename
      const outputFilename = this.mapper.generateExportFilename(
        project.name,
        exportParams.settings.format,
        exportParams.settings.quality
      );

      const outputPath = this.repository.getOutputFilePath(outputFilename);

      // Get all clip source paths
      const inputPaths = project.timeline.clips.map((clip) => clip.sourceUrl);

      // Render using FFmpeg
      await this.ffmpegService.renderVideo({
        inputPaths,
        outputPath,
        settings: exportParams.settings,
        onProgress: async (progress) => {
          await this.repository.updateProjectStatus(
            project.id,
            "processing",
            progress.percent
          );
        },
      });

      // Update project status to completed
      await this.repository.updateProjectStatus(project.id, "completed", 100);

      console.log("[EditorService] Export completed:", jobId);
    } catch (error) {
      // Update project status to failed
      await this.repository.updateProjectStatus(
        project.id,
        "failed",
        0,
        error instanceof Error ? error.message : "Unknown error"
      );

      console.error("[EditorService] Export failed:", error);
    }
  }

  /**
   * Get project count
   */
  async getProjectCount(userId?: string): Promise<number> {
    return this.repository.getProjectCount(userId);
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    await this.repository.cleanupOldFiles();
  }

  /**
   * Validate video file before upload
   *
   * @param file File metadata to validate
   * @throws InvalidVideoFileError if file is invalid
   * @throws FileSizeExceededError if file is too large
   * @throws UnsupportedFormatError if format is not supported
   */
  validateFile(file: { name: string; size: number; type?: string }): void {
    this.validator.validateVideoFile(file);
  }

  /**
   * Save uploaded video file to temp storage
   *
   * @param filename Original filename
   * @param buffer File buffer
   * @returns Path to saved file
   * @throws StorageError if save fails
   */
  async saveUploadedFile(filename: string, buffer: Buffer): Promise<string> {
    return this.repository.saveUploadedFile(filename, buffer);
  }

  /**
   * Get video metadata for a file
   *
   * @param filePath Path to video file
   * @returns Video metadata
   */
  async getVideoMetadata(filePath: string) {
    return this.ffmpegService.getVideoMetadata(filePath);
  }

  /**
   * Generate thumbnail for a video
   *
   * @param videoPath Path to video file
   * @param outputPath Path to save thumbnail
   * @param timeOffset Time offset in seconds (default 1)
   */
  async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeOffset: number = 1
  ) {
    return this.ffmpegService.extractThumbnail({
      inputPath: videoPath,
      outputPath,
      timestamp: timeOffset,
    });
  }
}
