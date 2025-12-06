"use client";

/**
 * PDFViewerWithSidebar Component
 *
 * Complete PDF viewing interface with thumbnail sidebar.
 * Combines PDFViewer and PDFThumbnailSidebar for a full-featured experience.
 */

import { useState, useCallback } from "react";
import { PDFDocumentProxy } from "pdfjs-dist";
import { PDFViewer } from "./PDFViewer";
import PDFThumbnailSidebar from "./PDFThumbnailSidebar";

interface PDFViewerWithSidebarProps {
  pdfUrl: string;
  initialZoom?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function PDFViewerWithSidebar({
  pdfUrl,
  initialZoom = 1.0,
  onPageChange,
  className = "",
}: PDFViewerWithSidebarProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Stable callback for document load - PDFViewer handles all loading
  const handleDocumentLoad = useCallback((pdf: PDFDocumentProxy) => {
    setPdfDoc(pdf);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  }, [onPageChange]);

  return (
    <div className={`flex h-full ${className}`}>
      {/* Thumbnail Sidebar - only shows when pdfDoc is loaded */}
      <PDFThumbnailSidebar
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      {/* Main Viewer - handles its own loading/error states */}
      <div className="flex-1">
        <PDFViewer
          fileUrl={pdfUrl}
          currentPage={currentPage}
          scale={initialZoom}
          onPageChange={handlePageChange}
          onDocumentLoad={handleDocumentLoad}
        />
      </div>
    </div>
  );
}
