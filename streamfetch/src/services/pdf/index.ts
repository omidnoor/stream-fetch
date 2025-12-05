/**
 * PDF Service Module
 *
 * Barrel export file for the PDF editing service.
 * Exports all public APIs, types, and utilities.
 */

// Service and Factory
export { PDFService } from './pdf.service';
export { getPDFService, resetPDFService } from './pdf.factory';

// Repository
export { PDFRepository, getPDFRepository } from './pdf.repository';

// Types
export type {
  PDFProject,
  PDFProjectDto,
  PDFMetadata,
  PDFPage,
  PDFSettings,
  ExportSettings,
  Annotation,
  AnnotationDto,
  TextAnnotation,
  HighlightAnnotation,
  DrawingAnnotation,
  ShapeAnnotation,
  ImageAnnotation,
  Point,
  PageRange,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddAnnotationRequest,
  UpdateAnnotationRequest,
  ExportProjectRequest,
  MergeOptions,
  SplitOptions,
  CompressOptions,
  WatermarkOptions,
  ProcessingResult,
  ProjectStatus,
  AnnotationType,
  ShapeType,
  ExportFormat,
} from './pdf.types';

// Constants
export {
  DEFAULT_PDF_SETTINGS,
  DEFAULT_EXPORT_SETTINGS,
  MAX_PDF_FILE_SIZE,
  ALLOWED_PDF_VERSIONS,
  SUPPORTED_EXPORT_FORMATS,
  SUPPORTED_ANNOTATION_TYPES,
} from './pdf.types';

// Validators
export {
  validatePDFFile,
  validatePDFVersion,
  validateProjectData,
  validateAnnotation,
  validateExportSettings,
  validatePageRange,
  validatePageNumbers,
} from './pdf.validator';

// Mappers
export {
  mapToProjectDto,
  mapToProjectDtos,
  mapToAnnotationDto,
  mapToAnnotationDtos,
  generateId,
  generateFileName,
  formatFileSize,
  formatDate,
  formatProcessingTime,
  hexToRgb,
  rgbToHex,
  sanitizeFileName,
  getFileExtension,
  getMimeType,
} from './pdf.mapper';

// Errors
export {
  PDFError,
  PDFLoadError,
  PDFRenderError,
  PDFProcessingError,
  InvalidPDFError,
  AnnotationError,
  PDFExportError,
  PDFMergeError,
  PDFSplitError,
  PDFUploadError,
  PDFSizeError,
  PDFPageError,
  PDFProjectNotFoundError,
  AnnotationNotFoundError,
  PDFCompressionError,
  PDFWatermarkError,
  UnsupportedPDFVersionError,
  PDFPermissionError,
  InvalidAnnotationTypeError,
  InvalidExportFormatError,
  PDFStorageError,
} from '@/lib/errors/pdf.errors';
