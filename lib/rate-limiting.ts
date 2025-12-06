import { createClient } from './supabase/server'

export interface UsageLimits {
  dailyLimit: number
  currentUsage: number
  remainingQuizzes: number
  isUnlimited: boolean
  limitType: 'default' | 'premium' | 'staff' | 'custom'
}

export interface RateLimitResult {
  allowed: boolean
  limits: UsageLimits
  resetTime?: Date
  reason?: string
}

const DEFAULT_DAILY_LIMIT = 5

/**
 * Check if user can generate another quiz today
 */
export async function checkQuizGenerationLimit(userId?: string): Promise<RateLimitResult> {
  if (!userId) {
    // Anonymous user - check browser storage
    return checkAnonymousUserLimit()
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Get user's custom limit if any
    const { data: userLimit } = await supabase
      .from('user_limits')
      .select('daily_limit, is_unlimited, expires_at')
      .eq('user_id', userId)
      .single()

    let dailyLimit = DEFAULT_DAILY_LIMIT
    let isUnlimited = false
    let limitType: UsageLimits['limitType'] = 'default'

    if (userLimit && (!userLimit.expires_at || new Date(userLimit.expires_at) > new Date())) {
      dailyLimit = userLimit.daily_limit
      isUnlimited = userLimit.is_unlimited
      limitType = userLimit.daily_limit > DEFAULT_DAILY_LIMIT ? 'premium' : 'custom'
    }

    // If unlimited, always allow
    if (isUnlimited) {
      return {
        allowed: true,
        limits: {
          dailyLimit: -1,
          currentUsage: 0,
          remainingQuizzes: -1,
          isUnlimited: true,
          limitType: 'staff'
        }
      }
    }

    // Get today's usage
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('quiz_count')
      .eq('user_id', userId)
      .eq('generated_date', today)
      .single()

    const currentUsage = usage?.quiz_count || 0
    const remainingQuizzes = Math.max(0, dailyLimit - currentUsage)
    const allowed = currentUsage < dailyLimit

    return {
      allowed,
      limits: {
        dailyLimit,
        currentUsage,
        remainingQuizzes,
        isUnlimited: false,
        limitType
      },
      resetTime: getTomorrowMidnight()
    }

  } catch (error) {
    console.error('Error checking rate limit:', error)
    // On error, allow but with default limits
    return {
      allowed: true,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage: 0,
        remainingQuizzes: DEFAULT_DAILY_LIMIT,
        isUnlimited: false,
        limitType: 'default'
      }
    }
  }
}

/**
 * Record a quiz generation (increment usage counter)
 */
export async function recordQuizGeneration(userId?: string): Promise<void> {
  if (!userId) {
    // Anonymous user - update browser storage
    recordAnonymousQuizGeneration()
    return
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Upsert daily usage record
    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        generated_date: today,
        quiz_count: 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,generated_date',
        ignoreDuplicates: false
      })

    // If record exists, increment the count
    await supabase.rpc('increment_quiz_count', {
      p_user_id: userId,
      p_date: today
    })

  } catch (error) {
    console.error('Error recording quiz generation:', error)
    // Don't throw - generation should still succeed
  }
}

/**
 * Browser-based limiting for anonymous users
 */
function checkAnonymousUserLimit(): RateLimitResult {
  if (typeof window === 'undefined') {
    // Server-side, assume allowed
    return {
      allowed: true,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage: 0,
        remainingQuizzes: DEFAULT_DAILY_LIMIT,
        isUnlimited: false,
        limitType: 'default'
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const storageKey = `quiz_usage_${today}`

  const storedUsage = localStorage.getItem(storageKey)
  const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0

  const remainingQuizzes = Math.max(0, DEFAULT_DAILY_LIMIT - currentUsage)
  const allowed = currentUsage < DEFAULT_DAILY_LIMIT

  return {
    allowed,
    limits: {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      currentUsage,
      remainingQuizzes,
      isUnlimited: false,
      limitType: 'default'
    },
    resetTime: getTomorrowMidnight(),
    reason: allowed ? undefined : `Daily limit reached. Resets at ${getTomorrowMidnight().toLocaleString()}.`
  }
}

/**
 * Record quiz generation for anonymous user
 */
function recordAnonymousQuizGeneration(): void {
  if (typeof window === 'undefined') return

  const today = new Date().toISOString().split('T')[0]
  const storageKey = `quiz_usage_${today}`

  const storedUsage = localStorage.getItem(storageKey)
  const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0

  localStorage.setItem(storageKey, (currentUsage + 1).toString())

  // Clean up old entries (keep only last 7 days)
  cleanupOldUsageEntries()
}

/**
 * Clean up localStorage from old usage entries
 */
function cleanupOldUsageEntries(): void {
  if (typeof window === 'undefined') return

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)
  const cutoffString = cutoffDate.toISOString().split('T')[0]

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('quiz_usage_')) {
      const dateString = key.replace('quiz_usage_', '')
      if (dateString < cutoffString) {
        localStorage.removeItem(key)
        i-- // Adjust index after removal
      }
    }
  }
}

/**
 * Get tomorrow at midnight for reset time
 */
function getTomorrowMidnight(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Admin function to set user limits
 */
export async function setUserLimit(
  userId: string,
  limit: number,
  isUnlimited: boolean = false,
  reason: string = 'custom',
  expiresAt?: Date
): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('user_limits')
      .upsert({
        user_id: userId,
        daily_limit: limit,
        is_unlimited: isUnlimited,
        reason,
        expires_at: expiresAt?.toISOString(),
        granted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    return !error
  } catch (error) {
    console.error('Error setting user limit:', error)
    return false
  }
}