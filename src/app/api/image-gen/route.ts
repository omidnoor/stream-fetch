import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  GenerateImageOptions,
  AspectRatio,
  ImageSize,
  GeminiModel,
} from "@/lib/gemini-helper";

interface GenerateRequestBody {
  prompt: string;
  model?: GeminiModel;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  referenceImages?: string[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: GenerateRequestBody = await request.json();

    // Validate required fields
    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (body.prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt is too long (max 10000 characters)" },
        { status: 400 }
      );
    }

    // Build options with defaults
    const model = body.model ?? "gemini-2.5-flash-image";
    const aspectRatio = body.aspectRatio ?? "1:1";

    const options: GenerateImageOptions = {
      prompt: body.prompt.trim(),
      model,
      aspectRatio,
      imageSize: body.imageSize,
      referenceImages: body.referenceImages,
    };

    // Generate image
    const result = await generateImage(options);

    const generationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      images: result.images,
      text: result.text,
      metadata: {
        model,
        aspectRatio,
        generationTimeMs: generationTime,
        imageCount: result.images.length,
        hasReferenceImages: (body.referenceImages?.length ?? 0) > 0,
        promptLength: body.prompt.trim().length,
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("safety") ? 400 : 500;

    return NextResponse.json(
      { error: message, success: false },
      { status }
    );
  }
}
