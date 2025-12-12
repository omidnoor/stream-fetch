/**
 * Gemini API Helper
 *
 * This module provides utility functions to interact with Google's Gemini API
 * for AI image generation functionality.
 */

import { GoogleGenAI } from "@google/genai";

// Types
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";
export type GeminiModel = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

export interface GenerateImageOptions {
  prompt: string;
  model?: GeminiModel;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  referenceImages?: string[]; // Base64 encoded images for editing
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export interface GenerateImageResponse {
  images: GeneratedImage[];
  text?: string;
}

export interface StreamChunk {
  type: "thought" | "text" | "image" | "done" | "error";
  text?: string;
  image?: GeneratedImage;
  error?: string;
}

/**
 * Initialize Gemini client with API key from environment
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Generate images using Gemini API
 *
 * @param options - Image generation options
 * @returns Generated images as base64
 *
 * @example
 * ```ts
 * const result = await generateImage({
 *   prompt: "A futuristic city at sunset",
 *   aspectRatio: "16:9",
 *   imageSize: "2K"
 * });
 * ```
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  const client = getGeminiClient();
  const model = options.model ?? "gemini-2.5-flash-image";

  try {
    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: options.prompt }
    ];

    // Add reference images if provided (for image editing)
    if (options.referenceImages?.length) {
      for (const imageData of options.referenceImages) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: imageData,
          },
        });
      }
    }

    // Build generation config
    const generationConfig: Record<string, unknown> = {
      responseModalities: ["TEXT", "IMAGE"],
    };

    // Add aspect ratio if specified (imageSize is model-dependent)
    if (options.aspectRatio) {
      generationConfig.aspectRatio = options.aspectRatio;
    }

    const response = await client.models.generateContent({
      model,
      contents: [{ parts }],
      config: generationConfig,
    });

    // Extract images and text from response
    const images: GeneratedImage[] = [];
    let text: string | undefined;

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if ("inlineData" in part && part.inlineData && part.inlineData.data) {
          images.push({
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType ?? "image/png",
          });
        } else if ("text" in part && part.text) {
          text = part.text;
        }
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated. The model may have refused the prompt.");
    }

    return { images, text };
  } catch (error) {
    console.error("Error generating image:", error);

    if (error instanceof Error) {
      // Check for specific API errors
      if (error.message.includes("SAFETY")) {
        throw new Error("Content was blocked by safety filters. Please modify your prompt.");
      }
      if (error.message.includes("QUOTA")) {
        throw new Error("API quota exceeded. Please try again later.");
      }
      throw new Error(`Failed to generate image: ${error.message}`);
    }

    throw new Error("Failed to generate image: Unknown error");
  }
}

/**
 * Generate images using Gemini API with streaming
 * Yields chunks as they arrive: text first, then images
 */
export async function* generateImageStream(
  options: GenerateImageOptions
): AsyncGenerator<StreamChunk> {
  const client = getGeminiClient();
  const model = options.model ?? "gemini-2.5-flash-image";

  try {
    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: options.prompt }
    ];

    // Add reference images if provided
    if (options.referenceImages?.length) {
      for (const imageData of options.referenceImages) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: imageData,
          },
        });
      }
    }

    // Build generation config with thinking enabled
    const generationConfig: Record<string, unknown> = {
      responseModalities: ["TEXT", "IMAGE"],
      thinkingConfig: {
        includeThoughts: true,
      },
    };

    if (options.aspectRatio) {
      generationConfig.aspectRatio = options.aspectRatio;
    }

    // Use streaming API
    const response = await client.models.generateContentStream({
      model,
      contents: [{ parts }],
      config: generationConfig,
    });

    let hasImage = false;

    // Process stream chunks
    for await (const chunk of response) {
      const candidate = chunk.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          // Log full part structure for debugging
          console.log("[Gemini Stream] Part keys:", Object.keys(part));
          if ("inlineData" in part && part.inlineData) {
            console.log("[Gemini Stream] inlineData keys:", Object.keys(part.inlineData));
            console.log("[Gemini Stream] inlineData.mimeType:", part.inlineData.mimeType);
            console.log("[Gemini Stream] inlineData.data length:", part.inlineData.data?.length ?? "undefined");
          }

          // Check if this is a thought part (reasoning)
          const partWithThought = part as { thought?: boolean; text?: string };
          const isThought = partWithThought.thought === true;

          if ("text" in part && part.text) {
            console.log("[Gemini Stream] Yielding", isThought ? "thought" : "text", ":", part.text.slice(0, 100));
            yield {
              type: isThought ? "thought" : "text",
              text: part.text
            };
          } else if ("inlineData" in part && part.inlineData && part.inlineData.data) {
            hasImage = true;
            console.log("[Gemini Stream] Yielding image");
            yield {
              type: "image",
              image: {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType ?? "image/png",
              },
            };
          }
        }
      }
    }

    if (!hasImage) {
      yield { type: "error", error: "No images generated. The model may have refused the prompt." };
    } else {
      yield { type: "done" };
    }
  } catch (error) {
    console.error("Error in streaming image generation:", error);

    if (error instanceof Error) {
      if (error.message.includes("SAFETY")) {
        yield { type: "error", error: "Content was blocked by safety filters. Please modify your prompt." };
      } else if (error.message.includes("QUOTA")) {
        yield { type: "error", error: "API quota exceeded. Please try again later." };
      } else {
        yield { type: "error", error: `Failed to generate image: ${error.message}` };
      }
    } else {
      yield { type: "error", error: "Failed to generate image: Unknown error" };
    }
  }
}

/**
 * Supported aspect ratios with labels
 */
export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "3:4", label: "Portrait (3:4)" },
  { value: "3:2", label: "Photo (3:2)" },
  { value: "2:3", label: "Portrait Photo (2:3)" },
  { value: "21:9", label: "Ultrawide (21:9)" },
];

/**
 * Supported image sizes with labels
 */
export const IMAGE_SIZES: { value: ImageSize; label: string }[] = [
  { value: "1K", label: "1K (1024px)" },
  { value: "2K", label: "2K (2048px)" },
  { value: "4K", label: "4K (4096px)" },
];

/**
 * Available models with labels
 */
export const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash",
    description: "Fast, general-purpose image generation"
  },
  {
    value: "gemini-3-pro-image-preview",
    label: "Gemini 3 Pro (Preview)",
    description: "Higher quality, supports 4K and multiple references"
  },
];
