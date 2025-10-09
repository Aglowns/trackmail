/**
 * Error Handling Utilities
 * 
 * Standardized error responses for API routes.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Format error response
 */
export function errorResponse(
  error: unknown,
  defaultStatus: number = 500
): NextResponse {
  // Handle custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Resource already exists',
          code: 'CONFLICT',
          details: { field: prismaError.meta?.target },
        },
        { status: 409 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Resource not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }
  }

  // Generic error
  console.error('Unhandled error:', error)
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: defaultStatus }
  )
}

/**
 * Common error responses
 */
export const Errors = {
  Unauthorized: () =>
    new ApiError(401, 'UNAUTHORIZED', 'Authentication required'),
  
  Forbidden: () =>
    new ApiError(403, 'FORBIDDEN', 'Access denied'),
  
  NotFound: (resource: string = 'Resource') =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),
  
  BadRequest: (message: string) =>
    new ApiError(400, 'BAD_REQUEST', message),
  
  Conflict: (message: string) =>
    new ApiError(409, 'CONFLICT', message),
  
  RateLimitExceeded: () =>
    new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests'),
}

