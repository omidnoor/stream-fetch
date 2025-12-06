/**
 * PDF Service Factory
 *
 * Factory pattern for creating and managing PDF service instances.
 * Following the existing factory pattern used in dubbing and editor services.
 */

import { PDFService } from './pdf.service';
import { getPDFRepository } from './pdf.repository';

/**
 * Global service instance that persists across Next.js API calls
 */
declare global {
  // eslint-disable-next-line no-var
  var __pdfService: PDFService | undefined;
}

/**
 * Get PDF Service instance (singleton pattern with global persistence)
 *
 * Creates a new PDF service if one doesn't exist, otherwise returns the existing instance.
 * Uses globalThis to persist across Next.js serverless API invocations.
 *
 * @returns PDFService instance
 */
export function getPDFService(): PDFService {
  if (!globalThis.__pdfService) {
    const repository = getPDFRepository();
    globalThis.__pdfService = new PDFService(repository);
  }

  return globalThis.__pdfService;
}

/**
 * Reset PDF Service instance
 * Useful for testing or when you need to reinitialize the service
 */
export function resetPDFService(): void {
  globalThis.__pdfService = undefined;
}
