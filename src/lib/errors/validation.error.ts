import { AppError } from './base.error';

/**
 * Thrown when request validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: any) {
    super(
      message,
      400,
      'VALIDATION_ERROR'
    );
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
