// Temporarily disable authentication middleware for testing
export default function middleware(req: any) {
  // Allow all requests for now
  return
}

export const config = {
  matcher: [
    // Disable middleware for now
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|auth).*)",
  ],
}