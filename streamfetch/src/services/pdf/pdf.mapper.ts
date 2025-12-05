/**
 * PDF Mapper
 *
 * Maps data between internal models and DTOs (Data Transfer Objects).
 * Following the existing mapper pattern used in dubbing and YouTube services.
 */

import type {
  PDFProject,
  PDFProjectDto,
  Annotation,
  AnnotationDto,
} from './pdf.types';

/**
 * Map PDFProject to PDFProjectDto
 * Converts internal project model to API response format
 */
export function mapToProjectDto(project: PDFProject): PDFProjectDto {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    pageCount: project.metadata.pageCount,
    fileSize: project.metadata.fileSize,
    annotationCount: project.annotations.length,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/**
 * Map array of PDFProjects to PDFProjectDtos
 */
export function mapToProjectDtos(projects: PDFProject[]): PDFProjectDto[] {
  return projects.map(mapToProjectDto);
}

/**
 * Map Annotation to AnnotationDto
 * Converts internal annotation model to API response format
 */
export function mapToAnnotationDto(annotation: Annotation): AnnotationDto {
  const dto: AnnotationDto = {
    id: annotation.id,
    type: annotation.type,
    pageNumber: annotation.pageNumber,
    createdAt: annotation.createdAt.toISOString(),
  };

  // Add content for text annotations
  if (annotation.type === 'text') {
    dto.content = annotation.content;
  }

  return dto;
}

/**
 * Map array of Annotations to AnnotationDtos
 */
export function mapToAnnotationDtos(annotations: Annotation[]): AnnotationDto[] {
  return annotations.map(mapToAnnotationDto);
}

/**
 * Generate unique ID for projects and annotations
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate safe filename from project name
 */
export function generateFileName(projectName: string, extension: string = 'pdf'): string {
  // Remove special characters and spaces
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = Date.now();
  return `${safeName}-${timestamp}.${extension}`;
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculate processing time in readable format
 */
export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Create thumbnail data URL
 */
export function createThumbnailDataUrl(imageData: Buffer | Uint8Array, mimeType: string): string {
  const base64 = Buffer.from(imageData).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Parse data URL to get image data and mime type
 */
export function parseDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

/**
 * Calculate page aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Scale dimensions to fit within max bounds while maintaining aspect ratio
 */
export function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = width / height;

  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      return {
        width: maxWidth,
        height: Math.round(maxWidth / aspectRatio),
      };
    } else {
      return {
        width: Math.round(maxHeight * aspectRatio),
        height: maxHeight,
      };
    }
  }

  return { width, height };
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
