import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const {
      targetUserId,
      dailyLimit,
      isUnlimited,
      reason,
      expiresAt
    } = await request.json()

    // Basic validation
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    if (!isUnlimited && (!dailyLimit || dailyLimit < 1)) {
      return NextResponse.json(
        { error: 'Daily limit must be at least 1 if not unlimited' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Admin authorization check
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
    const userEmail = user.email?.toLowerCase()

    if (!userEmail || !adminEmails.includes(userEmail)) {
      console.warn(`🚫 Unauthorized admin access attempt by ${userEmail || 'unknown'} for user ${targetUserId}`)
      return NextResponse.json(
        { error: 'Admin access required. Contact system administrator.' },
        { status: 403 }
      )
    }

    console.log(`🔧 Admin ${userEmail} setting limits for user ${targetUserId}`)

    // Check if target user exists
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Upsert user limit
    const { data, error } = await supabase
      .from('user_limits')
      .upsert({
        user_id: targetUserId,
        daily_limit: isUnlimited ? 0 : dailyLimit,
        is_unlimited: isUnlimited,
        reason: reason,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update user limits' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully updated limits for ${targetProfile.email}:`, {
      dailyLimit: isUnlimited ? 'unlimited' : dailyLimit,
      reason,
      expiresAt
    })

    return NextResponse.json({
      success: true,
      message: `Limits updated for ${targetProfile.email}`,
      targetUser: {
        id: targetProfile.id,
        email: targetProfile.email,
        fullName: targetProfile.full_name
      },
      limits: {
        dailyLimit: isUnlimited ? -1 : dailyLimit,
        isUnlimited,
        reason,
        expiresAt
      }
    })

  } catch (error: any) {
    console.error('❌ Error setting user limits:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin authorization check
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []
    const userEmail = user.email?.toLowerCase()

    if (!userEmail || !adminEmails.includes(userEmail)) {
      console.warn(`🚫 Unauthorized admin access attempt by ${userEmail || 'unknown'} for user data`)
      return NextResponse.json(
        { error: 'Admin access required. Contact system administrator.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID parameter is required' },
        { status: 400 }
      )
    }

    // Get user's current limits and usage
    const { data: userLimit } = await supabase
      .from('user_limits')
      .select(`
        daily_limit,
        is_unlimited,
        reason,
        granted_at,
        expires_at,
        granted_by
      `)
      .eq('user_id', targetUserId)
      .single()

    // Get today's usage
    const today = new Date().toISOString().split('T')[0]
    const { data: todayUsage } = await supabase
      .from('daily_usage')
      .select('quiz_count')
      .eq('user_id', targetUserId)
      .eq('generated_date', today)
      .single()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', targetUserId)
      .single()

    const effectiveLimit = userLimit?.daily_limit || 5
    const currentUsage = todayUsage?.quiz_count || 0
    const isUnlimited = userLimit?.is_unlimited || false

    return NextResponse.json({
      user: {
        id: targetUserId,
        email: profile?.email,
        fullName: profile?.full_name
      },
      limits: {
        dailyLimit: isUnlimited ? -1 : effectiveLimit,
        isUnlimited,
        reason: userLimit?.reason || 'default',
        grantedAt: userLimit?.granted_at,
        expiresAt: userLimit?.expires_at
      },
      usage: {
        today: currentUsage,
        remaining: isUnlimited ? -1 : Math.max(0, effectiveLimit - currentUsage)
      }
    })

  } catch (error: any) {
    console.error('❌ Error getting user limits:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}