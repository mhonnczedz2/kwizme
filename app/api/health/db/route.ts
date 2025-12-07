import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Test Supabase connection
    const supabase = await createClient()

    // Simple query to test database connectivity
    // Using a lightweight query that should work on any Supabase setup
    const { data, error, count } = await supabase
      .from('profiles') // Assuming profiles table exists, or could be quiz_generations
      .select('id', { count: 'exact', head: true }) // Just count, no actual data
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      // If profiles table doesn't exist, try with another common table
      if (error.message?.includes('relation "profiles" does not exist')) {
        // Try with quiz_generations table which should exist based on rate limiting code
        const { error: altError } = await supabase
          .from('quiz_generations')
          .select('id', { count: 'exact', head: true })
          .limit(1)

        if (altError) {
          return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: {
              status: 'error',
              error: altError.message,
              responseTime
            },
            error: 'Database connection failed'
          }, {
            status: 503,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
        }
      } else {
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: {
            status: 'error',
            error: error.message,
            responseTime
          },
          error: 'Database query failed'
        }, {
          status: 503,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
    }

    // Test authentication service
    const { data: authData, error: authError } = await supabase.auth.getSession()

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime,
        recordCount: count !== null ? count : 'unknown'
      },
      auth: {
        status: authError ? 'error' : 'available',
        error: authError?.message
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    }

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Database health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error'
      },
      error: 'Database health check failed'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}