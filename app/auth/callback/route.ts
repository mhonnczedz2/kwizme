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

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a new user signup for Discord notification
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if user was created recently (within last 5 minutes = new signup)
          const userCreatedAt = new Date(user.created_at)
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

          const isNewUser = userCreatedAt > fiveMinutesAgo

          if (isNewUser) {
            console.log('🎉 New user detected, sending Discord notification...')

            // Send Discord notification via API route (copying feedback pattern)
            try {
              const notificationResponse = await fetch(`${origin}/api/notify-signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: user.email,
                  source: 'email_confirmation',
                  referrer: request.headers.get('referer') || undefined
                })
              })

              if (notificationResponse.ok) {
                console.log('✅ Signup notification API call successful')
              } else {
                console.warn('⚠️ Signup notification API call failed:', notificationResponse.status)
              }
            } catch (apiError) {
              console.warn('⚠️ Failed to call signup notification API:', apiError)
            }
          }
        }
      } catch (notificationError) {
        // Don't fail the auth flow if notification fails
        console.warn('Failed to process signup notification:', notificationError)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
