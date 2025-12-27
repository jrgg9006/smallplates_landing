/**
 * Standardized API Error Handling System
 */

export enum ErrorType {
  VALIDATION = 'validation',
  DATABASE = 'database', 
  EXTERNAL_SERVICE = 'external_service',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Creates a standardized error response
 */
export function createApiError(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: Record<string, any>
): ApiError {
  return {
    type,
    message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Handles and logs errors consistently
 */
export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage = 'An unexpected error occurred'
): ApiError {
  console.error(`❌ Error in ${context}:`, error);

  // Handle known error types
  if (error instanceof Error) {
    // Database errors
    if (error.message.includes('relation') || error.message.includes('column')) {
      return createApiError(
        ErrorType.DATABASE,
        'Database operation failed',
        500,
        { originalError: error.message }
      );
    }

    // Validation errors
    if (error.message.includes('required') || error.message.includes('invalid')) {
      return createApiError(
        ErrorType.VALIDATION,
        error.message,
        400
      );
    }

    // Authentication errors
    if (error.message.includes('unauthorized') || error.message.includes('token')) {
      return createApiError(
        ErrorType.AUTHENTICATION,
        'Authentication failed',
        401
      );
    }

    // External service errors (Supabase, Postmark, etc.)
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
      return createApiError(
        ErrorType.EXTERNAL_SERVICE,
        'External service unavailable',
        503,
        { originalError: error.message }
      );
    }

    return createApiError(
      ErrorType.INTERNAL,
      fallbackMessage,
      500,
      { originalError: error.message }
    );
  }

  // Handle non-Error objects
  return createApiError(
    ErrorType.INTERNAL,
    fallbackMessage,
    500,
    { originalError: String(error) }
  );
}

/**
 * Common validation errors
 */
export const ValidationErrors = {
  MISSING_EMAIL: createApiError(ErrorType.VALIDATION, 'Email is required', 400),
  MISSING_PASSWORD: createApiError(ErrorType.VALIDATION, 'Password is required', 400),
  MISSING_TOKEN: createApiError(ErrorType.VALIDATION, 'Token is required', 400),
  INVALID_EMAIL: createApiError(ErrorType.VALIDATION, 'Invalid email format', 400),
  WEAK_PASSWORD: createApiError(ErrorType.VALIDATION, 'Password must be at least 8 characters', 400),
};

/**
 * Common authentication errors
 */
export const AuthErrors = {
  INVALID_TOKEN: createApiError(ErrorType.AUTHENTICATION, 'Invalid or expired token', 401),
  UNAUTHORIZED: createApiError(ErrorType.AUTHORIZATION, 'Access denied', 403),
  SESSION_EXPIRED: createApiError(ErrorType.AUTHENTICATION, 'Session expired, please log in again', 401),
};

/**
 * Common database errors
 */
export const DatabaseErrors = {
  NOT_FOUND: createApiError(ErrorType.NOT_FOUND, 'Resource not found', 404),
  DUPLICATE_ENTRY: createApiError(ErrorType.DATABASE, 'Resource already exists', 409),
  CONNECTION_FAILED: createApiError(ErrorType.DATABASE, 'Database connection failed', 503),
};