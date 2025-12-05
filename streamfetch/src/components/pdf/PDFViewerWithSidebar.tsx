"use client";

/**
 * PDFViewerWithSidebar Component
 *
 * Complete PDF viewing interface with thumbnail sidebar.
 * Combines PDFViewer and PDFThumbnailSidebar for a full-featured experience.
 */

import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist";
import PDFViewer from "./PDFViewer";
import PDFThumbnailSidebar from "./PDFThumbnailSidebar";
import { Loader2, AlertCircle } from "lucide-react";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        if (!mounted) return;

        setPdfDoc(pdf);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load PDF document"
          );
          setLoading(false);
        }
      }
    };

    if (pdfUrl) {
      loadPDF();
    }

    return () => {
      mounted = false;
    };
  }, [pdfUrl]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-[#0a0a0a] ${className}`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-[#0a0a0a] ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load PDF</h3>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Thumbnail Sidebar */}
      <PDFThumbnailSidebar
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      {/* Main Viewer */}
      <div className="flex-1">
        <PDFViewer
          pdfUrl={pdfUrl}
          initialZoom={initialZoom}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
