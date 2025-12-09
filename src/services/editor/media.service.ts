/**
 * Media Service
 *
 * Handles media asset management for the video editor:
 * - Upload and store media files
 * - Generate thumbnails
 * - Extract metadata
 * - List and delete assets
 */

import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  MediaAsset,
  MediaAssetType,
  MediaAssetMetadata,
} from "@/lib/editor/types";
import { FFmpegService } from "../ffmpeg/ffmpeg.service";

/**
 * Supported MIME types by asset category
 */
const MIME_TYPES: Record<MediaAssetType, string[]> = {
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/x-m4a",
  ],
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
};

/**
 * Get asset type from MIME type
 */
function getAssetType(mimeType: string): MediaAssetType | null {
  for (const [type, mimes] of Object.entries(MIME_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as MediaAssetType;
    }
  }
  return null;
}

export class MediaService {
  private baseDir: string;
  private ffmpegService: FFmpegService;

  constructor(ffmpegService: FFmpegService, baseDir?: string) {
    this.ffmpegService = ffmpegService;
    this.baseDir = baseDir || path.join(process.cwd(), ".cache", "editor", "media");
  }

  /**
   * Get the directory for a project's media files
   */
  private getProjectDir(projectId: string): string {
    return path.join(this.baseDir, projectId);
  }

  /**
   * Get the thumbnails directory for a project
   */
  private getThumbnailDir(projectId: string): string {
    return path.join(this.getProjectDir(projectId), "thumbnails");
  }

  /**
   * Initialize directories for a project
   */
  private async initializeProjectDirs(projectId: string): Promise<void> {
    const projectDir = this.getProjectDir(projectId);
    const thumbnailDir = this.getThumbnailDir(projectId);

    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(thumbnailDir, { recursive: true });
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    const basename = path.basename(filename);
    return basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  /**
   * Upload a media file
   */
  async upload(
    projectId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<MediaAsset> {
    // Validate MIME type
    const assetType = getAssetType(mimeType);
    if (!assetType) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Initialize directories
    await this.initializeProjectDirs(projectId);

    // Generate unique filename
    const assetId = uuidv4();
    const sanitizedFilename = this.sanitizeFilename(filename);
    const extension = path.extname(sanitizedFilename);
    const uniqueFilename = `${assetId}${extension}`;
    const filePath = path.join(this.getProjectDir(projectId), uniqueFilename);

    // Save file
    await fs.writeFile(filePath, buffer);
    console.log(`[MediaService] File saved: ${filePath}`);

    // Extract metadata
    let metadata: MediaAssetMetadata = {};
    let thumbnail: string | undefined;

    try {
      if (assetType === "video") {
        // Get video metadata
        const videoMeta = await this.ffmpegService.getVideoMetadata(filePath);
        metadata = {
          duration: videoMeta.duration,
          width: videoMeta.width,
          height: videoMeta.height,
          frameRate: videoMeta.frameRate,
          bitrate: videoMeta.bitrate,
          codec: videoMeta.codec,
        };

        // Generate thumbnail
        thumbnail = await this.generateThumbnail(projectId, assetId, filePath);
      } else if (assetType === "audio") {
        // Get audio metadata (using same FFmpeg method - it handles audio too)
        try {
          const audioMeta = await this.ffmpegService.getVideoMetadata(filePath);
          metadata = {
            duration: audioMeta.duration,
            sampleRate: audioMeta.audioSampleRate,
          };
        } catch {
          // Audio metadata extraction may fail, that's okay
          console.warn("[MediaService] Could not extract audio metadata");
        }
      }
      // For images, we could add image metadata extraction later
    } catch (error) {
      console.warn("[MediaService] Metadata extraction failed:", error);
      // Continue without metadata - file is still usable
    }

    // Create asset record
    const asset: MediaAsset = {
      id: assetId,
      projectId,
      type: assetType,
      filename: uniqueFilename,
      originalFilename: filename,
      path: filePath,
      size: buffer.length,
      mimeType,
      thumbnail,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save asset metadata to JSON file
    await this.saveAssetMetadata(projectId, asset);

    console.log(`[MediaService] Asset created: ${assetId}`);
    return asset;
  }

  /**
   * Generate thumbnail for video file
   */
  private async generateThumbnail(
    projectId: string,
    assetId: string,
    videoPath: string
  ): Promise<string | undefined> {
    try {
      const thumbnailFilename = `${assetId}_thumb.jpg`;
      const thumbnailPath = path.join(
        this.getThumbnailDir(projectId),
        thumbnailFilename
      );

      await this.ffmpegService.extractThumbnail({
        inputPath: videoPath,
        outputPath: thumbnailPath,
        timestamp: 1, // 1 second into the video
      });

      console.log(`[MediaService] Thumbnail generated: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      console.warn("[MediaService] Thumbnail generation failed:", error);
      return undefined;
    }
  }

  /**
   * Save asset metadata to JSON file
   */
  private async saveAssetMetadata(
    projectId: string,
    asset: MediaAsset
  ): Promise<void> {
    const metadataPath = path.join(
      this.getProjectDir(projectId),
      "assets.json"
    );

    let assets: MediaAsset[] = [];

    try {
      const existing = await fs.readFile(metadataPath, "utf-8");
      assets = JSON.parse(existing);
    } catch {
      // File doesn't exist yet, start fresh
    }

    // Add or update asset
    const index = assets.findIndex((a) => a.id === asset.id);
    if (index >= 0) {
      assets[index] = asset;
    } else {
      assets.push(asset);
    }

    await fs.writeFile(metadataPath, JSON.stringify(assets, null, 2));
  }

  /**
   * List all assets for a project
   */
  async list(projectId: string): Promise<MediaAsset[]> {
    const metadataPath = path.join(
      this.getProjectDir(projectId),
      "assets.json"
    );

    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      const assets: MediaAsset[] = JSON.parse(data);

      // Convert date strings back to Date objects
      return assets.map((asset) => ({
        ...asset,
        createdAt: new Date(asset.createdAt),
        updatedAt: new Date(asset.updatedAt),
      }));
    } catch {
      // No assets yet
      return [];
    }
  }

  /**
   * Get a single asset by ID
   */
  async get(projectId: string, assetId: string): Promise<MediaAsset | null> {
    const assets = await this.list(projectId);
    return assets.find((a) => a.id === assetId) || null;
  }

  /**
   * Delete an asset
   */
  async delete(projectId: string, assetId: string): Promise<void> {
    const asset = await this.get(projectId, assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Delete the file
    try {
      await fs.unlink(asset.path);
      console.log(`[MediaService] File deleted: ${asset.path}`);
    } catch (error) {
      console.warn("[MediaService] Could not delete file:", error);
    }

    // Delete thumbnail if exists
    if (asset.thumbnail) {
      try {
        await fs.unlink(asset.thumbnail);
        console.log(`[MediaService] Thumbnail deleted: ${asset.thumbnail}`);
      } catch {
        // Ignore thumbnail deletion errors
      }
    }

    // Update metadata file
    const metadataPath = path.join(
      this.getProjectDir(projectId),
      "assets.json"
    );

    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      const assets: MediaAsset[] = JSON.parse(data);
      const filtered = assets.filter((a) => a.id !== assetId);
      await fs.writeFile(metadataPath, JSON.stringify(filtered, null, 2));
    } catch {
      // Ignore if metadata file doesn't exist
    }

    console.log(`[MediaService] Asset deleted: ${assetId}`);
  }

  /**
   * Delete all assets for a project
   */
  async deleteAllForProject(projectId: string): Promise<void> {
    const projectDir = this.getProjectDir(projectId);

    try {
      await fs.rm(projectDir, { recursive: true, force: true });
      console.log(`[MediaService] All assets deleted for project: ${projectId}`);
    } catch (error) {
      console.warn("[MediaService] Could not delete project directory:", error);
    }
  }

  /**
   * Get the URL path for serving an asset
   */
  getAssetUrl(projectId: string, filename: string): string {
    return `/api/editor/project/${projectId}/media/file/${filename}`;
  }

  /**
   * Get the URL path for serving a thumbnail
   */
  getThumbnailUrl(projectId: string, assetId: string): string {
    return `/api/editor/project/${projectId}/media/thumbnail/${assetId}`;
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpegAvailable(): Promise<boolean> {
    return this.ffmpegService.checkFFmpegAvailable();
  }
}

// Singleton instance
let mediaServiceInstance: MediaService | null = null;

/**
 * Get the MediaService singleton
 */
export function getMediaService(ffmpegService?: FFmpegService): MediaService {
  if (!mediaServiceInstance) {
    if (!ffmpegService) {
      throw new Error("FFmpegService required for first initialization");
    }
    mediaServiceInstance = new MediaService(ffmpegService);
  }
  return mediaServiceInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetMediaService(): void {
  mediaServiceInstance = null;
}
