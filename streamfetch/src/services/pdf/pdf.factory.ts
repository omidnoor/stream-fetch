/**
 * PDF Service Factory
 *
 * Factory pattern for creating and managing PDF service instances.
 * Following the existing factory pattern used in dubbing and editor services.
 */

import { PDFService } from './pdf.service';
import { getPDFRepository } from './pdf.repository';

/**
 * Singleton PDF service instance
 */
let pdfServiceInstance: PDFService | null = null;

/**
 * Get PDF Service instance (singleton pattern)
 *
 * Creates a new PDF service if one doesn't exist, otherwise returns the existing instance.
 * This ensures that the same service instance is used throughout the application.
 *
 * @returns PDFService instance
 */
export function getPDFService(): PDFService {
  if (!pdfServiceInstance) {
    const repository = getPDFRepository();
    pdfServiceInstance = new PDFService(repository);
  }

  return pdfServiceInstance;
}

/**
 * Reset PDF Service instance
 * Useful for testing or when you need to reinitialize the service
 */
export function resetPDFService(): void {
  pdfServiceInstance = null;
}
