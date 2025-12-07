/**
 * PDF.js Configuration
 *
 * Configures PDF.js for client-side rendering in Next.js
 */

/**
 * PDF rendering options
 */
export const PDFJS_OPTIONS = {
  // Standard DPI for screen rendering
  standardDPI: 96,

  // High DPI for retina displays
  highDPI: 192,

  // Default scale for initial render
  defaultScale: 1.0,

  // Maximum scale allowed
  maxScale: 3.0,

  // Minimum scale allowed
  minScale: 0.25,

  // Zoom step for zoom in/out buttons
  zoomStep: 0.25,

  // Enable text layer for text selection
  enableTextLayer: true,

  // Enable annotation layer
  enableAnnotationLayer: false, // We use Fabric.js instead

  // Worker source
  workerSrc: '/pdf.worker.min.mjs',
} as const;

/**
 * Calculate scale based on container width and page dimensions
 */
export function calculateScale(
  pageWidth: number,
  containerWidth: number,
  maxScale: number = PDFJS_OPTIONS.maxScale
): number {
  const scale = containerWidth / pageWidth;
  return Math.min(scale, maxScale);
}
