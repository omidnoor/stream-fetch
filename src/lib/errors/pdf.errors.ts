/**
 * PDF Editor Error Classes
 *
 * Custom error classes for PDF editor operations.
 * Following the existing error handling pattern used in the application.
 */

import { AppError } from './base.error';

/**
 * Base PDF Error Class
 * Extends the application's base error class
 */
export class PDFError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'PDF_ERROR',
    public readonly details?: Record<string, unknown>
  ) {
    super(message, statusCode, code);
    this.name = 'PDFError';
  }
}

/**
 * PDF Load Error
 * Thrown when a PDF file cannot be loaded
 */
export class PDFLoadError extends PDFError {
  constructor(message: string = 'Failed to load PDF file', details?: Record<string, unknown>) {
    super(message, 400, 'PDF_LOAD_ERROR', details);
    this.name = 'PDFLoadError';
  }
}

/**
 * PDF Render Error
 * Thrown when PDF rendering fails
 */
export class PDFRenderError extends PDFError {
  constructor(message: string = 'Failed to render PDF', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_RENDER_ERROR', details);
    this.name = 'PDFRenderError';
  }
}

/**
 * PDF Processing Error
 * Thrown when PDF processing operations fail
 */
export class PDFProcessingError extends PDFError {
  constructor(message: string = 'PDF processing failed', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_PROCESSING_ERROR', details);
    this.name = 'PDFProcessingError';
  }
}

/**
 * Invalid PDF Error
 * Thrown when PDF file is invalid or corrupted
 */
export class InvalidPDFError extends PDFError {
  constructor(message: string = 'Invalid or corrupted PDF file', details?: Record<string, unknown>) {
    super(message, 400, 'INVALID_PDF', details);
    this.name = 'InvalidPDFError';
  }
}

/**
 * Annotation Error
 * Thrown when annotation operations fail
 */
export class AnnotationError extends PDFError {
  constructor(message: string = 'Annotation operation failed', details?: Record<string, unknown>) {
    super(message, 400, 'ANNOTATION_ERROR', details);
    this.name = 'AnnotationError';
  }
}

/**
 * PDF Export Error
 * Thrown when PDF export/save operations fail
 */
export class PDFExportError extends PDFError {
  constructor(message: string = 'Failed to export PDF', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_EXPORT_ERROR', details);
    this.name = 'PDFExportError';
  }
}

/**
 * PDF Merge Error
 * Thrown when merging PDFs fails
 */
export class PDFMergeError extends PDFError {
  constructor(message: string = 'Failed to merge PDF files', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_MERGE_ERROR', details);
    this.name = 'PDFMergeError';
  }
}

/**
 * PDF Split Error
 * Thrown when splitting PDF fails
 */
export class PDFSplitError extends PDFError {
  constructor(message: string = 'Failed to split PDF', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_SPLIT_ERROR', details);
    this.name = 'PDFSplitError';
  }
}

/**
 * PDF Upload Error
 * Thrown when PDF upload fails
 */
export class PDFUploadError extends PDFError {
  constructor(message: string = 'Failed to upload PDF', details?: Record<string, unknown>) {
    super(message, 400, 'PDF_UPLOAD_ERROR', details);
    this.name = 'PDFUploadError';
  }
}

/**
 * PDF Size Error
 * Thrown when PDF file size exceeds limit
 */
export class PDFSizeError extends PDFError {
  constructor(message: string = 'PDF file size exceeds limit', details?: Record<string, unknown>) {
    super(message, 413, 'PDF_SIZE_ERROR', details);
    this.name = 'PDFSizeError';
  }
}

/**
 * PDF Page Error
 * Thrown when page operations fail
 */
export class PDFPageError extends PDFError {
  constructor(message: string = 'Invalid page number or operation', details?: Record<string, unknown>) {
    super(message, 400, 'PDF_PAGE_ERROR', details);
    this.name = 'PDFPageError';
  }
}

/**
 * PDF Project Not Found Error
 * Thrown when a PDF project cannot be found
 */
export class PDFProjectNotFoundError extends PDFError {
  constructor(projectId: string) {
    super(
      `PDF project not found: ${projectId}`,
      404,
      'PDF_PROJECT_NOT_FOUND',
      { projectId }
    );
    this.name = 'PDFProjectNotFoundError';
  }
}

/**
 * Annotation Not Found Error
 * Thrown when an annotation cannot be found
 */
export class AnnotationNotFoundError extends PDFError {
  constructor(annotationId: string) {
    super(
      `Annotation not found: ${annotationId}`,
      404,
      'ANNOTATION_NOT_FOUND',
      { annotationId }
    );
    this.name = 'AnnotationNotFoundError';
  }
}

/**
 * PDF Compression Error
 * Thrown when PDF compression fails
 */
export class PDFCompressionError extends PDFError {
  constructor(message: string = 'Failed to compress PDF', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_COMPRESSION_ERROR', details);
    this.name = 'PDFCompressionError';
  }
}

/**
 * PDF Watermark Error
 * Thrown when adding watermark fails
 */
export class PDFWatermarkError extends PDFError {
  constructor(message: string = 'Failed to add watermark to PDF', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_WATERMARK_ERROR', details);
    this.name = 'PDFWatermarkError';
  }
}

/**
 * Unsupported PDF Version Error
 * Thrown when PDF version is not supported
 */
export class UnsupportedPDFVersionError extends PDFError {
  constructor(version: string) {
    super(
      `Unsupported PDF version: ${version}`,
      400,
      'UNSUPPORTED_PDF_VERSION',
      { version }
    );
    this.name = 'UnsupportedPDFVersionError';
  }
}

/**
 * PDF Permission Error
 * Thrown when PDF has restrictions (encrypted, password-protected)
 */
export class PDFPermissionError extends PDFError {
  constructor(message: string = 'PDF is encrypted or password-protected', details?: Record<string, unknown>) {
    super(message, 403, 'PDF_PERMISSION_ERROR', details);
    this.name = 'PDFPermissionError';
  }
}

/**
 * Invalid Annotation Type Error
 * Thrown when annotation type is not supported
 */
export class InvalidAnnotationTypeError extends PDFError {
  constructor(type: string) {
    super(
      `Invalid annotation type: ${type}`,
      400,
      'INVALID_ANNOTATION_TYPE',
      { type }
    );
    this.name = 'InvalidAnnotationTypeError';
  }
}

/**
 * Invalid Export Format Error
 * Thrown when export format is not supported
 */
export class InvalidExportFormatError extends PDFError {
  constructor(format: string) {
    super(
      `Invalid export format: ${format}`,
      400,
      'INVALID_EXPORT_FORMAT',
      { format }
    );
    this.name = 'InvalidExportFormatError';
  }
}

/**
 * PDF Storage Error
 * Thrown when storage operations fail
 */
export class PDFStorageError extends PDFError {
  constructor(message: string = 'PDF storage operation failed', details?: Record<string, unknown>) {
    super(message, 500, 'PDF_STORAGE_ERROR', details);
    this.name = 'PDFStorageError';
  }
}
