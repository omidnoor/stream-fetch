"use client";

/**
 * PDFViewer Component
 *
 * Main PDF viewer with zoom, navigation, and page rendering controls.
 * Uses PDF.js for rendering PDF documents in the browser.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertCircle
} from "lucide-react";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfUrl: string;
  initialZoom?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export default function PDFViewer({
  pdfUrl,
  initialZoom = 1.0,
  onPageChange,
  className = "",
}: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setTotalPages(pdf.numPages);
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

  // Render current page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current || rendering) return;

      try {
        setRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not get canvas context");
        }

        // Calculate scale based on zoom and container width
        const viewport = page.getViewport({ scale: 1, rotation });
        const containerWidth = containerRef.current?.clientWidth || 800;
        const scale = (containerWidth / viewport.width) * zoom;

        const scaledViewport = page.getViewport({ scale, rotation });

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
        setRendering(false);
      } catch (err) {
        console.error("Error rendering page:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render page"
        );
        setRendering(false);
      }
    },
    [pdfDoc, zoom, rotation, rendering]
  );

  // Re-render when page, zoom, or rotation changes
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, zoom, rotation, renderPage]);

  // Navigation handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      onPageChange?.(page);
    }
  };

  // Zoom handlers
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1.0);
  };

  // Rotation handler
  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPreviousPage();
      } else if (e.key === "ArrowRight") {
        goToNextPage();
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
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
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load PDF</h3>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-[#1a1a1a] border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="border-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 px-3">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="w-16 px-2 py-1 text-sm text-center bg-[#0a0a0a] border border-gray-700 rounded text-white"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-gray-400">/ {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="border-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className="border-gray-700"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="px-3 min-w-[80px] text-center">
            <span className="text-sm text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={zoom >= 3.0}
            className="border-gray-700"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-700 mx-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={rotateClockwise}
            className="border-gray-700"
            title="Rotate Clockwise"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#0a0a0a] flex items-start justify-center p-8"
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-2xl bg-white"
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="bg-[#1a1a1a] border-t border-gray-800 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Use arrow keys to navigate, +/- to zoom, or click controls above
        </p>
      </div>
    </div>
  );
}
