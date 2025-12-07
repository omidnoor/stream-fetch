/**
 * PDF Component Types
 *
 * Type definitions for PDF viewer components
 */

import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

export interface PDFViewerProps {
  pdfUrl: string;
  initialZoom?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export interface PDFPageProps {
  pageNum: number;
  pdfDoc: PDFDocumentProxy;
  scale?: number;
  rotation?: number;
  className?: string;
  onRenderComplete?: () => void;
}

export interface PDFThumbnailProps {
  pageNum: number;
  pdfDoc: PDFDocumentProxy;
  isActive?: boolean;
  onClick?: (pageNum: number) => void;
  className?: string;
}

export interface PDFThumbnailSidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  onPageSelect: (pageNum: number) => void;
  className?: string;
}

export interface PDFViewerWithSidebarProps {
  pdfUrl: string;
  initialZoom?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export interface PDFViewerState {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  loading: boolean;
  error: string | null;
  rendering: boolean;
}

export interface PDFRenderOptions {
  scale: number;
  rotation: number;
}

export interface PDFLoadingTask {
  promise: Promise<PDFDocumentProxy>;
  destroy: () => void;
}

// Re-export PDF.js types for convenience
export type { PDFDocumentProxy, PDFPageProxy };
