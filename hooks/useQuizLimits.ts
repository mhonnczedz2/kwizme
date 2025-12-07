import { useState, useEffect } from 'react'

export interface UsageLimits {
  dailyLimit: number
  currentUsage: number
  remainingQuizzes: number
  isUnlimited: boolean
  canGenerateToday: boolean
}

export interface UsageDashboard {
  user: {
    id: string
    email?: string
    fullName?: string
  }
  limits: UsageLimits
  usageHistory: Array<{
    generated_date: string
    quiz_count: number
  }>
  resetTime: string
}

export function useQuizLimits() {
  const [usage, setUsage] = useState<UsageDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/usage-dashboard')

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in - they can still generate quizzes with browser limits
          setUsage(null)
          return
        }
        throw new Error('Failed to fetch usage data')
      }

      const data = await response.json()
      setUsage(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching usage limits:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check if user can generate quiz (for anonymous users, check localStorage)
  const canGenerateQuiz = (): boolean => {
    if (usage) {
      return usage.limits.canGenerateToday
    }

    // Anonymous user - check browser storage
    if (typeof window === 'undefined') return true

    const today = new Date().toISOString().split('T')[0]
    const storageKey = `quiz_usage_${today}`
    const storedUsage = localStorage.getItem(storageKey)
    const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0

    return currentUsage < 5 // Default limit for anonymous users
  }

  // Get remaining quizzes for display
  const getRemainingQuizzes = (): number => {
    if (usage) {
      return usage.limits.remainingQuizzes
    }

    // Anonymous user calculation
    if (typeof window === 'undefined') return 5

    const today = new Date().toISOString().split('T')[0]
    const storageKey = `quiz_usage_${today}`
    const storedUsage = localStorage.getItem(storageKey)
    const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0

    return Math.max(0, 5 - currentUsage)
  }

  // Get usage message for display
  const getUsageMessage = (): string => {
    if (usage) {
      const { limits } = usage

      if (limits.isUnlimited) {
        return 'You have unlimited quiz generation!'
      }

      if (!limits.canGenerateToday) {
        return `You've reached your ${limits.dailyLimit}-quiz generation daily limit! Limits reset at 12:00 AM daily.`
      }

      return `You have ${limits.remainingQuizzes} quiz${limits.remainingQuizzes === 1 ? '' : 's'} remaining today. Limits reset at 12:00 AM daily.`
    }

    // Anonymous user message
    const remaining = getRemainingQuizzes()
    if (remaining === 0) {
      return `You've reached your 5-quiz generation daily limit! Limits reset at 12:00 AM daily.`
    }

    return `You have ${remaining} quiz${remaining === 1 ? '' : 's'} remaining today. Limits reset at 12:00 AM daily.`
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  return {
    usage,
    loading,
    error,
    canGenerateQuiz,
    getRemainingQuizzes,
    getUsageMessage,
    refetch: fetchUsage
  }
}

// Helper hook for admin functions
export function useAdminLimits() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setUserLimit = async (
    targetUserId: string,
    dailyLimit: number,
    isUnlimited: boolean = false,
    reason: string = 'custom',
    expiresAt?: Date
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/user-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          dailyLimit,
          isUnlimited,
          reason,
          expiresAt: expiresAt?.toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set user limits')
      }

      const result = await response.json()
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getUserLimits = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/user-limits?userId=${userId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch user limits')
      }

      return await response.json()
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setUserLimit,
    getUserLimits
  }
}