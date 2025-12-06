import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's effective limits using our SQL function
    const { data: limits } = await supabase
      .rpc('can_generate_quiz', { p_user_id: user.id })
      .single()

    if (!limits) {
      return NextResponse.json(
        { error: 'Could not fetch usage limits' },
        { status: 500 }
      )
    }

    // Get usage history for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: usageHistory } = await supabase
      .from('daily_usage')
      .select('generated_date, quiz_count')
      .eq('user_id', user.id)
      .gte('generated_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('generated_date', { ascending: false })

    // Get user profile for display
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: profile?.email,
        fullName: profile?.full_name
      },
      limits: {
        dailyLimit: limits.is_unlimited ? -1 : limits.daily_limit,
        currentUsage: limits.current_usage,
        remainingQuizzes: limits.remaining_quizzes,
        isUnlimited: limits.is_unlimited,
        canGenerateToday: limits.allowed
      },
      usageHistory: usageHistory || [],
      resetTime: getTomorrowMidnight()
    })

  } catch (error: any) {
    console.error('❌ Error fetching usage dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTomorrowMidnight(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}