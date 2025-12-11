/**
 * API Route: Serve Thumbnail Image
 *
 * GET /api/editor/project/[id]/media/thumbnail/[assetId]
 *
 * Streams a thumbnail image for a media asset
 */

import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/middleware/error-handler";
import { createReadStream, statSync } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;

    // Validate assetId format (should be UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ASSET_ID",
            message: "Invalid asset ID format",
          },
        },
        { status: 400 }
      );
    }

    // Construct the thumbnail file path
    const thumbnailFilename = `${assetId}_thumb.jpg`;
    const thumbnailPath = path.join(
      process.cwd(),
      ".cache",
      "editor",
      "media",
      projectId,
      "thumbnails",
      thumbnailFilename
    );

    // Check if file exists
    let fileStats;
    try {
      fileStats = statSync(thumbnailPath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "THUMBNAIL_NOT_FOUND",
            message: "Thumbnail not found",
          },
        },
        { status: 404 }
      );
    }

    // Stream the thumbnail
    const fileStream = createReadStream(thumbnailPath);

    // Convert stream to web stream
    const readableStream = new ReadableStream({
      async start(controller) {
        fileStream.on("data", (chunk) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          controller.enqueue(new Uint8Array(buffer));
        });
        fileStream.on("end", () => {
          controller.close();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    console.log("[API] Streaming thumbnail:", thumbnailPath);

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}
