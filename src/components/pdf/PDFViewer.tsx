'use client';

/**
 * PDFViewer Component
 *
 * Renders PDF documents using PDF.js with text layer for text selection
 */

import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { PDFJS_OPTIONS } from '@/lib/pdf/pdfjs.config';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_OPTIONS.workerSrc;
}

interface PDFViewerProps {
  /** PDF file URL or data URL */
  fileUrl: string;

  /** Current page number (1-indexed) */
  currentPage: number;

  /** Zoom scale (1.0 = 100%) */
  scale?: number;

  /** Callback when page changes */
  onPageChange?: (pageNumber: number) => void;

  /** Callback when document loads */
  onDocumentLoad?: (pdf: PDFDocumentProxy) => void;

  /** Callback when page renders */
  onPageRender?: (page: PDFPageProxy) => void;

  /** Additional CSS classes */
  className?: string;
}

export function PDFViewer({
  fileUrl,
  currentPage,
  scale = PDFJS_OPTIONS.defaultScale,
  onPageChange,
  onDocumentLoad,
  onPageRender,
  className = '',
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerRef2 = useRef<TextLayer | null>(null);
  const onPageRenderRef = useRef(onPageRender);
  const onDocumentLoadRef = useRef(onDocumentLoad);

  // Update refs when callbacks change (avoids re-running effects)
  useEffect(() => {
    onPageRenderRef.current = onPageRender;
  }, [onPageRender]);

  useEffect(() => {
    onDocumentLoadRef.current = onDocumentLoad;
  }, [onDocumentLoad]);

  /**
   * Load PDF document
   */
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;

        if (!isMounted) return;

        setPdf(pdfDoc);

        if (onDocumentLoadRef.current) {
          onDocumentLoadRef.current(pdfDoc);
        }

        setLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF document');
        setLoading(false);
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [fileUrl]);

  /**
   * Render current page with text layer
   */
  useEffect(() => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Cancel any existing text layer
        if (textLayerRef2.current) {
          textLayerRef2.current.cancel();
          textLayerRef2.current = null;
        }

        // Ensure page number is valid
        const pageNum = Math.max(1, Math.min(currentPage, pdf.numPages));

        // Get page
        const page = await pdf.getPage(pageNum);

        // Calculate viewport
        const viewport = page.getViewport({ scale });

        // Get canvas and context
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas ref is null');
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Failed to get canvas context');
          return;
        }

        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        // Render text layer for text selection
        const textLayerDiv = textLayerRef.current;
        if (textLayerDiv) {
          // Clear previous text layer content
          textLayerDiv.innerHTML = '';
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;

          // Get text content
          const textContent = await page.getTextContent();

          // Create and render text layer
          textLayerRef2.current = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          });

          await textLayerRef2.current.render();
        }

        // Callback when page renders
        if (onPageRenderRef.current) {
          onPageRenderRef.current(page);
        }
      } catch (err: any) {
        // Ignore cancelled render tasks
        if (err?.name === 'RenderingCancelledException') {
          return;
        }
        console.error('Failed to render page:', err);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!pdf) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const newPage = Math.max(1, currentPage - 1);
        if (newPage !== currentPage && onPageChange) {
          onPageChange(newPage);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const newPage = Math.min(pdf.numPages, currentPage + 1);
        if (newPage !== currentPage && onPageChange) {
          onPageChange(newPage);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pdf, currentPage, onPageChange]);

  // Error state - only case where we don't show canvas
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-1">
        <div className="max-w-md rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Always render canvas to avoid ref issues - overlay loading state
  return (
    <div
      ref={containerRef}
      className={`relative flex h-full items-center justify-center overflow-auto bg-surface-1 ${className}`}
    >
      {/* Loading overlay - shown on top of canvas */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-1">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Canvas and text layer container */}
      <div className="p-4">
        <div
          className="relative"
          style={{ visibility: loading ? 'hidden' : 'visible' }}
        >
          {/* PDF Canvas */}
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          {/* Text Layer - positioned on top for text selection */}
          <div
            ref={textLayerRef}
            className="textLayer absolute top-0 left-0"
          />
        </div>
      </div>
    </div>
  );
}
