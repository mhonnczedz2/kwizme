/**
 * React Hook for Supabase Realtime Sync
 * Provides easy-to-use real-time synchronization for React components
 */

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  subscribeToAllChanges,
  unsubscribeAll,
  type QuizSyncEvent,
  type SessionSyncEvent
} from '@/lib/supabase/realtime-sync'

export interface SyncStatus {
  isConnected: boolean
  lastSync: Date | null
  error: string | null
}

export interface UseRealtimeSyncOptions {
  enabled?: boolean
  onQuizChange?: (event: QuizSyncEvent) => void
  onSessionChange?: (event: SessionSyncEvent) => void
  onError?: (error: Error) => void
}

/**
 * Hook to enable real-time sync for authenticated users
 * Automatically subscribes/unsubscribes based on user auth state
 */
export function useRealtimeSync(
  user: User | null,
  options: UseRealtimeSyncOptions = {}
) {
  const {
    enabled = true,
    onQuizChange,
    onSessionChange,
    onError
  } = options

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    error: null
  })

  const [channels, setChannels] = useState<{
    quizChannel: RealtimeChannel
    sessionChannel: RealtimeChannel
  } | null>(null)

  // Handle quiz changes
  const handleQuizChange = useCallback((event: QuizSyncEvent) => {
    console.log('🔄 Quiz sync event:', event)
    setSyncStatus(prev => ({
      ...prev,
      lastSync: new Date()
    }))
    onQuizChange?.(event)
  }, [onQuizChange])

  // Handle session changes
  const handleSessionChange = useCallback((event: SessionSyncEvent) => {
    console.log('🔄 Session sync event:', event)
    setSyncStatus(prev => ({
      ...prev,
      lastSync: new Date()
    }))
    onSessionChange?.(event)
  }, [onSessionChange])

  // Subscribe to realtime changes when user logs in
  useEffect(() => {
    if (!user || !enabled) {
      // Clean up if user logs out or sync is disabled
      if (channels) {
        unsubscribeAll(channels)
        setChannels(null)
        setSyncStatus({
          isConnected: false,
          lastSync: null,
          error: null
        })
      }
      return
    }

    try {
      console.log('🔌 Setting up real-time sync for user:', user.id)

      const newChannels = subscribeToAllChanges(user.id, {
        onQuizChange: handleQuizChange,
        onSessionChange: handleSessionChange
      })

      setChannels(newChannels)
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        error: null
      }))

    } catch (error) {
      console.error('❌ Error setting up real-time sync:', error)
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      onError?.(error instanceof Error ? error : new Error('Unknown error'))
    }

    // Cleanup on unmount or user change
    return () => {
      if (channels) {
        console.log('🔌 Cleaning up real-time sync')
        unsubscribeAll(channels)
      }
    }
  }, [user?.id, enabled, handleQuizChange, handleSessionChange, onError])

  return syncStatus
}

/**
 * Simplified hook that just tells you if sync is active
 */
export function useSyncStatus(user: User | null): boolean {
  const status = useRealtimeSync(user, { enabled: !!user })
  return status.isConnected
}
