/**
 * PDF Service
 *
 * Main business logic for PDF editing operations.
 * Integrates PDF.js (viewing/rendering) and PDF-Lib (manipulation).
 * Following the existing service pattern used in dubbing and editor services.
 */

import { PDFDocument, rgb, degrees, StandardFonts, PDFPage as PDFLibPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFRepository } from './pdf.repository';
import type {
  PDFProject,
  Annotation,
  PDFMetadata,
  PDFPage,
  PDFSettings,
  ExportSettings,
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
  TextAnnotation,
  DrawingAnnotation,
  ShapeAnnotation,
  ImageAnnotation,
  DEFAULT_PDF_SETTINGS,
} from './pdf.types';
import {
  validatePDFFile,
  validateProjectData,
  validateAnnotation,
  validateExportSettings,
  validatePageNumbers,
} from './pdf.validator';
import { generateId, generateFileName } from './pdf.mapper';
import {
  PDFLoadError,
  PDFRenderError,
  PDFProcessingError,
  PDFExportError,
  PDFMergeError,
  PDFSplitError,
  PDFCompressionError,
  PDFWatermarkError,
  PDFProjectNotFoundError,
  AnnotationNotFoundError,
} from '@/lib/errors/pdf.errors';

/**
 * Configure PDF.js worker
 * Note: In a real implementation, you'd need to configure the worker path properly
 */
if (typeof window === 'undefined') {
  // Server-side configuration
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * PDF Service Class
 */
export class PDFService {
  constructor(private repository: PDFRepository) {}

  /**
   * Create new PDF project
   */
  async createProject(request: CreateProjectRequest): Promise<PDFProject> {
    const { name, file, filePath, settings } = request;

    // Validate project data
    validateProjectData({ name });

    // Validate PDF file if provided
    if (file) {
      validatePDFFile(file);
    }

    // Load PDF document
    const pdfDoc = await this.loadPDFDocument(file, filePath);

    // Extract metadata
    const metadata = await this.extractMetadata(pdfDoc, file);

    // Generate pages data
    const pages = await this.generatePagesData(pdfDoc);

    // Create project
    const project: PDFProject = {
      id: generateId(),
      name,
      status: 'draft',
      originalFile: filePath || (file ? `temp/${generateFileName(name)}` : ''),
      metadata,
      pages,
      annotations: [],
      settings: { ...DEFAULT_PDF_SETTINGS, ...settings },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to repository
    return this.repository.saveProject(project);
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<PDFProject> {
    return this.repository.getProject(projectId);
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<PDFProject[]> {
    return this.repository.listProjects();
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<PDFProject> {
    const project = await this.repository.getProject(projectId);

    const updates: Partial<PDFProject> = {};

    if (request.name) {
      validateProjectData({ name: request.name });
      updates.name = request.name;
    }

    if (request.settings) {
      updates.settings = { ...project.settings, ...request.settings };
    }

    return this.repository.updateProject(projectId, updates);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.repository.deleteProject(projectId);
  }

  /**
   * Add annotation to project
   */
  async addAnnotation(request: AddAnnotationRequest): Promise<Annotation> {
    const { projectId, annotation } = request;

    // Validate annotation
    validateAnnotation(annotation);

    // Get project
    const project = await this.repository.getProject(projectId);

    // Verify page number is valid
    if (annotation.pageNumber > project.metadata.pageCount) {
      throw new PDFProcessingError(`Page ${annotation.pageNumber} does not exist in project`, {
        pageNumber: annotation.pageNumber,
        totalPages: project.metadata.pageCount,
      });
    }

    // Create full annotation with generated ID and timestamps
    const fullAnnotation: Annotation = {
      ...annotation,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Annotation;

    // Save annotation
    await this.repository.saveAnnotation(fullAnnotation);

    // Add to project's annotations array
    project.annotations.push(fullAnnotation);
    project.updatedAt = new Date();
    await this.repository.saveProject(project);

    return fullAnnotation;
  }

  /**
   * Update annotation
   */
  async updateAnnotation(request: UpdateAnnotationRequest): Promise<Annotation> {
    const { annotationId, updates } = request;

    // Validate updates
    if (Object.keys(updates).length > 0) {
      validateAnnotation({ ...updates, id: annotationId } as any);
    }

    return this.repository.updateAnnotation(annotationId, updates);
  }

  /**
   * Remove annotation from project
   */
  async removeAnnotation(projectId: string, annotationId: string): Promise<void> {
    await this.repository.deleteAnnotation(projectId, annotationId);
  }

  /**
   * Export project with annotations
   */
  async exportProject(request: ExportProjectRequest): Promise<ProcessingResult> {
    const startTime = Date.now();
    const { projectId, settings } = request;

    // Validate export settings
    validateExportSettings(settings);

    const project = await this.repository.getProject(projectId);

    try {
      // Update status
      await this.repository.updateProjectStatus(projectId, 'processing');

      // Load PDF document
      const pdfDoc = await this.loadPDFDocument(undefined, project.originalFile);

      // Flatten annotations into PDF if requested
      if (settings.flattenAnnotations && project.annotations.length > 0) {
        await this.flattenAnnotations(pdfDoc, project.annotations);
      }

      // Export based on format
      let outputFile: string;

      if (settings.format === 'pdf') {
        outputFile = await this.exportAsPDF(pdfDoc, project, settings);
      } else {
        outputFile = await this.exportAsImage(pdfDoc, project, settings);
      }

      // Update status
      await this.repository.updateProjectStatus(projectId, 'completed');

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        outputFile,
        processingTime,
      };
    } catch (error) {
      // Update status to failed
      await this.repository.updateProjectStatus(projectId, 'failed');

      throw new PDFExportError(
        `Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { projectId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Merge multiple PDF files
   */
  async mergePDFs(options: MergeOptions): Promise<ProcessingResult> {
    const startTime = Date.now();
    const { files, outputFileName } = options;

    try {
      // Create new PDF document
      const mergedPdf = await PDFDocument.create();

      // Process each file
      for (const filePath of files) {
        const pdfDoc = await this.loadPDFDocument(undefined, filePath);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      // Save merged PDF
      const pdfBytes = await mergedPdf.save();
      const outputFile = outputFileName || `merged-${Date.now()}.pdf`;

      // In real implementation, save to disk/storage
      // For now, return the output filename

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        outputFile,
        processingTime,
      };
    } catch (error) {
      throw new PDFMergeError(
        `Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { files, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Split PDF into multiple files
   */
  async splitPDF(options: SplitOptions): Promise<ProcessingResult> {
    const startTime = Date.now();
    const { filePath, splitPoints } = options;

    try {
      // Load PDF
      const pdfDoc = await this.loadPDFDocument(undefined, filePath);
      const totalPages = pdfDoc.getPageCount();

      // Validate split points
      validatePageNumbers(splitPoints, totalPages);

      const outputFiles: string[] = [];

      // Create splits
      for (let i = 0; i < splitPoints.length; i++) {
        const newPdf = await PDFDocument.create();
        const startPage = i === 0 ? 0 : splitPoints[i - 1];
        const endPage = splitPoints[i];

        const pageIndices = Array.from(
          { length: endPage - startPage },
          (_, idx) => startPage + idx
        );

        const pages = await newPdf.copyPages(pdfDoc, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));

        const outputFile = `split-${i + 1}-${Date.now()}.pdf`;
        outputFiles.push(outputFile);

        // In real implementation, save to disk
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        outputFiles,
        processingTime,
      };
    } catch (error) {
      throw new PDFSplitError(
        `Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { filePath, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Rotate pages in PDF
   */
  async rotatePages(projectId: string, pageNumbers: number[], degrees: number): Promise<PDFProject> {
    const project = await this.repository.getProject(projectId);

    // Validate page numbers
    validatePageNumbers(pageNumbers, project.metadata.pageCount);

    // Update page rotation in project data
    for (const pageNum of pageNumbers) {
      const page = project.pages[pageNum - 1];
      page.rotation = (page.rotation + degrees) % 360;
    }

    project.updatedAt = new Date();
    return this.repository.saveProject(project);
  }

  /**
   * Delete pages from PDF
   */
  async deletePages(projectId: string, pageNumbers: number[]): Promise<PDFProject> {
    const project = await this.repository.getProject(projectId);

    // Validate page numbers
    validatePageNumbers(pageNumbers, project.metadata.pageCount);

    // Remove pages (in real implementation, would modify the actual PDF)
    project.pages = project.pages.filter((_, idx) => !pageNumbers.includes(idx + 1));

    // Update page count
    project.metadata.pageCount = project.pages.length;

    // Remove annotations on deleted pages
    project.annotations = project.annotations.filter(
      (ann) => !pageNumbers.includes(ann.pageNumber)
    );

    project.updatedAt = new Date();
    return this.repository.saveProject(project);
  }

  /**
   * Private helper methods
   */

  /**
   * Load PDF document from file or buffer
   */
  private async loadPDFDocument(
    file?: File | Buffer,
    filePath?: string
  ): Promise<PDFDocument> {
    try {
      let pdfBytes: Uint8Array;

      if (file instanceof File) {
        pdfBytes = new Uint8Array(await file.arrayBuffer());
      } else if (file instanceof Buffer) {
        pdfBytes = new Uint8Array(file);
      } else if (filePath) {
        // In real implementation, read from file system
        throw new PDFLoadError('File system access not implemented');
      } else {
        throw new PDFLoadError('No PDF file or path provided');
      }

      return await PDFDocument.load(pdfBytes);
    } catch (error) {
      throw new PDFLoadError(
        `Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract PDF metadata
   */
  private async extractMetadata(
    pdfDoc: PDFDocument,
    file?: File
  ): Promise<PDFMetadata> {
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || undefined;
    const author = pdfDoc.getAuthor() || undefined;
    const subject = pdfDoc.getSubject() || undefined;
    const keywords = pdfDoc.getKeywords() || undefined;
    const creator = pdfDoc.getCreator() || undefined;
    const producer = pdfDoc.getProducer() || undefined;
    const creationDate = pdfDoc.getCreationDate() || undefined;
    const modificationDate = pdfDoc.getModificationDate() || undefined;

    // Get file size
    const fileSize = file ? file.size : 0;

    return {
      title,
      author,
      subject,
      keywords,
      creator,
      producer,
      creationDate,
      modificationDate,
      pageCount,
      fileSize,
      version: '1.7', // Default, would parse from actual PDF
    };
  }

  /**
   * Generate pages data from PDF
   */
  private async generatePagesData(pdfDoc: PDFDocument): Promise<PDFPage[]> {
    const pages: PDFPage[] = [];
    const pdfPages = pdfDoc.getPages();

    for (let i = 0; i < pdfPages.length; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();

      pages.push({
        pageNumber: i + 1,
        width,
        height,
        rotation: page.getRotation().angle,
        annotations: [],
      });
    }

    return pages;
  }

  /**
   * Flatten annotations into PDF
   */
  private async flattenAnnotations(
    pdfDoc: PDFDocument,
    annotations: Annotation[]
  ): Promise<void> {
    const pages = pdfDoc.getPages();

    for (const annotation of annotations) {
      const page = pages[annotation.pageNumber - 1];

      if (!page) continue;

      switch (annotation.type) {
        case 'text':
          await this.addTextToPDF(page, annotation as TextAnnotation);
          break;
        case 'drawing':
          await this.addDrawingToPDF(page, annotation as DrawingAnnotation);
          break;
        case 'shape':
          await this.addShapeToPDF(page, annotation as ShapeAnnotation);
          break;
        // Add more annotation types as needed
      }
    }
  }

  /**
   * Add text annotation to PDF page
   */
  private async addTextToPDF(page: PDFLibPage, annotation: TextAnnotation): Promise<void> {
    const font = await page.doc.embedFont(StandardFonts.Helvetica);

    page.drawText(annotation.content, {
      x: annotation.x,
      y: page.getHeight() - annotation.y - annotation.fontSize, // Flip Y coordinate
      size: annotation.fontSize,
      font,
      color: rgb(0, 0, 0), // Would parse from annotation.color
      opacity: annotation.opacity,
    });
  }

  /**
   * Add drawing to PDF page (simplified)
   */
  private async addDrawingToPDF(page: PDFLibPage, annotation: DrawingAnnotation): Promise<void> {
    // Drawing implementation would use PDF-Lib's drawing primitives
    // This is a placeholder
  }

  /**
   * Add shape to PDF page
   */
  private async addShapeToPDF(page: PDFLibPage, annotation: ShapeAnnotation): Promise<void> {
    const { shapeType, x, y, width, height } = annotation;

    if (shapeType === 'rectangle') {
      page.drawRectangle({
        x,
        y: page.getHeight() - y - height,
        width,
        height,
        borderColor: rgb(0, 0, 0),
        borderWidth: annotation.strokeWidth,
        opacity: annotation.opacity,
      });
    }

    // Add more shape types as needed
  }

  /**
   * Export as PDF
   */
  private async exportAsPDF(
    pdfDoc: PDFDocument,
    project: PDFProject,
    settings: ExportSettings
  ): Promise<string> {
    const pdfBytes = await pdfDoc.save();
    const outputFile = settings.outputFileName || generateFileName(project.name, 'pdf');

    // In real implementation, save to disk/storage
    return outputFile;
  }

  /**
   * Export as image (PNG/JPG)
   */
  private async exportAsImage(
    pdfDoc: PDFDocument,
    project: PDFProject,
    settings: ExportSettings
  ): Promise<string> {
    // This would use PDF.js to render pages as images
    // and then save them
    const outputFile = settings.outputFileName || generateFileName(
      project.name,
      settings.format === 'png' ? 'png' : 'jpg'
    );

    return outputFile;
  }
}
