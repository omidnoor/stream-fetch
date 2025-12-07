/**
 * PDF Export API Route
 *
 * POST /api/pdf/export - Export PDF project with annotations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { ExportProjectRequest, ExportSettings } from '@/services/pdf';

/**
 * POST /api/pdf/export
 * Export a PDF project with flattened annotations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, settings } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Export settings are required' },
        { status: 400 }
      );
    }

    // Create export request
    const exportRequest: ExportProjectRequest = {
      projectId,
      settings: settings as ExportSettings,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Export project
    const result = await pdfService.exportProject(exportRequest);

    return NextResponse.json({
      success: true,
      data: {
        outputFile: result.outputFile,
        processingTime: result.processingTime,
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}
