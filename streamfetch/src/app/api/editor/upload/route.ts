/**
 * API Route: Upload Video File
 *
 * POST /api/editor/upload
 *
 * Handles video file uploads for the editor
 * Validates file type and size, saves to temporary storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getEditorService } from "@/services/editor";
import { errorHandler } from "@/middleware/error-handler";

export async function POST(request: NextRequest) {
  try {
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

    const editorService = getEditorService();

    // Validate the file
    editorService.validateFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the uploaded file
    const filePath = await editorService.saveUploadedFile(file.name, buffer);

    console.log("[API] Video file uploaded:", filePath);

    return NextResponse.json({
      success: true,
      data: {
        filePath,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    return errorHandler(error);
  }
}
