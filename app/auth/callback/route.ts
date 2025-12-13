import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback route handler
 * Handles OAuth callbacks and email confirmations
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔍 Auth callback debug:', {
    hasCode: !!code,
    codeLength: code?.length,
    origin,
    next,
    searchParams: Object.fromEntries(searchParams)
  })

  if (code) {
    const supabase = await createClient()
    console.log('🔐 Attempting to exchange code for session...')

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    console.log('🔐 Exchange result:', {
      hasError: !!error,
      error: error?.message,
      hasSession: !!data.session,
      hasUser: !!data.user
    })

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const redirectUrl = isLocalEnv ? `${origin}${next}` :
                         forwardedHost ? `https://${forwardedHost}${next}` :
                         `${origin}${next}`

      console.log('✅ Auth success, redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('❌ Auth exchange failed:', error.message)
    }
  } else {
    console.error('❌ No code parameter found in callback URL')
  }

  // Return the user to an error page with some instructions
  console.log('❌ Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
