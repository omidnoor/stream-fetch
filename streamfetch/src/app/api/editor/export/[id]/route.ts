/**
 * API Route: Export/Download Rendered Video
 *
 * GET /api/editor/export/[id]
 *
 * Downloads the rendered video for a project
 * Streams the file to support large videos
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";
import { createReadStream, statSync } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const editorService = getEditorService();

    // Get the project to verify it exists and get the output filename
    const project = await editorService.getProject(id);

    if (project.status !== "completed") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROJECT_NOT_READY",
            message: `Project is ${project.status}. Only completed projects can be exported.`,
          },
        },
        { status: 400 }
      );
    }

    // Construct the output file path
    // The filename is generated during export based on project name
    const outputDir = path.join(process.cwd(), ".cache", "editor", "output");
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outputFilename = `${sanitizedName}_high_quality.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Check if file exists
    try {
      statSync(outputPath);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_NOT_FOUND",
            message: "Rendered video file not found",
          },
        },
        { status: 404 }
      );
    }

    // Stream the file
    const fileStats = statSync(outputPath);
    const fileStream = createReadStream(outputPath);

    // Convert stream to web stream
    const readableStream = new ReadableStream({
      async start(controller) {
        fileStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        fileStream.on("end", () => {
          controller.close();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    console.log("[API] Streaming export file:", outputPath);

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileStats.size.toString(),
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
      },
    });
  } catch (error) {
    return errorHandler(error);
  }
}
