/**
 * PDF Upload API Route
 *
 * POST /api/pdf/upload
 * Handles PDF file uploads and creates new projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { CreateProjectRequest } from '@/services/pdf';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project request
    const projectRequest: CreateProjectRequest = {
      name,
      file,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Create project
    const project = await pdfService.createProject(projectRequest);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          name: project.name,
          status: project.status,
          pageCount: project.metadata.pageCount,
          fileSize: project.metadata.fileSize,
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}
