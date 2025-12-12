import { AppError } from "./base.error";

/**
 * Gemini API specific error codes
 */
export const GeminiErrorCode = {
  API_ERROR: "GEMINI_API_ERROR",
  SAFETY_BLOCKED: "GEMINI_SAFETY_BLOCKED",
  QUOTA_EXCEEDED: "GEMINI_QUOTA_EXCEEDED",
  INVALID_PROMPT: "GEMINI_INVALID_PROMPT",
  NO_IMAGES_GENERATED: "GEMINI_NO_IMAGES",
  MODEL_UNAVAILABLE: "GEMINI_MODEL_UNAVAILABLE",
} as const;

export type GeminiErrorCodeType = (typeof GeminiErrorCode)[keyof typeof GeminiErrorCode];

/**
 * Base error class for Gemini API errors
 */
export class GeminiError extends AppError {
  constructor(
    message: string,
    code: GeminiErrorCodeType = GeminiErrorCode.API_ERROR,
    statusCode: number = 500
  ) {
    super(message, statusCode, code);
  }
}

/**
 * Error when content is blocked by safety filters
 */
export class GeminiSafetyError extends GeminiError {
  constructor(message: string = "Content was blocked by safety filters") {
    super(message, GeminiErrorCode.SAFETY_BLOCKED, 400);
  }
}

/**
 * Error when API quota is exceeded
 */
export class GeminiQuotaError extends GeminiError {
  constructor(message: string = "API quota exceeded") {
    super(message, GeminiErrorCode.QUOTA_EXCEEDED, 429);
  }
}

/**
 * Error when prompt is invalid
 */
export class GeminiInvalidPromptError extends GeminiError {
  constructor(message: string = "Invalid prompt provided") {
    super(message, GeminiErrorCode.INVALID_PROMPT, 400);
  }
}

/**
 * Error when no images are generated
 */
export class GeminiNoImagesError extends GeminiError {
  constructor(message: string = "No images were generated") {
    super(message, GeminiErrorCode.NO_IMAGES_GENERATED, 500);
  }
}
