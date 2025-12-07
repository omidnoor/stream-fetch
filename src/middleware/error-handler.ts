import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/base.error';

/**
 * Global Error Handler
 *
 * Converts errors into standardized JSON responses.
 * Handles both known application errors and unexpected errors.
 */

/**
 * Handle errors and convert to NextResponse
 *
 * @param error The error to handle
 * @returns NextResponse with appropriate error details
 */
export function errorHandler(error: unknown): NextResponse {
  // Handle known application errors
  if (error instanceof AppError) {
    console.warn('[Error Handler] Application error:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    return NextResponse.json(
      error.toJSON(),
      { status: error.statusCode }
    );
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    console.error('[Error Handler] Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Don't expose internal error details to clients
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  console.error('[Error Handler] Unknown error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper
 *
 * Wraps an async route handler and catches any errors.
 *
 * Usage:
 * ```typescript
 * export const GET = withErrorHandler(async (request) => {
 *   // Your route logic
 * });
 * ```
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorHandler(error);
    }
  }) as T;
}
