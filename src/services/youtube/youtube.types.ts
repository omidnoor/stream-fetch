/**
 * YouTube Service Types
 *
 * Data Transfer Objects (DTOs) for the YouTube service layer.
 * These types define the contract between services and API routes.
 */

export interface VideoInfoDto {
  video: VideoDetailsDto;
  formats: FormatDto[];
}

export interface VideoDetailsDto {
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  author: string;
  viewCount: string;
}

export interface FormatDto {
  itag: number;
  quality: string;
  container: string;
  hasAudio: boolean;
  hasVideo: boolean;
  filesize: number | null;
  fps: number | null;
  codec: string | null;
}

export interface DownloadUrlDto {
  url: string;
  mimeType: string;
  filename: string;
  contentLength?: string;
}

export interface DownloadFormatDto {
  url: string;
  mimeType: string;
  filename: string;
  contentLength?: string;
  itag: number;
  quality: string;
}

/**
 * Options for YouTube service operations
 */
export interface YouTubeOptions {
  useAndroidClient?: boolean;
  useIOSClient?: boolean;
  useTVClient?: boolean;
}
