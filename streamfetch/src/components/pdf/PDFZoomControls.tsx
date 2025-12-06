'use client';

/**
 * PDFZoomControls Component
 *
 * Provides zoom in/out controls for PDF viewer
 */

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { PDFJS_OPTIONS } from '@/lib/pdf/pdfjs.config';

interface PDFZoomControlsProps {
  /** Current zoom scale (1.0 = 100%) */
  scale: number;

  /** Callback when zoom changes */
  onZoomChange: (scale: number) => void;

  /** Callback for fit to width */
  onFitToWidth?: () => void;

  /** Additional CSS classes */
  className?: string;
}

export function PDFZoomControls({
  scale,
  onZoomChange,
  onFitToWidth,
  className = '',
}: PDFZoomControlsProps) {
  const handleZoomIn = () => {
    const newScale = Math.min(
      scale + PDFJS_OPTIONS.zoomStep,
      PDFJS_OPTIONS.maxScale
    );
    onZoomChange(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(
      scale - PDFJS_OPTIONS.zoomStep,
      PDFJS_OPTIONS.minScale
    );
    onZoomChange(newScale);
  };

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        disabled={scale <= PDFJS_OPTIONS.minScale}
        className="rounded-lg bg-zinc-800 p-2 text-gray-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      {/* Zoom percentage */}
      <div className="min-w-[60px] text-center text-sm font-medium text-gray-300">
        {zoomPercentage}%
      </div>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        disabled={scale >= PDFJS_OPTIONS.maxScale}
        className="rounded-lg bg-zinc-800 p-2 text-gray-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      {/* Fit to Width */}
      {onFitToWidth && (
        <button
          onClick={onFitToWidth}
          className="rounded-lg bg-zinc-800 p-2 text-gray-300 transition-colors hover:bg-zinc-700"
          aria-label="Fit to width"
          title="Fit to width"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
