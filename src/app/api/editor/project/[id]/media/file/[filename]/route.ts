/**
 * API Route: Serve Media File
 *
 * GET /api/editor/project/[id]/media/file/[filename]
 *
 * Streams a media file (video, audio, or image) to the client
 */

import { NextRequest, NextResponse } from "next/server";
import { getMediaService } from "@/services/editor";
import { FFmpegService } from "@/services/ffmpeg/ffmpeg.service";
import { errorHandler } from "@/middleware/error-handler";
import { createReadStream, statSync } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id: projectId, filename } = await params;

    // Validate filename to prevent path traversal
    const basename = path.basename(filename);
    if (basename !== filename) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FILENAME",
            message: "Invalid filename",
          },
        },
        { status: 400 }
      );
    }

    const ffmpegService = new FFmpegService();
    const mediaService = getMediaService(ffmpegService);

    // Construct the file path
    const mediaDir = path.join(
      process.cwd(),
      ".cache",
      "editor",
      "media",
      projectId
    );
    const filePath = path.join(mediaDir, filename);

    // Check if file exists
    let fileStats;
    try {
      fileStats = statSync(filePath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "Media file not found",
          },
        },
        { status: 404 }
      );
    }

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      // Video
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
      // Audio
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".aac": "audio/aac",
      ".flac": "audio/flac",
      ".m4a": "audio/x-m4a",
      // Image
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Handle range requests for video streaming
    const range = request.headers.get("range");

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileStats.size - 1;
      const chunkSize = end - start + 1;

      // Create read stream for the requested range
      const fileStream = createReadStream(filePath, { start, end });

      // Convert to web stream
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

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${fileStats.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
        },
      });
    }

    // No range request - stream entire file
    const fileStream = createReadStream(filePath);

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

    console.log("[API] Streaming media file:", filePath);

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}
