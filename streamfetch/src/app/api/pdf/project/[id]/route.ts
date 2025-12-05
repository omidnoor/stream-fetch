/**
 * PDF Project Detail API Routes
 *
 * GET /api/pdf/project/[id] - Get project by ID
 * PUT /api/pdf/project/[id] - Update project
 * DELETE /api/pdf/project/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService, mapToProjectDto } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { UpdateProjectRequest } from '@/services/pdf';

/**
 * GET /api/pdf/project/[id]
 * Get a specific PDF project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get PDF service
    const pdfService = getPDFService();

    // Get project
    const project = await pdfService.getProject(id);

    // Map to DTO
    const projectDto = mapToProjectDto(project);

    return NextResponse.json({
      success: true,
      data: projectDto,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * PUT /api/pdf/project/[id]
 * Update a PDF project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateRequest: UpdateProjectRequest = {
      name: body.name,
      settings: body.settings,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Update project
    const project = await pdfService.updateProject(id, updateRequest);

    // Map to DTO
    const projectDto = mapToProjectDto(project);

    return NextResponse.json({
      success: true,
      data: projectDto,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE /api/pdf/project/[id]
 * Delete a PDF project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get PDF service
    const pdfService = getPDFService();

    // Delete project
    await pdfService.deleteProject(id);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return errorHandler(error);
  }
}
