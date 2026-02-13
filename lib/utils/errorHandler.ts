/**
 * Unified Error Handling Utility (Phase 3)
 *
 * Provides consistent error handling across all services and API routes
 */

export interface ServiceError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface ServiceSuccess<T> {
  success: true;
  data: T;
  error?: null;
}

export type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  code?: string,
  details?: any
): ServiceError {
  return {
    success: false,
    error,
    code,
    details,
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): ServiceSuccess<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Handle async operations with consistent error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<ServiceResponse<T>> {
  try {
    const data = await operation();
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Service error:', error);
    return createErrorResponse(
      errorMessage,
      'OPERATION_FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Validate required fields in request data
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): ServiceError | null {
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field] === ''
  );

  if (missing.length > 0) {
    return createErrorResponse(
      `Missing required fields: ${missing.join(', ')}`,
      'VALIDATION_ERROR',
      { missingFields: missing }
    );
  }

  return null;
}

/**
 * Log errors to Firestore (for future analytics)
 */
export async function logError(
  errorType: string,
  errorMessage: string,
  userId?: string,
  additionalData?: any
): Promise<void> {
  // This will be integrated with Firestore in analytics service
  console.error(`[${errorType}]`, errorMessage, {
    userId,
    ...additionalData,
    timestamp: new Date().toISOString(),
  });
}
