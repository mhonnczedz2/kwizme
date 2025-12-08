import { updateSession } from '@/lib/supabase/middleware'
import { checkQuizGenerationLimit } from '@/lib/rate-limiting'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Proxy to handle authentication, session refresh, and rate limiting
 * This runs on every request to protected routes
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // First, handle Supabase session management
  const supabaseResponse = await updateSession(request)

  // Apply rate limiting only to quiz generation endpoint
  if (pathname === '/api/generate-quiz' && request.method === 'POST') {
    try {
      // Extract user session from the supabase response
      // We need to parse the user from the session, similar to what's done in the API route
      const authCookie = request.cookies.get('sb-access-token')?.value
      let userId: string | undefined

      // Get client IP address
      const clientIP =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown'

      // For now, we'll check rate limits without userId in proxy
      // The API route will do a more thorough check with proper user authentication
      const rateLimitResult = await checkQuizGenerationLimit(undefined, clientIP)

      if (!rateLimitResult.allowed) {
        return NextResponse.json({
          error: 'Rate limit exceeded in proxy',
          message: rateLimitResult.reason || `You've reached your ${rateLimitResult.limits.dailyLimit}-quiz generation daily limit! Limits reset at 12:00 AM daily.`,
          limits: rateLimitResult.limits,
          resetTime: rateLimitResult.resetTime
        }, {
          status: 429,
          headers: {
            'Retry-After': '3600', // 1 hour
            'X-RateLimit-Limit': rateLimitResult.limits.dailyLimit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.limits.remainingQuizzes.toString(),
          }
        })
      }
    } catch (error) {
      console.error('Proxy rate limit check failed:', error)
      // On error, let the request through but log the issue
      // The API route will perform another check
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
