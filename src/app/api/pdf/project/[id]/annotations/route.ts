/**
 * PDF Project Annotations API Routes
 *
 * Endpoints for saving and loading PDF annotations
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECTS_DIR = path.join(process.cwd(), 'data', 'pdf-projects');

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pdf/project/:id/annotations
 * Load annotations for a PDF project
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const annotationsPath = path.join(PROJECTS_DIR, id, 'annotations.json');

    try {
      const data = await fs.readFile(annotationsPath, 'utf-8');
      const annotations = JSON.parse(data);

      return NextResponse.json({
        success: true,
        data: annotations,
      });
    } catch (error) {
      // If file doesn't exist, return empty annotations
      return NextResponse.json({
        success: true,
        data: {},
      });
    }
  } catch (error) {
    console.error('Failed to load annotations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load annotations',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pdf/project/:id/annotations
 * Save annotations for a PDF project
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { annotations } = body;

    if (!annotations) {
      return NextResponse.json(
        {
          success: false,
          error: 'Annotations data is required',
        },
        { status: 400 }
      );
    }

    const projectPath = path.join(PROJECTS_DIR, id);
    const annotationsPath = path.join(projectPath, 'annotations.json');

    // Ensure project directory exists
    await fs.mkdir(projectPath, { recursive: true });

    // Convert Map to object for JSON serialization
    const annotationsData: Record<string, any[]> = {};

    // Handle both Map and plain object formats
    if (annotations instanceof Map) {
      annotations.forEach((value, key) => {
        annotationsData[key.toString()] = value;
      });
    } else if (typeof annotations === 'object') {
      // Already an object, use as-is
      Object.assign(annotationsData, annotations);
    }

    // Save annotations
    await fs.writeFile(
      annotationsPath,
      JSON.stringify(annotationsData, null, 2),
      'utf-8'
    );

    // Update project metadata
    const metadataPath = path.join(projectPath, 'metadata.json');
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

      // Count total annotations
      const annotationCount = Object.values(annotationsData).reduce(
        (sum, pageAnnotations) => sum + pageAnnotations.length,
        0
      );

      metadata.annotationCount = annotationCount;
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to update project metadata:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Annotations saved successfully',
    });
  } catch (error) {
    console.error('Failed to save annotations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save annotations',
      },
      { status: 500 }
    );
  }
}
