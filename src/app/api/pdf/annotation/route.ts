/**
 * PDF Annotation API Routes
 *
 * POST /api/pdf/annotation - Add annotation to project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService, mapToAnnotationDto } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { AddAnnotationRequest } from '@/services/pdf';

/**
 * POST /api/pdf/annotation
 * Add a new annotation to a PDF project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, annotation } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!annotation) {
      return NextResponse.json(
        { success: false, error: 'Annotation data is required' },
        { status: 400 }
      );
    }

    // Create annotation request
    const annotationRequest: AddAnnotationRequest = {
      projectId,
      annotation,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Add annotation
    const createdAnnotation = await pdfService.addAnnotation(annotationRequest);

    // Map to DTO
    const annotationDto = mapToAnnotationDto(createdAnnotation);

    return NextResponse.json(
      {
        success: true,
        data: annotationDto,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}
