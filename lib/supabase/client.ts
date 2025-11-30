import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in the browser (client components)
 * This client will automatically handle authentication state
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging for production issues
  if (typeof window !== 'undefined') {
    console.log('Client-side Supabase client creation:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 20),
    })
  }

  // During build time, environment variables might not be available
  // Return a placeholder that will be replaced at runtime
  if (typeof window === 'undefined') {
    // Server-side during build - return a mock client
    if (!supabaseUrl || !supabaseAnonKey) {
      // This won't be used at runtime, only during SSR/build
      console.log('Build-time: Using placeholder Supabase client')
      return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
