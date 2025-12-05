/**
 * PDF Validator
 *
 * Validates PDF files, projects, annotations, and operations.
 * Following the existing validator pattern used in dubbing and YouTube services.
 */

import {
  MAX_PDF_FILE_SIZE,
  ALLOWED_PDF_VERSIONS,
  SUPPORTED_EXPORT_FORMATS,
  SUPPORTED_ANNOTATION_TYPES,
  type PDFProject,
  type Annotation,
  type ExportSettings,
  type PageRange,
  type AnnotationType,
  type ExportFormat,
} from './pdf.types';

import {
  InvalidPDFError,
  PDFSizeError,
  UnsupportedPDFVersionError,
  AnnotationError,
  InvalidAnnotationTypeError,
  InvalidExportFormatError,
  PDFPageError,
} from '@/lib/errors/pdf.errors';

import { ValidationError } from '@/lib/errors/validation.error';

/**
 * Validate PDF file
 * Checks file type, size, and format
 */
export function validatePDFFile(file: File | Buffer, maxSize: number = MAX_PDF_FILE_SIZE): void {
  // Check file size
  const fileSize = file instanceof File ? file.size : file.length;
  if (fileSize > maxSize) {
    throw new PDFSizeError(
      `PDF file size (${formatBytes(fileSize)}) exceeds maximum allowed size (${formatBytes(maxSize)})`,
      { fileSize, maxSize }
    );
  }

  // Check minimum size (at least 1KB)
  if (fileSize < 1024) {
    throw new InvalidPDFError('PDF file is too small or empty', { fileSize });
  }

  // Check file type
  if (file instanceof File) {
    if (!file.type || file.type !== 'application/pdf') {
      throw new InvalidPDFError('Invalid file type. Expected application/pdf', {
        receivedType: file.type,
      });
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      throw new InvalidPDFError('Invalid file extension. Expected .pdf', {
        fileName,
      });
    }
  }

  // For Buffer, check PDF header
  if (file instanceof Buffer) {
    const header = file.slice(0, 5).toString('utf-8');
    if (!header.startsWith('%PDF')) {
      throw new InvalidPDFError('Invalid PDF file header', { header });
    }
  }
}

/**
 * Validate PDF version
 */
export function validatePDFVersion(version: string): void {
  if (!ALLOWED_PDF_VERSIONS.includes(version)) {
    throw new UnsupportedPDFVersionError(version);
  }
}

/**
 * Validate project data
 */
export function validateProjectData(data: Partial<PDFProject>): void {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new ValidationError('Project name is required and must be a non-empty string', {
      field: 'name',
      value: data.name,
    });
  }

  if (data.name.length > 255) {
    throw new ValidationError('Project name must not exceed 255 characters', {
      field: 'name',
      length: data.name.length,
    });
  }

  if (data.status && !['draft', 'processing', 'completed', 'failed'].includes(data.status)) {
    throw new ValidationError('Invalid project status', {
      field: 'status',
      value: data.status,
    });
  }
}

/**
 * Validate annotation data
 */
export function validateAnnotation(annotation: Partial<Annotation>): void {
  // Check type
  if (!annotation.type) {
    throw new AnnotationError('Annotation type is required');
  }

  if (!SUPPORTED_ANNOTATION_TYPES.includes(annotation.type as AnnotationType)) {
    throw new InvalidAnnotationTypeError(annotation.type);
  }

  // Check page number
  if (typeof annotation.pageNumber !== 'number' || annotation.pageNumber < 1) {
    throw new AnnotationError('Invalid page number', {
      pageNumber: annotation.pageNumber,
    });
  }

  // Check position and dimensions
  if (typeof annotation.x !== 'number' || annotation.x < 0) {
    throw new AnnotationError('Invalid x position', { x: annotation.x });
  }

  if (typeof annotation.y !== 'number' || annotation.y < 0) {
    throw new AnnotationError('Invalid y position', { y: annotation.y });
  }

  if (typeof annotation.width !== 'number' || annotation.width <= 0) {
    throw new AnnotationError('Invalid width', { width: annotation.width });
  }

  if (typeof annotation.height !== 'number' || annotation.height <= 0) {
    throw new AnnotationError('Invalid height', { height: annotation.height });
  }

  // Check opacity
  if (
    typeof annotation.opacity !== 'undefined' &&
    (annotation.opacity < 0 || annotation.opacity > 1)
  ) {
    throw new AnnotationError('Opacity must be between 0 and 1', {
      opacity: annotation.opacity,
    });
  }

  // Type-specific validation
  switch (annotation.type) {
    case 'text':
      validateTextAnnotation(annotation as any);
      break;
    case 'highlight':
      validateHighlightAnnotation(annotation as any);
      break;
    case 'drawing':
      validateDrawingAnnotation(annotation as any);
      break;
    case 'shape':
      validateShapeAnnotation(annotation as any);
      break;
    case 'image':
      validateImageAnnotation(annotation as any);
      break;
  }
}

/**
 * Validate text annotation
 */
function validateTextAnnotation(annotation: any): void {
  if (!annotation.content || typeof annotation.content !== 'string') {
    throw new AnnotationError('Text content is required');
  }

  if (!annotation.fontFamily || typeof annotation.fontFamily !== 'string') {
    throw new AnnotationError('Font family is required');
  }

  if (typeof annotation.fontSize !== 'number' || annotation.fontSize <= 0) {
    throw new AnnotationError('Invalid font size', { fontSize: annotation.fontSize });
  }

  if (!isValidColor(annotation.color)) {
    throw new AnnotationError('Invalid color format', { color: annotation.color });
  }
}

/**
 * Validate highlight annotation
 */
function validateHighlightAnnotation(annotation: any): void {
  if (!isValidColor(annotation.color)) {
    throw new AnnotationError('Invalid color format', { color: annotation.color });
  }
}

/**
 * Validate drawing annotation
 */
function validateDrawingAnnotation(annotation: any): void {
  if (!Array.isArray(annotation.points) || annotation.points.length < 2) {
    throw new AnnotationError('Drawing must have at least 2 points');
  }

  for (const point of annotation.points) {
    if (typeof point.x !== 'number' || typeof point.y !== 'number') {
      throw new AnnotationError('Invalid point coordinates');
    }
  }

  if (!isValidColor(annotation.strokeColor)) {
    throw new AnnotationError('Invalid stroke color', { color: annotation.strokeColor });
  }

  if (typeof annotation.strokeWidth !== 'number' || annotation.strokeWidth <= 0) {
    throw new AnnotationError('Invalid stroke width', { strokeWidth: annotation.strokeWidth });
  }
}

/**
 * Validate shape annotation
 */
function validateShapeAnnotation(annotation: any): void {
  const validShapes = ['rectangle', 'circle', 'line', 'arrow', 'polygon'];
  if (!validShapes.includes(annotation.shapeType)) {
    throw new AnnotationError('Invalid shape type', { shapeType: annotation.shapeType });
  }

  if (!isValidColor(annotation.strokeColor)) {
    throw new AnnotationError('Invalid stroke color', { color: annotation.strokeColor });
  }

  if (typeof annotation.strokeWidth !== 'number' || annotation.strokeWidth <= 0) {
    throw new AnnotationError('Invalid stroke width', { strokeWidth: annotation.strokeWidth });
  }

  // Polygon and arrow require points
  if ((annotation.shapeType === 'polygon' || annotation.shapeType === 'arrow') &&
      (!Array.isArray(annotation.points) || annotation.points.length < 2)) {
    throw new AnnotationError(`${annotation.shapeType} requires at least 2 points`);
  }
}

/**
 * Validate image annotation
 */
function validateImageAnnotation(annotation: any): void {
  if (!annotation.imageData || typeof annotation.imageData !== 'string') {
    throw new AnnotationError('Image data is required');
  }

  if (!['png', 'jpg', 'jpeg'].includes(annotation.imageType)) {
    throw new AnnotationError('Invalid image type', { imageType: annotation.imageType });
  }

  // Basic base64 validation
  if (!isValidBase64(annotation.imageData)) {
    throw new AnnotationError('Invalid image data format (expected base64)');
  }
}

/**
 * Validate export settings
 */
export function validateExportSettings(settings: ExportSettings): void {
  // Check format
  if (!SUPPORTED_EXPORT_FORMATS.includes(settings.format as ExportFormat)) {
    throw new InvalidExportFormatError(settings.format);
  }

  // Check quality for image formats
  if ((settings.format === 'png' || settings.format === 'jpg') && settings.quality) {
    if (settings.quality < 1 || settings.quality > 100) {
      throw new ValidationError('Quality must be between 1 and 100', {
        quality: settings.quality,
      });
    }
  }

  // Validate page range
  if (settings.pageRange) {
    validatePageRange(settings.pageRange);
  }
}

/**
 * Validate page range
 */
export function validatePageRange(pageRange: PageRange, totalPages?: number): void {
  if (!['all', 'range', 'selection'].includes(pageRange.type)) {
    throw new ValidationError('Invalid page range type', { type: pageRange.type });
  }

  if (pageRange.type === 'range') {
    if (typeof pageRange.startPage !== 'number' || pageRange.startPage < 1) {
      throw new PDFPageError('Invalid start page', { startPage: pageRange.startPage });
    }

    if (typeof pageRange.endPage !== 'number' || pageRange.endPage < pageRange.startPage) {
      throw new PDFPageError('End page must be greater than or equal to start page', {
        startPage: pageRange.startPage,
        endPage: pageRange.endPage,
      });
    }

    if (totalPages && pageRange.endPage > totalPages) {
      throw new PDFPageError('End page exceeds total pages', {
        endPage: pageRange.endPage,
        totalPages,
      });
    }
  }

  if (pageRange.type === 'selection') {
    if (!Array.isArray(pageRange.pages) || pageRange.pages.length === 0) {
      throw new PDFPageError('Page selection must contain at least one page');
    }

    for (const page of pageRange.pages) {
      if (typeof page !== 'number' || page < 1) {
        throw new PDFPageError('Invalid page number in selection', { page });
      }

      if (totalPages && page > totalPages) {
        throw new PDFPageError('Page number exceeds total pages', {
          page,
          totalPages,
        });
      }
    }
  }
}

/**
 * Validate page numbers array
 */
export function validatePageNumbers(pages: number[], totalPages: number): void {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new PDFPageError('Pages array must contain at least one page');
  }

  for (const page of pages) {
    if (typeof page !== 'number' || page < 1 || page > totalPages) {
      throw new PDFPageError('Invalid page number', { page, totalPages });
    }
  }
}

/**
 * Helper: Check if string is valid hex color
 */
function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Helper: Check if string is valid base64
 */
function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  // Remove data URL prefix if present
  const base64Data = str.replace(/^data:image\/[a-z]+;base64,/, '');
  // Check if valid base64
  return /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data);
}

/**
 * Helper: Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}
