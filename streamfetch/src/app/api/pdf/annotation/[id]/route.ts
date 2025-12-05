/**
 * PDF Annotation Detail API Routes
 *
 * PUT /api/pdf/annotation/[id] - Update annotation
 * DELETE /api/pdf/annotation/[id] - Delete annotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService, mapToAnnotationDto } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { UpdateAnnotationRequest } from '@/services/pdf';

/**
 * PUT /api/pdf/annotation/[id]
 * Update an annotation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateRequest: UpdateAnnotationRequest = {
      annotationId: id,
      updates: body,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Update annotation
    const annotation = await pdfService.updateAnnotation(updateRequest);

    // Map to DTO
    const annotationDto = mapToAnnotationDto(annotation);

    return NextResponse.json({
      success: true,
      data: annotationDto,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE /api/pdf/annotation/[id]
 * Delete an annotation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get PDF service
    const pdfService = getPDFService();

    // Delete annotation
    await pdfService.removeAnnotation(projectId, id);

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted successfully',
    });
  } catch (error) {
    return errorHandler(error);
  }
}
