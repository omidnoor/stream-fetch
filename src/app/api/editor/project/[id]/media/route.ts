/**
 * API Route: Project Media Assets
 *
 * GET  /api/editor/project/[id]/media - List all assets
 * POST /api/editor/project/[id]/media - Upload new asset
 */

import { NextRequest, NextResponse } from "next/server";
import { getMediaService } from "@/services/editor";
import { FFmpegService } from "@/services/ffmpeg/ffmpeg.service";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET - List all media assets for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const ffmpegService = new FFmpegService();
    const mediaService = getMediaService(ffmpegService);

    const assets = await mediaService.list(projectId);

    // Transform assets for response (convert paths to URLs)
    const assetsWithUrls = assets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      filename: asset.originalFilename,
      size: asset.size,
      mimeType: asset.mimeType,
      thumbnail: asset.thumbnail
        ? mediaService.getThumbnailUrl(projectId, asset.id)
        : undefined,
      duration: asset.metadata.duration,
      width: asset.metadata.width,
      height: asset.metadata.height,
      createdAt: asset.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: assetsWithUrls,
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * POST - Upload a new media asset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_FILE",
            message: "No file provided",
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "File size exceeds 500MB limit",
          },
        },
        { status: 400 }
      );
    }

    const ffmpegService = new FFmpegService();
    const mediaService = getMediaService(ffmpegService);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload the file
    const asset = await mediaService.upload(
      projectId,
      file.name,
      buffer,
      file.type
    );

    console.log(`[API] Media asset uploaded: ${asset.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        type: asset.type,
        filename: asset.originalFilename,
        size: asset.size,
        mimeType: asset.mimeType,
        thumbnail: asset.thumbnail
          ? mediaService.getThumbnailUrl(projectId, asset.id)
          : undefined,
        duration: asset.metadata.duration,
        width: asset.metadata.width,
        height: asset.metadata.height,
        createdAt: asset.createdAt,
      },
      message: "Asset uploaded successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
