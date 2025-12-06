/**
 * PDF Editor Type Definitions
 *
 * Defines all TypeScript interfaces and types for the PDF editing service.
 * Following the existing service layer pattern used in dubbing and video editor services.
 */

/**
 * Project Status
 */
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

/**
 * Annotation Types
 */
export type AnnotationType = 'text' | 'highlight' | 'drawing' | 'shape' | 'image';

/**
 * Shape Types
 */
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'polygon';

/**
 * Export Format
 */
export type ExportFormat = 'pdf' | 'png' | 'jpg';

/**
 * PDF Project Interface
 * Represents a PDF editing project with all associated data
 */
export interface PDFProject {
  id: string;
  name: string;
  status: ProjectStatus;
  originalFile: string; // Path to original PDF file
  currentFile?: string; // Path to current working PDF file
  fileData?: string; // Base64 encoded PDF data (data URL)
  metadata: PDFMetadata;
  pages: PDFPage[];
  annotations: Annotation[];
  settings: PDFSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PDF Metadata Interface
 * Contains information about the PDF document
 */
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  fileSize: number; // in bytes
  version?: string; // PDF version (e.g., "1.7")
}

/**
 * PDF Page Interface
 * Represents a single page in the PDF
 */
export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  thumbnail?: string; // Base64 or URL to thumbnail
  annotations: string[]; // Array of annotation IDs on this page
}

/**
 * Base Annotation Interface
 * Common properties for all annotation types
 */
export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number; // 0-1
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Text Annotation Interface
 * For adding text overlays to PDF pages
 */
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string; // Hex color
  backgroundColor?: string; // Optional background
}

/**
 * Highlight Annotation Interface
 * For highlighting regions on PDF pages
 */
export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  color: string; // Hex color
}

/**
 * Drawing Annotation Interface
 * For free-hand drawings on PDF pages
 */
export interface DrawingAnnotation extends BaseAnnotation {
  type: 'drawing';
  points: Point[]; // Array of points defining the drawing path
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

/**
 * Shape Annotation Interface
 * For geometric shapes on PDF pages
 */
export interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape';
  shapeType: ShapeType;
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  points?: Point[]; // For polygon and arrow
}

/**
 * Image Annotation Interface
 * For adding images to PDF pages
 */
export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  imageData: string; // Base64 encoded image
  imageType: 'png' | 'jpg' | 'jpeg';
}

/**
 * Union type for all annotation types
 */
export type Annotation =
  | TextAnnotation
  | HighlightAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | ImageAnnotation;

/**
 * Point Interface
 * Represents a 2D coordinate
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * PDF Settings Interface
 * Project-level settings
 */
export interface PDFSettings {
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultColor: string;
  defaultStrokeWidth: number;
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
}

/**
 * Export Settings Interface
 * Settings for exporting/rendering PDF
 */
export interface ExportSettings {
  format: ExportFormat;
  quality?: number; // 1-100 for JPG/PNG
  pageRange?: PageRange;
  flattenAnnotations: boolean; // Whether to flatten annotations into PDF
  includeMetadata: boolean;
  outputFileName?: string;
}

/**
 * Page Range Interface
 * Specifies which pages to export
 */
export interface PageRange {
  type: 'all' | 'range' | 'selection';
  startPage?: number;
  endPage?: number;
  pages?: number[]; // For selection type
}

/**
 * PDF Upload Options Interface
 */
export interface PDFUploadOptions {
  maxFileSize?: number; // in bytes
  allowedVersions?: string[];
}

/**
 * PDF Processing Operation Types
 */
export type PDFOperation = 'merge' | 'split' | 'rotate' | 'delete' | 'extract' | 'compress' | 'watermark';

/**
 * PDF Merge Options Interface
 */
export interface MergeOptions {
  files: string[]; // Array of file paths
  pageRanges?: PageRange[];
  outputFileName?: string;
}

/**
 * PDF Split Options Interface
 */
export interface SplitOptions {
  filePath: string;
  splitPoints: number[]; // Page numbers where to split
  outputFileNamePattern?: string; // e.g., "output_{n}.pdf"
}

/**
 * PDF Compress Options Interface
 */
export interface CompressOptions {
  filePath: string;
  quality: 'low' | 'medium' | 'high';
  optimizeImages: boolean;
  removeUnusedObjects: boolean;
}

/**
 * PDF Watermark Options Interface
 */
export interface WatermarkOptions {
  filePath: string;
  type: 'text' | 'image';
  content: string; // Text or base64 image
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number; // 0-1
  rotation: number;
  applyToPages: PageRange;
}

/**
 * PDF Processing Result Interface
 */
export interface ProcessingResult {
  success: boolean;
  outputFile?: string;
  outputFiles?: string[]; // For split operations
  error?: string;
  processingTime: number; // in milliseconds
}

/**
 * PDF Project DTO (Data Transfer Object)
 * Simplified version for API responses
 */
export interface PDFProjectDto {
  id: string;
  name: string;
  status: ProjectStatus;
  pageCount: number;
  fileSize: number;
  annotationCount: number;
  fileUrl?: string; // Data URL or file path for the PDF
  createdAt: string;
  updatedAt: string;
}

/**
 * Annotation DTO
 * Simplified version for API responses
 */
export interface AnnotationDto {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  content?: string; // For text annotations
  createdAt: string;
}

/**
 * Create Project Request Interface
 */
export interface CreateProjectRequest {
  name: string;
  file?: File; // For upload
  filePath?: string; // For existing file
  settings?: Partial<PDFSettings>;
}

/**
 * Update Project Request Interface
 */
export interface UpdateProjectRequest {
  name?: string;
  settings?: Partial<PDFSettings>;
}

/**
 * Add Annotation Request Interface
 */
export interface AddAnnotationRequest {
  projectId: string;
  annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>;
}

/**
 * Update Annotation Request Interface
 */
export interface UpdateAnnotationRequest {
  annotationId: string;
  updates: Partial<Omit<Annotation, 'id' | 'type' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Export Project Request Interface
 */
export interface ExportProjectRequest {
  projectId: string;
  settings: ExportSettings;
}

/**
 * Default Settings
 */
export const DEFAULT_PDF_SETTINGS: PDFSettings = {
  defaultFontFamily: 'Helvetica',
  defaultFontSize: 14,
  defaultColor: '#000000',
  defaultStrokeWidth: 2,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
};

/**
 * Default Export Settings
 */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'pdf',
  quality: 90,
  pageRange: { type: 'all' },
  flattenAnnotations: true,
  includeMetadata: true,
};

/**
 * Max File Size (50MB)
 */
export const MAX_PDF_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Allowed PDF Versions
 */
export const ALLOWED_PDF_VERSIONS = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];

/**
 * Supported Export Formats
 */
export const SUPPORTED_EXPORT_FORMATS: ExportFormat[] = ['pdf', 'png', 'jpg'];

/**
 * Supported Annotation Types
 */
export const SUPPORTED_ANNOTATION_TYPES: AnnotationType[] = ['text', 'highlight', 'drawing', 'shape', 'image'];
