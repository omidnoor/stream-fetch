"use client";

/**
 * PDFThumbnail Component
 *
 * Renders a small thumbnail preview of a PDF page.
 * Used in the sidebar for quick page navigation.
 */

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFPageProxy } from "pdfjs-dist";
import { Loader2, AlertCircle } from "lucide-react";

interface PDFThumbnailProps {
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  isActive?: boolean;
  onClick?: (pageNum: number) => void;
  className?: string;
}

export default function PDFThumbnail({
  pageNum,
  pdfDoc,
  isActive = false,
  onClick,
  className = "",
}: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let renderTask: any = null;

    const renderThumbnail = async () => {
      try {
        setLoading(true);
        setError(null);

        const page: PDFPageProxy = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;

        if (!canvas || !mounted) return;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not get canvas context");
        }

        // Calculate scale for thumbnail (smaller size)
        const viewport = page.getViewport({ scale: 1 });
        const thumbnailWidth = 120; // Fixed thumbnail width
        const scale = thumbnailWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (mounted) {
          setLoading(false);
        }
      } catch (err: any) {
        // Ignore cancellation errors
        if (err?.name === "RenderingCancelledException") {
          return;
        }

        console.error(`Error rendering thumbnail ${pageNum}:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render");
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      mounted = false;
      if (renderTask) {
        renderTask.cancel?.();
      }
    };
  }, [pdfDoc, pageNum]);

  const handleClick = () => {
    onClick?.(pageNum);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-full aspect-[8.5/11] rounded overflow-hidden
        border-2 transition-all duration-200
        ${
          isActive
            ? "border-primary ring-2 ring-primary/50"
            : "border-gray-800 hover:border-gray-600"
        }
        ${className}
      `}
      aria-label={`Go to page ${pageNum}`}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain bg-gray-900 ${
          loading ? "hidden" : "block"
        }`}
      />

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <AlertCircle className="h-4 w-4 text-red-500" />
        </div>
      )}

      {/* Page Number Overlay */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <span
          className={`
          text-xs font-medium px-2 py-0.5 rounded
          ${
            isActive
              ? "bg-primary text-white"
              : "bg-black/70 text-gray-300"
          }
        `}
        >
          {pageNum}
        </span>
      </div>
    </button>
  );
}
