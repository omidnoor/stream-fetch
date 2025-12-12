import { NextRequest } from "next/server";
import {
  generateImageStream,
  GenerateImageOptions,
  AspectRatio,
  GeminiModel,
} from "@/lib/gemini-helper";

interface StreamRequestBody {
  prompt: string;
  model?: GeminiModel;
  aspectRatio?: AspectRatio;
  referenceImages?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequestBody = await request.json();

    // Validate required fields
    if (!body.prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate prompt length
    if (body.prompt.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Prompt is too long (max 10000 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const options: GenerateImageOptions = {
      prompt: body.prompt.trim(),
      model: body.model ?? "gemini-2.5-flash-image",
      aspectRatio: body.aspectRatio ?? "1:1",
      referenceImages: body.referenceImages,
    };

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateImageStream(options)) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          const errorChunk = JSON.stringify({ type: "error", error: errorMsg });
          controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream setup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
