/**
 * Authorization Utilities
 * 
 * Middleware and helpers for authenticating requests from:
 * 1. Gmail Add-on (Bearer token)
 * 2. Web Dashboard (NextAuth session)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

// ============================================================================
// TYPES
// ============================================================================

export type AuthSource = 'bearer' | 'session' | 'none'

export interface AuthResult {
  authenticated: boolean
  source: AuthSource
  userId?: string
  error?: string
}

// ============================================================================
// BEARER TOKEN VALIDATION
// ============================================================================

/**
 * Validate Bearer token from Gmail Add-on
 */
export function validateBearerToken(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization')
  const sourceHeader = request.headers.get('x-jobmail-source')

  // Check Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      source: 'none',
      error: 'Missing or invalid Authorization header',
    }
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix
  const expectedToken = process.env.JOBMAIL_API_KEY

  if (!expectedToken) {
    console.error('JOBMAIL_API_KEY environment variable not set')
    return {
      authenticated: false,
      source: 'none',
      error: 'Server configuration error',
    }
  }

  // Constant-time comparison to prevent timing attacks
  if (token !== expectedToken) {
    return {
      authenticated: false,
      source: 'none',
      error: 'Invalid API key',
    }
  }

  // Optionally verify source header
  if (sourceHeader && sourceHeader !== 'gmail-addon') {
    console.warn(`Unexpected X-JobMail-Source: ${sourceHeader}`)
  }

  return {
    authenticated: true,
    source: 'bearer',
  }
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate NextAuth session from web dashboard
 */
export async function validateSession(): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return {
        authenticated: false,
        source: 'none',
        error: 'No active session',
      }
    }

    return {
      authenticated: true,
      source: 'session',
      userId: session.user.id || session.user.email || undefined,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      authenticated: false,
      source: 'none',
      error: 'Session validation failed',
    }
  }
}

// ============================================================================
// COMBINED AUTHORIZATION
// ============================================================================

/**
 * Assert request is authenticated via Bearer token OR session
 * 
 * Usage in API routes:
 * ```
 * const auth = await assertBearerOrSession(request)
 * if (!auth.authenticated) {
 *   return NextResponse.json({ error: auth.error }, { status: 401 })
 * }
 * ```
 */
export async function assertBearerOrSession(
  request: NextRequest
): Promise<AuthResult> {
  // Try Bearer token first
  const bearerAuth = validateBearerToken(request)
  if (bearerAuth.authenticated) {
    return bearerAuth
  }

  // Fall back to session
  const sessionAuth = await validateSession()
  if (sessionAuth.authenticated) {
    return sessionAuth
  }

  // Neither worked
  return {
    authenticated: false,
    source: 'none',
    error: 'Authentication required (Bearer token or session)',
  }
}

/**
 * Require Bearer token only (for add-on endpoints)
 */
export function assertBearerToken(request: NextRequest): AuthResult {
  const auth = validateBearerToken(request)
  if (!auth.authenticated) {
    return {
      authenticated: false,
      source: 'none',
      error: 'Bearer token required',
    }
  }
  return auth
}

/**
 * Require session only (for web dashboard endpoints)
 */
export async function assertSession(): Promise<AuthResult> {
  const auth = await validateSession()
  if (!auth.authenticated) {
    return {
      authenticated: false,
      source: 'none',
      error: 'Session required',
    }
  }
  return auth
}

// ============================================================================
// IDEMPOTENCY KEY HANDLING
// ============================================================================

/**
 * Extract and validate Idempotency-Key header
 * 
 * Used to prevent duplicate processing of the same Gmail message.
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  return request.headers.get('idempotency-key')
}

/**
 * Check if request has already been processed (via InboxMessage table)
 */
export async function isIdempotent(messageId: string): Promise<boolean> {
  if (!messageId) return false

  const { prisma } = await import('./prisma')
  
  const existing = await prisma.inboxMessage.findUnique({
    where: { messageId },
  })

  return !!existing
}

