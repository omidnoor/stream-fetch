/**
 * PDF Project API Routes
 *
 * POST /api/pdf/project - Create new project
 * GET /api/pdf/project - List all projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPDFService, mapToProjectDto, mapToProjectDtos } from '@/services/pdf';
import { errorHandler } from '@/middleware/error-handler';
import type { CreateProjectRequest } from '@/services/pdf';

/**
 * POST /api/pdf/project
 * Create a new PDF project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, filePath, settings } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project request
    const projectRequest: CreateProjectRequest = {
      name,
      filePath,
      settings,
    };

    // Get PDF service
    const pdfService = getPDFService();

    // Create project
    const project = await pdfService.createProject(projectRequest);

    // Map to DTO
    const projectDto = mapToProjectDto(project);

    return NextResponse.json(
      {
        success: true,
        data: projectDto,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * GET /api/pdf/project
 * List all PDF projects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Get PDF service
    const pdfService = getPDFService();

    // Get projects
    let projects = await pdfService.listProjects();

    // Filter by search query
    if (search) {
      const lowerSearch = search.toLowerCase();
      projects = projects.filter((p) => p.name.toLowerCase().includes(lowerSearch));
    }

    // Filter by status
    if (status && ['draft', 'processing', 'completed', 'failed'].includes(status)) {
      projects = projects.filter((p) => p.status === status);
    }

    // Map to DTOs
    const projectDtos = mapToProjectDtos(projects);

    return NextResponse.json({
      success: true,
      data: projectDtos,
      count: projectDtos.length,
    });
  } catch (error) {
    return errorHandler(error);
  }
}
