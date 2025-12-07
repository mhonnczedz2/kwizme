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
export async function checkQuizGenerationLimit(userId?: string, ipAddress?: string): Promise<RateLimitResult> {
  if (!userId) {
    // Anonymous user - check server-side IP-based limiting
    return checkAnonymousUserLimit(ipAddress)
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

    console.log(`📊 Rate limit check - User: ${userId || 'anonymous'}, IP: ${ipAddress || 'unknown'}, Current: ${currentUsage}, Limit: ${dailyLimit}, Allowed: ${allowed}`)

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
    console.error(`❌ Rate limit check failed - User: ${userId || 'anonymous'}, IP: ${ipAddress || 'unknown'}:`, error)

    // SECURITY: Fail secure - deny access when there are database errors
    // This prevents bypassing rate limits due to technical issues
    return {
      allowed: false,
      limits: {
        dailyLimit: DEFAULT_DAILY_LIMIT,
        currentUsage: 0, // Unknown due to error
        remainingQuizzes: 0,
        isUnlimited: false,
        limitType: 'default'
      },
      reason: 'Rate limit check failed. Please try again in a few minutes.'
    }
  }
}

/**
 * Record a quiz generation (increment usage counter)
 */
export async function recordQuizGeneration(userId?: string, ipAddress?: string): Promise<void> {
  if (!userId) {
    // Anonymous user - record server-side with IP
    return recordAnonymousQuizGeneration(ipAddress)
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Use only the increment function to avoid double counting
    const { error: rpcError } = await supabase.rpc('increment_quiz_count', {
      p_user_id: userId,
      p_date: today
    })

    if (rpcError) {
      throw new Error(`Failed to record quiz generation: ${rpcError.message}`)
    }

    console.log(`✅ Quiz usage recorded - User: ${userId || 'anonymous'}, IP: ${ipAddress || 'unknown'}`)

  } catch (error) {
    console.error(`❌ Failed to record quiz usage - User: ${userId || 'anonymous'}, IP: ${ipAddress || 'unknown'}:`, error)
    // Don't throw - generation should still succeed, but log the issue
    // This prevents users from being unable to generate quizzes due to tracking issues
  }
}

/**
 * Server-side limiting for anonymous users using IP address
 */
async function checkAnonymousUserLimit(ipAddress?: string): Promise<RateLimitResult> {
  // If no IP provided, fall back to client-side check
  if (!ipAddress) {
    return checkAnonymousUserLimitClientSide()
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Get today's usage for this IP
    const { data: usage, error } = await supabase
      .from('daily_usage')
      .select('quiz_count')
      .eq('ip_address', ipAddress)
      .eq('generated_date', today)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }

    const currentUsage = usage?.quiz_count || 0
    const remainingQuizzes = Math.max(0, DEFAULT_DAILY_LIMIT - currentUsage)
    const allowed = currentUsage < DEFAULT_DAILY_LIMIT

    console.log(`📊 Anonymous rate limit check - IP: ${ipAddress}, Current: ${currentUsage}, Limit: ${DEFAULT_DAILY_LIMIT}, Allowed: ${allowed}`)

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
      reason: allowed ? undefined : `You've reached your ${DEFAULT_DAILY_LIMIT}-quiz generation daily limit! Limits reset at 12:00 AM daily.`
    }

  } catch (error) {
    console.error('Error checking anonymous rate limit:', error)
    // Fail secure for anonymous users too
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
 * Record quiz generation for anonymous user using IP address
 */
async function recordAnonymousQuizGeneration(ipAddress?: string): Promise<void> {
  // If no IP provided, fall back to client-side recording
  if (!ipAddress) {
    return recordAnonymousQuizGenerationClientSide()
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Use the same increment function but with IP address
    const { error: rpcError } = await supabase.rpc('increment_quiz_count_ip', {
      p_ip_address: ipAddress,
      p_date: today
    })

    if (rpcError) {
      console.error('Failed to record anonymous quiz generation:', rpcError.message)
    } else {
      console.log(`✅ Anonymous quiz usage recorded - IP: ${ipAddress}`)
    }

  } catch (error) {
    console.error(`❌ Error recording anonymous quiz generation - IP: ${ipAddress}:`, error)
    // Don't throw - generation should still succeed
  }
}

/**
 * Client-side limiting for anonymous users (fallback)
 */
function checkAnonymousUserLimitClientSide(): RateLimitResult {
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
    reason: allowed ? undefined : `You've reached your ${DEFAULT_DAILY_LIMIT}-quiz generation daily limit! Limits reset at 12:00 AM daily.`
  }
}

/**
 * Record quiz generation for anonymous user (client-side fallback)
 */
function recordAnonymousQuizGenerationClientSide(): void {
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