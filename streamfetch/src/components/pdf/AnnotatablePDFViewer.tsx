/**
 * Annotatable PDF Viewer Component
 *
 * PDF viewer with Fabric.js annotation overlay.
 * Mouse events are handled by Fabric.js internally via AnnotationManager.
 * Text selection in the PDF text layer triggers highlights when highlight tool is active.
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PDFViewer } from './PDFViewer';
import { useAnnotations } from '@/lib/pdf/annotations';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface AnnotatablePDFViewerProps {
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

  /** Additional CSS classes */
  className?: string;
}

export function AnnotatablePDFViewer({
  fileUrl,
  currentPage,
  scale = 1.0,
  onPageChange,
  onDocumentLoad,
  className = '',
}: AnnotatablePDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const { initializeManager, setPage, activeTool, addHighlightAnnotation } = useAnnotations();

  /**
   * Handle PDF document load
   */
  const handleDocumentLoad = useCallback((pdf: PDFDocumentProxy) => {
    onDocumentLoad?.(pdf);
  }, [onDocumentLoad]);

  /**
   * Handle page render - update canvas size
   */
  const handlePageRender = useCallback((page: PDFPageProxy) => {
    const viewport = page.getViewport({ scale });
    const newWidth = Math.round(viewport.width);
    const newHeight = Math.round(viewport.height);

    // Only update if size actually changed to prevent unnecessary re-renders
    setCanvasSize(prev => {
      if (prev.width === newWidth && prev.height === newHeight) {
        return prev;
      }
      return { width: newWidth, height: newHeight };
    });
  }, [scale]);

  /**
   * Initialize Fabric.js annotation canvas when size is known
   */
  useEffect(() => {
    if (!annotationCanvasRef.current || canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }

    initializeManager(annotationCanvasRef.current, canvasSize.width, canvasSize.height);
  }, [initializeManager, canvasSize]);

  /**
   * Update annotation page when PDF page changes
   */
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage, setPage]);

  /**
   * Handle text selection for highlighting
   * When highlight tool is active and user selects text, create highlight annotation
   */
  useEffect(() => {
    if (activeTool !== 'highlight') return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !pdfContainerRef.current) return;

      // Check if selection is within our PDF text layer
      const range = selection.getRangeAt(0);
      const textLayer = pdfContainerRef.current.querySelector('.textLayer');
      if (!textLayer || !textLayer.contains(range.commonAncestorContainer)) return;

      // Get selection bounding rect
      const selectionRects = range.getClientRects();
      if (selectionRects.length === 0) return;

      // Get the PDF canvas position for coordinate conversion
      const pdfCanvas = pdfContainerRef.current.querySelector('canvas');
      if (!pdfCanvas) return;
      const canvasRect = pdfCanvas.getBoundingClientRect();

      // Create highlights for each line of selected text
      for (let i = 0; i < selectionRects.length; i++) {
        const rect = selectionRects[i];

        // Convert to canvas-relative coordinates
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const width = rect.width;
        const height = rect.height;

        // Skip tiny rectangles (artifacts)
        if (width < 5 || height < 3) continue;

        addHighlightAnnotation(x, y, width, height);
      }

      // Clear the text selection after highlighting
      selection.removeAllRanges();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [activeTool, addHighlightAnnotation]);

  return (
    <div ref={containerRef} className={`relative h-full ${className}`}>
      {/* PDF Viewer Layer with text layer for selection */}
      <div ref={pdfContainerRef} className="h-full">
        <PDFViewer
          fileUrl={fileUrl}
          currentPage={currentPage}
          scale={scale}
          onPageChange={onPageChange}
          onDocumentLoad={handleDocumentLoad}
          onPageRender={handlePageRender}
          className="relative z-0"
        />
      </div>

      {/* Annotation Canvas Overlay - Fabric.js handles mouse events for most tools */}
      {/* Highlight tool uses text selection, so pointer events pass through to text layer */}
      {canvasSize.width > 0 && canvasSize.height > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{
            padding: '1rem', // Match PDFViewer padding
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: canvasSize.width,
              height: canvasSize.height,
              // Highlight tool uses text selection - pointer events pass through
              // All other tools (including areaMarker) interact with annotation canvas
              pointerEvents: activeTool && activeTool !== 'highlight' ? 'auto' : 'none',
            }}
          >
            <canvas
              ref={annotationCanvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: canvasSize.width,
                height: canvasSize.height,
                cursor: activeTool && activeTool !== 'highlight' ? 'crosshair' : 'text',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
