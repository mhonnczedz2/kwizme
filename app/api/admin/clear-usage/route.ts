import { NextRequest, NextResponse } from 'next/server'
import { clearUserUsage } from '@/lib/rate-limiting'

// This is a temporary admin endpoint for testing rate limiting
// TODO: Remove this endpoint before production or add proper auth
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const success = await clearUserUsage(userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Cleared all usage records for user: ${userId}`
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to clear usage records'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in clear-usage endpoint:', error)
    return NextResponse.json({
      success: false,
      message: 'An error occurred'
    }, { status: 500 })
  }
}
