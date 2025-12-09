/**
 * API Route: Single Media Asset
 *
 * GET    /api/editor/project/[id]/media/[assetId] - Get asset details
 * DELETE /api/editor/project/[id]/media/[assetId] - Delete asset
 */

import { NextRequest, NextResponse } from "next/server";
import { getMediaService } from "@/services/editor";
import { FFmpegService } from "@/services/ffmpeg/ffmpeg.service";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET - Get a single media asset details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;

    const ffmpegService = new FFmpegService();
    const mediaService = getMediaService(ffmpegService);

    const asset = await mediaService.get(projectId, assetId);

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ASSET_NOT_FOUND",
            message: `Asset not found: ${assetId}`,
          },
        },
        { status: 404 }
      );
    }

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
        metadata: asset.metadata,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}

/**
 * DELETE - Delete a media asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;

    const ffmpegService = new FFmpegService();
    const mediaService = getMediaService(ffmpegService);

    // Check if asset exists
    const asset = await mediaService.get(projectId, assetId);
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ASSET_NOT_FOUND",
            message: `Asset not found: ${assetId}`,
          },
        },
        { status: 404 }
      );
    }

    // Delete the asset
    await mediaService.delete(projectId, assetId);

    console.log(`[API] Media asset deleted: ${assetId}`);

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
