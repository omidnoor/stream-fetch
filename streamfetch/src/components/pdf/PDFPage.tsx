"use client";

/**
 * PDFPage Component
 *
 * Renders a single PDF page on a canvas element.
 * Used for detailed page rendering in the main viewer area.
 */

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFPageProxy } from "pdfjs-dist";
import { Loader2, AlertCircle } from "lucide-react";

interface PDFPageProps {
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  scale?: number;
  rotation?: number;
  className?: string;
  onRenderComplete?: () => void;
}

export default function PDFPage({
  pageNum,
  pdfDoc,
  scale = 1.0,
  rotation = 0,
  className = "",
  onRenderComplete,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);

  // Load the page
  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedPage = await pdfDoc.getPage(pageNum);

        if (!mounted) return;

        setPage(loadedPage);
        setLoading(false);
      } catch (err) {
        console.error(`Error loading page ${pageNum}:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load page");
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      mounted = false;
    };
  }, [pdfDoc, pageNum]);

  // Render the page
  useEffect(() => {
    if (!page || !canvasRef.current) return;

    let mounted = true;

    const renderPage = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not get canvas context");
        }

        const viewport = page.getViewport({ scale, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        if (mounted) {
          onRenderComplete?.();
        }
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render page");
        }
      }
    };

    renderPage();

    return () => {
      mounted = false;
    };
  }, [page, scale, rotation, pageNum, onRenderComplete]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-900 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Failed to load page {pageNum}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="bg-white shadow-lg"
        style={{ display: loading ? "none" : "block" }}
      />
      {loading && (
        <div className="flex items-center justify-center p-8 bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
