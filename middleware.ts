/**
 * Next.js Middleware
 * 
 * Global middleware for request handling.
 * Currently used for logging and future rate limiting.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Log API requests in development
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[API] ${request.method} ${request.nextUrl.pathname}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}

