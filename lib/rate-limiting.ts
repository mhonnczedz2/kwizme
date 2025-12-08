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

// Reset time configuration: Midnight GMT+8 (00:00)
const RESET_HOUR_GMT8 = 0  // 0 = midnight, 12 = noon, etc.
const RESET_MINUTE_GMT8 = 0

/**
 * Calculate the start of the current rate limiting period
 * This is the most recent reset time (e.g., last midnight GMT+8)
 */
function getCurrentPeriodStart(): Date {
  const now = new Date()

  // Convert current time to GMT+8
  const gmt8Offset = 8 * 60 * 60 * 1000
  const nowGMT8 = new Date(now.getTime() + gmt8Offset)

  // Create today's reset time in GMT+8
  const todayResetGMT8 = new Date(nowGMT8)
  todayResetGMT8.setUTCHours(RESET_HOUR_GMT8, RESET_MINUTE_GMT8, 0, 0)

  // If we haven't reached today's reset time yet, use yesterday's reset
  if (nowGMT8.getTime() < todayResetGMT8.getTime()) {
    todayResetGMT8.setUTCDate(todayResetGMT8.getUTCDate() - 1)
  }

  // Convert back to UTC for database queries
  return new Date(todayResetGMT8.getTime() - gmt8Offset)
}

/**
 * Calculate the next reset time (for display to users)
 */
function getNextResetTime(): Date {
  const now = new Date()

  // Convert current time to GMT+8
  const gmt8Offset = 8 * 60 * 60 * 1000
  const nowGMT8 = new Date(now.getTime() + gmt8Offset)

  // Create today's reset time in GMT+8
  const todayResetGMT8 = new Date(nowGMT8)
  todayResetGMT8.setUTCHours(RESET_HOUR_GMT8, RESET_MINUTE_GMT8, 0, 0)

  // If we've already passed today's reset time, use tomorrow's reset
  if (nowGMT8.getTime() >= todayResetGMT8.getTime()) {
    todayResetGMT8.setUTCDate(todayResetGMT8.getUTCDate() + 1)
  }

  // Convert back to UTC
  return new Date(todayResetGMT8.getTime() - gmt8Offset)
}

/**
 * Format reset time for display (e.g., "12:00 AM GMT+8")
 */
function getResetTimeDisplay(): string {
  const hour = RESET_HOUR_GMT8
  const minute = RESET_MINUTE_GMT8
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour)
  const displayMinute = minute.toString().padStart(2, '0')
  return `${displayHour}:${displayMinute} ${period} GMT+8`
}

/**
 * Check if user can generate another quiz in the current period
 */
export async function checkQuizGenerationLimit(userId?: string, ipAddress?: string): Promise<RateLimitResult> {
  if (!userId) {
    return checkAnonymousUserLimit(ipAddress)
  }

  const supabase = await createClient()
  const periodStart = getCurrentPeriodStart()

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

    // Count usage since period start
    const { count, error } = await supabase
      .from('quiz_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString())

    if (error) {
      throw error
    }

    const currentUsage = count || 0
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
      resetTime: getNextResetTime(),
      reason: allowed ? undefined : `You've reached your ${dailyLimit}-quiz daily limit! Limits reset at ${getResetTimeDisplay()} daily.`
    }

  } catch (error) {
    console.error(`❌ Rate limit check failed:`, error)
    return {
      allowed: false,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage: 0,
        remainingQuizzes: 0,
        isUnlimited: false,
        limitType: 'default'
      },
      reason: 'Rate limit check failed. Please try again in a few minutes.'
    }
  }
}

/**
 * Record a quiz generation
 */
export async function recordQuizGeneration(userId?: string, ipAddress?: string): Promise<void> {
  if (!userId) {
    return recordAnonymousQuizGeneration(ipAddress)
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('quiz_usage')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    console.log(`✅ Quiz usage recorded for user: ${userId}`)

  } catch (error) {
    console.error(`❌ Failed to record quiz usage:`, error)
  }
}

/**
 * Check rate limit for anonymous users (IP-based)
 */
async function checkAnonymousUserLimit(ipAddress?: string): Promise<RateLimitResult> {
  if (!ipAddress) {
    return checkAnonymousUserLimitClientSide()
  }

  const supabase = await createClient()
  const periodStart = getCurrentPeriodStart()

  try {
    const { count, error } = await supabase
      .from('quiz_usage')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('created_at', periodStart.toISOString())

    if (error) {
      throw error
    }

    const currentUsage = count || 0
    const remainingQuizzes = Math.max(0, DEFAULT_DAILY_LIMIT - currentUsage)
    const allowed = currentUsage < DEFAULT_DAILY_LIMIT

    console.log(`📊 Anonymous rate limit - IP: ${ipAddress}, Usage: ${currentUsage}, Allowed: ${allowed}`)

    return {
      allowed,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage,
        remainingQuizzes,
        isUnlimited: false,
        limitType: 'default'
      },
      resetTime: getNextResetTime(),
      reason: allowed ? undefined : `You've reached your ${DEFAULT_DAILY_LIMIT}-quiz daily limit! Limits reset at ${getResetTimeDisplay()} daily.`
    }

  } catch (error) {
    console.error('Error checking anonymous rate limit:', error)
    return {
      allowed: false,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage: 0,
        remainingQuizzes: 0,
        isUnlimited: false,
        limitType: 'default'
      },
      reason: 'Rate limit check failed. Please try again in a few minutes.'
    }
  }
}

/**
 * Record quiz generation for anonymous user
 */
async function recordAnonymousQuizGeneration(ipAddress?: string): Promise<void> {
  if (!ipAddress) {
    return recordAnonymousQuizGenerationClientSide()
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('quiz_usage')
      .insert({
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to record anonymous quiz generation:', error)
    } else {
      console.log(`✅ Anonymous quiz usage recorded - IP: ${ipAddress}`)
    }

  } catch (error) {
    console.error(`❌ Error recording anonymous quiz generation:`, error)
  }
}

/**
 * Client-side rate limiting fallback (localStorage)
 */
function checkAnonymousUserLimitClientSide(): RateLimitResult {
  if (typeof window === 'undefined') {
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

  const periodStart = getCurrentPeriodStart()
  const storageKey = `quiz_usage_${periodStart.getTime()}`

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
    resetTime: getNextResetTime(),
    reason: allowed ? undefined : `You've reached your ${DEFAULT_DAILY_LIMIT}-quiz daily limit! Limits reset at ${getResetTimeDisplay()} daily.`
  }
}

/**
 * Record quiz generation client-side
 */
function recordAnonymousQuizGenerationClientSide(): void {
  if (typeof window === 'undefined') return

  const periodStart = getCurrentPeriodStart()
  const storageKey = `quiz_usage_${periodStart.getTime()}`

  const storedUsage = localStorage.getItem(storageKey)
  const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0

  localStorage.setItem(storageKey, (currentUsage + 1).toString())

  // Clean up old entries
  cleanupOldUsageEntries()
}

/**
 * Clean up old localStorage entries
 */
function cleanupOldUsageEntries(): void {
  if (typeof window === 'undefined') return

  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days ago

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith('quiz_usage_')) {
      const timestamp = parseInt(key.replace('quiz_usage_', ''), 10)
      if (timestamp < cutoff) {
        localStorage.removeItem(key)
      }
    }
  }
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

/**
 * Admin function to clear user's usage (for testing)
 */
export async function clearUserUsage(userId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('quiz_usage')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing user usage:', error)
      return false
    }

    console.log(`✅ Cleared all usage records for user: ${userId}`)
    return true
  } catch (error) {
    console.error('Error clearing user usage:', error)
    return false
  }
}
